import { query } from '../../db/pool.js';
import { conflict, forbidden, notFound } from '../../utils/httpError.js';

const mapReview = (r) => ({
  id: r.id,
  productId: r.product_id,
  user: { id: r.user_id, name: r.user_name },
  rating: r.rating,
  comment: r.comment,
  photoUrl: r.photo_url,
  verifiedPurchase: r.verified_purchase,
  createdAt: r.created_at,
});

export async function listReviews(productId, { page, limit }) {
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT r.*, u.name AS user_name, count(*) OVER() AS total_count
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [productId, limit, offset],
  );
  return {
    items: rows.map(mapReview),
    total: rows[0] ? Number(rows[0].total_count) : 0,
    page,
    limit,
  };
}

// Una reseña queda marcada como "compra verificada" si el usuario tiene
// al menos un pedido pagado/enviado/entregado que incluya ese producto.
async function hasVerifiedPurchase(userId, productId) {
  const { rows } = await query(
    `SELECT 1 FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status IN ('paid', 'shipped', 'delivered')
     LIMIT 1`,
    [userId, productId],
  );
  return rows.length > 0;
}

export async function createReview(productId, userId, { rating, comment, photoUrl }) {
  const { rows: product } = await query('SELECT id FROM products WHERE id = $1', [productId]);
  if (!product[0]) throw notFound('Producto no encontrado');

  const verified = await hasVerifiedPurchase(userId, productId);

  try {
    const { rows } = await query(
      `INSERT INTO reviews (product_id, user_id, rating, comment, photo_url, verified_purchase)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name`,
      [productId, userId, rating, comment ?? null, photoUrl ?? null, verified],
    );
    return mapReview(rows[0]);
  } catch (err) {
    if (err.code === '23505') throw conflict('Ya dejaste una reseña para este producto');
    throw err;
  }
}

export async function deleteReview(reviewId, requester) {
  const { rows } = await query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
  if (!rows[0]) throw notFound('Reseña no encontrada');
  if (rows[0].user_id !== requester.id && requester.role !== 'admin') throw forbidden();
  await query('DELETE FROM reviews WHERE id = $1', [reviewId]);
}
