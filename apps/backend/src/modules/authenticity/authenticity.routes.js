import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateCodeSchema } from './authenticity.schemas.js';
import * as authenticity from './authenticity.service.js';
import { authenticityQrSvg } from './authenticity.qr.js';

const router = Router();

// Público: la ficha de producto (web) y el escáner QR (móvil) lo llaman sin requerir sesión,
// pero si el usuario está autenticado su id queda asociado en el log de verificación.
router.post('/validate', optionalAuth, validate({ body: validateCodeSchema }), async (req, res) => {
  res.json(await authenticity.validateCode(req.valid.body, req.ip, req.user?.id));
});

// QR imprimible del código, para la etiqueta del producto y para la ficha web.
router.get('/:code/qr.svg', async (req, res) => {
  const svg = await authenticityQrSvg(req.params.code);
  res.type('image/svg+xml');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

export default router;
