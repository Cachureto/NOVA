import { z } from 'zod';

const client = z.enum(['web', 'mobile']).default('web');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  email: z.email('Email inválido').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Máximo 72 caracteres')
    .regex(/[A-Za-z]/, 'Debe tener al menos una letra')
    .regex(/\d/, 'Debe tener al menos un número'),
  client,
});

export const loginSchema = z.object({
  email: z.email('Email inválido').trim().toLowerCase(),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  client,
});

// La web manda el refresh token en cookie; el móvil lo manda en el body
export const refreshSchema = z.object({
  refreshToken: z.string().min(20).optional(),
  client,
});