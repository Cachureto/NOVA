import { query, withTransaction } from '../../db/pool.js';
import { badRequest, notFound } from '../../utils/httpError.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORDER_BY = {
  newest: 'p.created_at DESC',
  price_asc: 'vc.price_cents ASC',
  price_desc: 'vc.price_cents DESC',
  rating: 'vc.avg_rating DESC',
};

const mapProduct = (r) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  brand: r.brand,
  category: { slug: r.category_slug, name: r.category_name },
  description: r.description,
  priceCents: Number(r.price_cents),
  currency: r.currency,
  stock: r.stock,
  attributes: r.attributes,
  authenticityCode: r.authenticity_code,
  authenticityStatus: r.authenticity_status,
  coverUrl: r.cover_url,
  rating: Number(r.avg_rating),
  reviewCount: Number(r.review_count),
  createdAt: r.created_at,
});

// El catálogo se sirve desde v_catalog (ya trae rating/cover agregados);
// se une a products solo para poder ordenar por fecha de creación.
export async function listProducts({ category, minPrice, maxPrice, q, sort, page, limit }) {
  const params = [];
  const conditions = [];
  const push = (v) => (params.push(v), `$${params.length}`);

  if (category) conditions.push(`vc.category_slug = ${push(category)}`);
  if (minPrice !== undefined) conditions.push(`vc.price_cents >= ${push(minPrice)}`);
  if (maxPrice !== undefined) conditions.push(`vc.price_cents <= ${push(maxPrice)}`);
  // OR por palabra en vez de plainto_tsquery (que exige TODAS las palabras):
  // una búsqueda conversacional como "cargador rápido para el carro" no debe fallar
  // solo porque el catálogo no repite literalmente todas las palabras.
  if (q) {
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length) {
      const orTsQuery = words.map((w) => `plainto_tsquery('spanish', immutable_unaccent(${push(w)}))`).join(' || ');
      // Coincidencia parcial en el nombre para palabras de 4+ letras ("carga" encuentra "Cargador"),
      // porque el stemming en español no une palabras de la misma familia.
      const nameMatches = words
        .filter((w) => w.length >= 4)
        .map((w) => `immutable_unaccent(vc.name) ILIKE '%' || immutable_unaccent(${push(w.replace(/[\\%_]/g, '\\$&'))}) || '%'`);
      conditions.push(`(vc.search_vector @@ (${orTsQuery})${nameMatches.map((m) => ` OR ${m}`).join('')})`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const { rows } = await query(
    `SELECT vc.*, p.created_at, count(*) OVER() AS total_count
     FROM v_catalog vc
     JOIN products p ON p.id = vc.id
     ${where}
     ORDER BY ${ORDER_BY[sort]}
     LIMIT ${push(limit)} OFFSET ${push(offset)}`,
    params,
  );

  return {
    items: rows.map(mapProduct),
    total: rows[0] ? Number(rows[0].total_count) : 0,
    page,
    limit,
  };
}

export async function getProductByIdOrSlug(idOrSlug) {
  const isId = UUID_RE.test(idOrSlug);
  const { rows } = await query(
    `SELECT vc.*, p.created_at FROM v_catalog vc
     JOIN products p ON p.id = vc.id
     WHERE ${isId ? 'vc.id' : 'vc.slug'} = $1`,
    [idOrSlug],
  );
  if (!rows[0]) throw notFound('Producto no encontrado');
  const product = mapProduct(rows[0]);

  const { rows: images } = await query(
    'SELECT url, alt_text AS "altText", position FROM product_images WHERE product_id = $1 ORDER BY position',
    [product.id],
  );
  return { ...product, images };
}

async function resolveCategoryId(db, categorySlug) {
  const { rows } = await db.query('SELECT id FROM categories WHERE slug = $1', [categorySlug]);
  if (!rows[0]) throw badRequest(`La categoría "${categorySlug}" no existe`);
  return rows[0].id;
}

export async function createProduct(input) {
  const productId = await withTransaction(async (db) => {
    const categoryId = await resolveCategoryId(db, input.categorySlug);
    const { rows } = await db.query(
      `INSERT INTO products (name, slug, category_id, brand, description, price_cents, currency, stock, authenticity_code, attributes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        input.name,
        input.slug,
        categoryId,
        input.brand ?? null,
        input.description,
        input.priceCents,
        input.currency,
        input.stock,
        input.authenticityCode,
        input.attributes,
      ],
    );
    const id = rows[0].id;
    for (const [position, img] of input.images.entries()) {
      await db.query('INSERT INTO product_images (product_id, url, alt_text, position) VALUES ($1,$2,$3,$4)', [
        id,
        img.url,
        img.altText ?? null,
        position,
      ]);
    }
    return id;
  });

  return getProductByIdOrSlug(productId);
}

const UPDATABLE_COLUMNS = {
  name: 'name',
  brand: 'brand',
  description: 'description',
  priceCents: 'price_cents',
  currency: 'currency',
  stock: 'stock',
  authenticityCode: 'authenticity_code',
  attributes: 'attributes',
  slug: 'slug',
};

export async function updateProduct(idOrSlug, input) {
  const isId = UUID_RE.test(idOrSlug);
  const productId = await withTransaction(async (db) => {
    const { rows: existing } = await db.query(
      `SELECT id FROM products WHERE ${isId ? 'id' : 'slug'} = $1 FOR UPDATE`,
      [idOrSlug],
    );
    if (!existing[0]) throw notFound('Producto no encontrado');
    const id = existing[0].id;

    const sets = [];
    const params = [];
    const push = (v) => (params.push(v), `$${params.length}`);

    for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
      if (input[key] === undefined) continue;
      sets.push(`${column} = ${push(input[key])}`);
    }
    if (input.categorySlug !== undefined) {
      sets.push(`category_id = ${push(await resolveCategoryId(db, input.categorySlug))}`);
    }
    if (sets.length) {
      params.push(id);
      await db.query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
    }

    if (input.images !== undefined) {
      await db.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      for (const [position, img] of input.images.entries()) {
        await db.query('INSERT INTO product_images (product_id, url, alt_text, position) VALUES ($1,$2,$3,$4)', [
          id,
          img.url,
          img.altText ?? null,
          position,
        ]);
      }
    }

    return id;
  });

  return getProductByIdOrSlug(productId);
}

export async function deleteProduct(idOrSlug) {
  const isId = UUID_RE.test(idOrSlug);
  const { rows } = await query(`DELETE FROM products WHERE ${isId ? 'id' : 'slug'} = $1 RETURNING id`, [idOrSlug]);
  if (!rows[0]) throw notFound('Producto no encontrado');
}
