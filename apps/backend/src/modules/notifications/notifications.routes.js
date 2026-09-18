import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { registerTokenSchema, removeTokenSchema } from './notifications.schemas.js';
import * as notifications from './notifications.service.js';

const router = Router();

// La app registra su token al iniciar sesión y lo borra al cerrarla.
router.post('/token', requireAuth, validate({ body: registerTokenSchema }), async (req, res) => {
  res.status(201).json(await notifications.registerToken(req.user.id, req.valid.body));
});

router.delete('/token', requireAuth, validate({ body: removeTokenSchema }), async (req, res) => {
  await notifications.removeToken(req.user.id, req.valid.body.expoToken);
  res.status(204).end();
});

export default router;
