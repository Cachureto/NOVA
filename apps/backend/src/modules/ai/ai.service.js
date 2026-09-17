import crypto from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env.js';
import { query } from '../../db/pool.js';
import { badRequest, serviceUnavailable } from '../../utils/httpError.js';
import { listProducts } from '../products/products.service.js';

const client = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

// El modelo NUNCA describe productos por su cuenta: su único trabajo es traducir
// lenguaje natural a filtros estructurados. Los nombres, precios y stock que ve
// el usuario siempre vienen de `listProducts` (datos reales de PostgreSQL).
// Las categorías se leen de la base de datos (no quemadas en el código): si el admin crea
// "Cargadores" o "Power Banks", la IA puede usarlas de inmediato. Se cachean 5 minutos.
const CATEGORY_CACHE_MS = 5 * 60 * 1000;
let categoryCache = { loadedAt: 0, items: [] };

async function getCategories() {
  if (categoryCache.items.length && Date.now() - categoryCache.loadedAt < CATEGORY_CACHE_MS) {
    return categoryCache.items;
  }
  const { rows } = await query('SELECT slug, name FROM categories ORDER BY name');
  categoryCache = { loadedAt: Date.now(), items: rows };
  return rows;
}

function buildSearchFunction(categories) {
  const properties = {
    query: {
      type: Type.STRING,
      description:
        'Solo el tipo de producto o sus características clave, en 1 a 3 palabras y sin verbos ni relleno. ' +
        'Ej: "cargador", "power bank", "soporte moto". Omítelo si el usuario solo pide una categoría.',
    },
    minPriceCents: { type: Type.INTEGER, description: 'Precio mínimo en pesos COP (ej. 50000)' },
    maxPriceCents: { type: Type.INTEGER, description: 'Precio máximo en pesos COP (ej. 80000)' },
  };

  if (categories.length) {
    properties.category = {
      type: Type.STRING,
      enum: categories.map((c) => c.slug),
      description:
        'Categoría del catálogo. Úsala solo si una corresponde claramente a lo que pide el usuario. ' +
        `Opciones (slug = nombre): ${categories.map((c) => `${c.slug} = ${c.name}`).join('; ')}`,
    };
  }

  return {
    name: 'search_products',
    description: 'Busca productos reales en el catálogo de NOVA por palabras clave, categoría y rango de precio.',
    parameters: { type: Type.OBJECT, properties },
  };
}

const SYSTEM_PROMPT = `Eres el módulo de comprensión de búsqueda de NOVA, una tienda de tecnología urbana, accesorios y hogar.
Tu única tarea es traducir el mensaje del usuario en una llamada a la función search_products con los filtros
correctos: palabras clave cortas del producto, la categoría que corresponda (solo si encaja claramente) y el rango
de precio en pesos COP. No conoces el catálogo real de NOVA: nunca inventes ni menciones nombres de productos,
precios o stock, eso lo resuelve el sistema con datos reales.`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini devuelve 503 "UNAVAILABLE" con cierta frecuencia cuando el modelo está
// saturado; son picos cortos, así que reintentamos un par de veces con backoff
// antes de rendirnos y avisarle al usuario que el asistente está ocupado.
function isTransient(err) {
  return err?.status === 503 || /UNAVAILABLE/i.test(err?.message ?? '');
}

// 429 = se agotó la cuota (ej. el tier gratis de Gemini son 20 solicitudes/día
// por modelo). Reintentar de inmediato no sirve de nada, así que avisamos directo.
function isQuotaExceeded(err) {
  return err?.status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(err?.message ?? '');
}

async function extractFilters(message, searchFunction) {
  if (!client) throw badRequest('El asistente de IA no está configurado (falta GEMINI_API_KEY)');

  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: env.AI_MODEL,
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: [searchFunction] }],
          toolConfig: {
            functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['search_products'] },
          },
        },
      });
      return response.functionCalls?.[0]?.args ?? {};
    } catch (err) {
      if (isQuotaExceeded(err)) {
        throw serviceUnavailable(
          'El asistente de IA alcanzó su cuota diaria gratuita de Gemini. Vuelve a intentarlo más tarde o usa una clave con más cuota.',
        );
      }
      if (!isTransient(err) || attempt === attempts) {
        if (isTransient(err)) {
          throw serviceUnavailable('El asistente de IA está saturado en este momento, intenta de nuevo en unos segundos.');
        }
        throw err;
      }
      await sleep(500 * attempt);
    }
  }
}

function formatCOP(cents) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents);
}

function buildReply(products, relaxed) {
  if (products.length === 0) {
    return 'No encontré productos reales de NOVA que coincidan con tu búsqueda. Prueba con otras palabras, otra categoría o un rango de precio distinto.';
  }
  const lines = products.map(
    (p) => `• ${p.name} — ${formatCOP(p.priceCents)} — stock: ${p.stock} unidad${p.stock === 1 ? '' : 'es'}`,
  );
  const intro = relaxed
    ? `No encontré una coincidencia exacta, pero estos ${products.length} producto${products.length === 1 ? '' : 's'} reales de NOVA se acercan a lo que buscas:`
    : `Encontré ${products.length} producto${products.length === 1 ? '' : 's'} de NOVA para ti:`;
  return [intro, ...lines].join('\n');
}

// La IA a veces elige una categoría que no encaja (o palabras que no aparecen en el catálogo).
// En vez de responder "no encontré nada", se relajan los filtros en orden, siempre sobre la BD real
// y respetando el presupuesto del usuario:
//   1) todos los filtros  2) sin la categoría  3) solo la categoría (sin palabras clave)
async function searchCatalog(filters) {
  const q = filters.query?.trim() || undefined;
  const category = filters.category || undefined;
  const base = {
    minPrice: filters.minPriceCents ?? undefined,
    maxPrice: filters.maxPriceCents ?? undefined,
    sort: 'newest',
    page: 1,
    limit: 5,
  };

  const attempts = [{ q, category }];
  if (q && category) attempts.push({ q }, { category });

  for (const [index, attempt] of attempts.entries()) {
    const { items } = await listProducts({ ...base, ...attempt });
    if (items.length > 0) return { items, relaxed: index > 0 };
  }
  return { items: [], relaxed: false };
}

export async function conversationalSearch({ message, conversationId }, userId) {
  const convId = conversationId ?? crypto.randomUUID();
  const startedAt = Date.now();

  const filters = await extractFilters(message, buildSearchFunction(await getCategories()));
  const { items, relaxed } = await searchCatalog(filters);

  await query(
    `INSERT INTO ai_tool_calls (conversation_id, user_id, tool_name, arguments, result_ids, latency_ms)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [convId, userId ?? null, 'search_products', { ...filters, relaxed }, items.map((p) => p.id), Date.now() - startedAt],
  );

  return {
    conversationId: convId,
    reply: buildReply(items, relaxed),
    products: items.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      priceCents: p.priceCents,
      stock: p.stock,
      coverUrl: p.coverUrl,
      authenticityStatus: p.authenticityStatus,
    })),
  };
}
