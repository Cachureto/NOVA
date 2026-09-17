import { Router } from 'express';
import { query } from '../../db/pool.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema } from './categories.schemas.js';

const router = Router();

// Incluye cuántos productos publicados tiene cada categoría y la foto del más reciente,
// así el home no necesita una consulta extra por categoría.
router.get('/', async (_req, res) => {
  const { rows } = await query(
    `SELECT c.slug, c.name,
            COUNT(p.id)::int AS "productCount",
            (SELECT i.url
               FROM products p2
               JOIN product_images i ON i.product_id = p2.id
              WHERE p2.category_id = c.id AND p2.is_published
              ORDER BY p2.created_at DESC, i.position
              LIMIT 1) AS "coverUrl"
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_published
      GROUP BY c.id
      ORDER BY c.name`,
  );
  res.json({ items: rows });
});

router.post('/', requireAuth, requireRole('admin'), validate({ body: createCategorySchema }), async (req, res) => {
  const { name, slug } = req.valid.body;
  const { rows } = await query('INSERT INTO categories (slug, name) VALUES ($1,$2) RETURNING slug, name', [
    slug,
    name,
  ]);
  res.status(201).json(rows[0]);
});

export default router;
