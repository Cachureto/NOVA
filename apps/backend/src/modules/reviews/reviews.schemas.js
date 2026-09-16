import { z } from 'zod';

export const productIdParamSchema = z.object({
  productId: z.uuid('id de producto inválido'),
});

export const reviewIdParamSchema = z.object({
  reviewId: z.uuid('id de reseña inválido'),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  photoUrl: z.url().optional(),
});
