import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe' });
  }
  if (err.code === '23503') {
    return res.status(409).json({ error: 'No se puede completar: hay registros relacionados' });
  }
  console.error(err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.isProd ? {} : { message: err.message }),
  });
}