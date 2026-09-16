import { z } from 'zod';

export const listProductsQuerySchema = z
  .object({
    category: z.string().trim().toLowerCase().optional(),
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
    q: z.string().trim().min(1).max(120).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating']).default('newest'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(60).default(20),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    message: 'minPrice no puede ser mayor que maxPrice',
    path: ['minPrice'],
  });

export const productIdParamSchema = z.object({
  idOrSlug: z.string().trim().min(1),
});

const image = z.object({
  url: z.url(),
  altText: z.string().max(200).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(180)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  categorySlug: z.string().trim().toLowerCase(),
  brand: z.string().trim().max(80).optional(),
  description: z.string().trim().max(5000).default(''),
  priceCents: z.coerce.number().int().nonnegative(),
  currency: z.string().length(3).default('COP'),
  stock: z.coerce.number().int().nonnegative().default(0),
  authenticityCode: z
    .string()
    .trim()
    .regex(/^NVP-[A-Z0-9-]{8,60}$/, 'Formato: NVP-XXXXXXXX'),
  attributes: z.record(z.string(), z.unknown()).default({}),
  images: z.array(image).default([]),
});

export const updateProductSchema = createProductSchema.partial();
