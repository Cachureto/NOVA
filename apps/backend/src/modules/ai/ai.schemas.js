import { z } from 'zod';

export const searchSchema = z.object({
  message: z.string().trim().min(2, 'Escribe qué estás buscando').max(500),
  conversationId: z.uuid().optional(),
});
