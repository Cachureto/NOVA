import { verifyAccessToken } from '../utils/tokens.js';
import { forbidden, unauthorized } from '../utils/httpError.js';

// Exige "Authorization: Bearer <accessToken>"
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized());

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(unauthorized('Token inválido o expirado'));
  }
}

// Igual que requireAuth pero no falla si no hay token (útil para rutas públicas)
export function optionalAuth(req, _res, next) {
  if (!req.headers.authorization) return next();
  // Si el token es inválido, seguimos como visitante anónimo
  requireAuth(req, _res, () => next());
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) return next(forbidden());
  next();
};