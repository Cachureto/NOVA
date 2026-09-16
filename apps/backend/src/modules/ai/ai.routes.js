import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { searchSchema } from './ai.schemas.js';
import * as ai from './ai.service.js';

const router = Router();

// Cada búsqueda cuesta una llamada real a OpenAI: se limita por IP para evitar abuso.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas búsquedas, espera un momento' },
});

router.post('/search', aiLimiter, optionalAuth, validate({ body: searchSchema }), async (req, res) => {
  res.json(await ai.conversationalSearch(req.valid.body, req.user?.id));
});

export default router;
