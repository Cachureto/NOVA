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
const SEARCH_FUNCTION = {
  name: 'search_products',
  description:
    'Busca productos reales en el catálogo de NOVA (sneakers, ropa urbana, audio, wearables, accesorios) por texto libre, categoría y rango de precio.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Palabras clave del producto, ej. "audífonos para correr"' },
      category: {
        type: Type.STRING,
        enum: ['sneakers', 'apparel', 'audio', 'wearables', 'accessories'],
      },
      minPriceCents: { type: Type.INTEGER, description: 'Precio mínimo en pesos COP' },
      maxPriceCents: { type: Type.INTEGER, description: 'Precio máximo en pesos COP' },
    },
  },
};

const SYSTEM_PROMPT = `Eres el módulo de comprensión de búsqueda de NOVA, una tienda de sneakers y tecnología urbana.
Tu única tarea es traducir el mensaje del usuario en una llamada a la función search_products con los filtros
correctos (texto de búsqueda, categoría y rango de precio en pesos COP). No conoces el catálogo real de NOVA:
nunca inventes ni menciones nombres de productos, precios o stock, eso lo resuelve el sistema con datos reales.`;

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

async function extractFilters(message) {
  if (!client) throw badRequest('El asistente de IA no está configurado (falta GEMINI_API_KEY)');

  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: env.AI_MODEL,
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: [SEARCH_FUNCTION] }],
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

function buildReply(products) {
  if (products.length === 0) {
    return 'No encontré productos reales de NOVA que coincidan con tu búsqueda. Prueba con otra categoría o un rango de precio distinto.';
  }
  const lines = products.map(
    (p) => `• ${p.name} — ${formatCOP(p.priceCents)} — stock: ${p.stock} unidad${p.stock === 1 ? '' : 'es'}`,
  );
  return [`Encontré ${products.length} producto${products.length === 1 ? '' : 's'} de NOVA para ti:`, ...lines].join('\n');
}

export async function conversationalSearch({ message, conversationId }, userId) {
  const convId = conversationId ?? crypto.randomUUID();
  const startedAt = Date.now();

  const filters = await extractFilters(message);

  const { items } = await listProducts({
    category: filters.category,
    minPrice: filters.minPriceCents,
    maxPrice: filters.maxPriceCents,
    q: filters.query || undefined,
    sort: 'newest',
    page: 1,
    limit: 5,
  });

  await query(
    `INSERT INTO ai_tool_calls (conversation_id, user_id, tool_name, arguments, result_ids, latency_ms)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [convId, userId ?? null, 'search_products', filters, items.map((p) => p.id), Date.now() - startedAt],
  );

  return {
    conversationId: convId,
    reply: buildReply(items),
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
