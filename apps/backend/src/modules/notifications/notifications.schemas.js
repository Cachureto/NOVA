import { z } from 'zod';

// Formato de los tokens de Expo: ExponentPushToken[xxxxxxxx] o ExpoPushToken[...]
const expoToken = z
  .string()
  .trim()
  .min(10)
  .max(255)
  .regex(/^Expo(nent)?PushToken\[[^\]]+\]$/, 'No parece un token de Expo');

export const registerTokenSchema = z.object({
  expoToken,
  platform: z.enum(['ios', 'android', 'web']).default('android'),
  notifyDrops: z.boolean().default(true),
});

export const removeTokenSchema = z.object({ expoToken });
