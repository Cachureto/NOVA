import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.coerce.number().int().positive().max(20),
      }),
    )
    .min(1, 'El pedido debe tener al menos un producto'),
  shippingAddress: z.record(z.string(), z.unknown()).optional(),
  shippingCents: z.coerce.number().int().nonnegative().default(0),
});

export const orderIdParamSchema = z.object({
  orderId: z.uuid(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const listAllOrdersQuerySchema = listOrdersQuerySchema.extend({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
});
