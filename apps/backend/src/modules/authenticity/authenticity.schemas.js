import { z } from 'zod';

export const validateCodeSchema = z.object({
  code: z.string().trim().min(4).max(64),
  source: z.enum(['web', 'mobile']).default('web'),
});
