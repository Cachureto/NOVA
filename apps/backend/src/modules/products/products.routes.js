import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, listProductsQuerySchema, productIdParamSchema, updateProductSchema } from './products.schemas.js';
import * as products from './products.service.js';

const router = Router();

router.get('/', validate({ query: listProductsQuerySchema }), async (req, res) => {
  res.json(await products.listProducts(req.valid.query));
});

router.get('/:idOrSlug', validate({ params: productIdParamSchema }), async (req, res) => {
  res.json(await products.getProductByIdOrSlug(req.valid.params.idOrSlug));
});

router.post('/', requireAuth, requireRole('admin'), validate({ body: createProductSchema }), async (req, res) => {
  res.status(201).json(await products.createProduct(req.valid.body));
});

router.patch(
  '/:idOrSlug',
  requireAuth,
  requireRole('admin'),
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  async (req, res) => {
    res.json(await products.updateProduct(req.valid.params.idOrSlug, req.valid.body));
  },
);

router.delete('/:idOrSlug', requireAuth, requireRole('admin'), validate({ params: productIdParamSchema }), async (req, res) => {
  await products.deleteProduct(req.valid.params.idOrSlug);
  res.status(204).end();
});

export default router;
