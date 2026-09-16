import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createOrderSchema,
  listAllOrdersQuerySchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from './orders.schemas.js';
import * as orders from './orders.service.js';

const router = Router();

router.post('/', requireAuth, validate({ body: createOrderSchema }), async (req, res) => {
  res.status(201).json(await orders.createOrder(req.user.id, req.valid.body));
});

router.get('/', requireAuth, validate({ query: listOrdersQuerySchema }), async (req, res) => {
  res.json(await orders.listMyOrders(req.user.id, req.valid.query));
});

// Registrada antes de /:orderId para que "all" no se interprete como un orderId.
router.get('/all', requireAuth, requireRole('admin'), validate({ query: listAllOrdersQuerySchema }), async (req, res) => {
  res.json(await orders.listAllOrders(req.valid.query));
});

router.get('/:orderId', requireAuth, validate({ params: orderIdParamSchema }), async (req, res) => {
  res.json(await orders.getOrder(req.valid.params.orderId, req.user));
});

router.patch(
  '/:orderId/status',
  requireAuth,
  requireRole('admin'),
  validate({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  async (req, res) => {
    res.json(await orders.updateOrderStatus(req.valid.params.orderId, req.valid.body.status));
  },
);

export default router;
