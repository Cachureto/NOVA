import { query, withTransaction } from '../../db/pool.js';
import { conflict, forbidden, notFound } from '../../utils/httpError.js';

const mapOrder = (o, items) => ({
  id: o.id,
  status: o.status,
  subtotalCents: Number(o.subtotal_cents),
  shippingCents: Number(o.shipping_cents),
  totalCents: Number(o.total_cents),
  currency: o.currency,
  shippingAddress: o.shipping_address,
  createdAt: o.created_at,
  // Solo presentes cuando la fila viene de un JOIN con users (listado de admin)
  ...(o.user_name !== undefined ? { user: { id: o.user_id, name: o.user_name, email: o.user_email } } : {}),
  items: items.map((i) => ({
    id: i.id,
    productId: i.product_id,
    productName: i.product_name,
    quantity: i.quantity,
    unitPriceCents: Number(i.unit_price_cents),
  })),
});

// El precio y el stock siempre se leen y descuentan dentro de la misma
// transacción (FOR UPDATE) desde `products`: nunca se confía en lo que
// mande el cliente para el precio del pedido.
export async function createOrder(userId, { items, shippingAddress, shippingCents }) {
  return withTransaction(async (db) => {
    const productIds = items.map((i) => i.productId);
    const { rows: products } = await db.query(
      `SELECT id, name, price_cents, stock, is_published
       FROM products WHERE id = ANY($1::uuid[]) FOR UPDATE`,
      [productIds],
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotalCents = 0;
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product || !product.is_published) throw notFound(`Producto ${item.productId} no disponible`);
      if (product.stock < item.quantity) throw conflict(`Stock insuficiente para "${product.name}"`);
      subtotalCents += Number(product.price_cents) * item.quantity;
    }

    const { rows: orderRows } = await db.query(
      `INSERT INTO orders (user_id, subtotal_cents, shipping_cents, shipping_address)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [userId, subtotalCents, shippingCents, shippingAddress ?? null],
    );
    const order = orderRows[0];

    const insertedItems = [];
    for (const item of items) {
      const product = byId.get(item.productId);
      const { rows } = await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, product_name)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [order.id, product.id, item.quantity, product.price_cents, product.name],
      );
      insertedItems.push(rows[0]);
      await db.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, product.id]);
    }

    return mapOrder(order, insertedItems);
  });
}

async function fetchOrder(orderId) {
  const { rows: orders } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!orders[0]) throw notFound('Pedido no encontrado');
  const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  return mapOrder(orders[0], items);
}

export async function getOrder(orderId, requester) {
  const { rows: orders } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = orders[0];
  if (!order) throw notFound('Pedido no encontrado');
  if (order.user_id !== requester.id && requester.role !== 'admin') throw forbidden();
  const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  return mapOrder(order, items);
}

export async function listMyOrders(userId, { page, limit }) {
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT *, count(*) OVER() AS total_count FROM orders
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  const items = await Promise.all(
    rows.map(async (o) => {
      const { rows: oi } = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      return mapOrder(o, oi);
    }),
  );
  return { items, total: rows[0] ? Number(rows[0].total_count) : 0, page, limit };
}

export async function listAllOrders({ page, limit, status }) {
  const params = [];
  const push = (v) => (params.push(v), `$${params.length}`);
  const where = status ? `WHERE o.status = ${push(status)}` : '';
  const offset = (page - 1) * limit;

  const { rows } = await query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email, count(*) OVER() AS total_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ${push(limit)} OFFSET ${push(offset)}`,
    params,
  );
  const items = await Promise.all(
    rows.map(async (o) => {
      const { rows: oi } = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      return mapOrder(o, oi);
    }),
  );
  return { items, total: rows[0] ? Number(rows[0].total_count) : 0, page, limit };
}

const RESTOCK_STATUSES = new Set(['cancelled', 'refunded']);

export async function updateOrderStatus(orderId, status) {
  await withTransaction(async (db) => {
    const { rows } = await db.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    const order = rows[0];
    if (!order) throw notFound('Pedido no encontrado');

    // Solo se repone stock al entrar a cancelled/refunded desde un estado que no lo era.
    if (RESTOCK_STATUSES.has(status) && !RESTOCK_STATUSES.has(order.status)) {
      const { rows: items } = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
      for (const item of items) {
        await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
    }

    await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
  });

  return fetchOrder(orderId);
}
