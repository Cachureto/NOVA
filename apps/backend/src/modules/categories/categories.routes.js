import { Router } from 'express';
import { query } from '../../db/pool.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema } from './categories.schemas.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await query('SELECT slug, name FROM categories ORDER BY name');
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
