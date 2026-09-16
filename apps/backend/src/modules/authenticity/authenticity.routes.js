import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateCodeSchema } from './authenticity.schemas.js';
import * as authenticity from './authenticity.service.js';

const router = Router();

// Público: la ficha de producto (web) y el escáner QR (móvil) lo llaman sin requerir sesión,
// pero si el usuario está autenticado su id queda asociado en el log de verificación.
router.post('/validate', optionalAuth, validate({ body: validateCodeSchema }), async (req, res) => {
  res.json(await authenticity.validateCode(req.valid.body, req.ip, req.user?.id));
});

export default router;
