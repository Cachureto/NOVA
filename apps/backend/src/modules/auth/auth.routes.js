import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas.js';
import * as auth from './auth.service.js';

const router = Router();

const REFRESH_COOKIE = 'nova_rt';

// Máx. 20 intentos cada 15 min por IP en login/registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, espera unos minutos' },
});

// Web: refresh token en cookie httpOnly (JavaScript no puede leerla).
// Móvil: se devuelve en el JSON y la app lo guarda en expo-secure-store.
function sendSession(res, status, { user, accessToken, refreshToken, refreshExpiresAt }, client) {
  if (client === 'web') {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      path: '/api/auth',
      expires: refreshExpiresAt,
    });
    return res.status(status).json({ user, accessToken });
  }
  return res.status(status).json({ user, accessToken, refreshToken });
}

router.post('/register', authLimiter, validate({ body: registerSchema }), async (req, res) => {
  const session = await auth.register(req.valid.body);
  sendSession(res, 201, session, req.valid.body.client);
});

router.post('/login', authLimiter, validate({ body: loginSchema }), async (req, res) => {
  const session = await auth.login(req.valid.body);
  sendSession(res, 200, session, req.valid.body.client);
});

router.post('/refresh', validate({ body: refreshSchema }), async (req, res) => {
  const { client, refreshToken } = req.valid.body;
  const token = client === 'web' ? req.cookies[REFRESH_COOKIE] : refreshToken;
  const session = await auth.refresh(token, client);
  sendSession(res, 200, session, client);
});

router.post('/logout', validate({ body: refreshSchema }), async (req, res) => {
  const { client, refreshToken } = req.valid.body;
  const token = client === 'web' ? req.cookies[REFRESH_COOKIE] : refreshToken;
  await auth.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.status(204).end();
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await auth.getMe(req.user.id) });
});

export default router;