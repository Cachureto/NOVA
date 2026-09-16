import { z } from 'zod';

export const listDropsQuerySchema = z.object({
  status: z.enum(['scheduled', 'live', 'sold_out', 'ended', 'cancelled']).optional(),
});

export const dropIdParamSchema = z.object({
  idOrSlug: z.string().trim().min(1),
});

export const createDropSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(180)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  description: z.string().trim().max(5000).default(''),
  coverUrl: z.url().optional(),
  launchAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  productIds: z.array(z.uuid()).min(1, 'Selecciona al menos un producto'),
});

export const updateDropStatusSchema = z.object({
  status: z.enum(['scheduled', 'live', 'sold_out', 'ended', 'cancelled']),
});
