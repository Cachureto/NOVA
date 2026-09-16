import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createReviewSchema, listReviewsQuerySchema, productIdParamSchema, reviewIdParamSchema } from './reviews.schemas.js';
import * as reviews from './reviews.service.js';

// Montado en app.js como app.use('/api/products/:productId/reviews', router)
const router = Router({ mergeParams: true });

router.get('/', validate({ params: productIdParamSchema, query: listReviewsQuerySchema }), async (req, res) => {
  res.json(await reviews.listReviews(req.valid.params.productId, req.valid.query));
});

router.post('/', requireAuth, validate({ params: productIdParamSchema, body: createReviewSchema }), async (req, res) => {
  res.status(201).json(await reviews.createReview(req.valid.params.productId, req.user.id, req.valid.body));
});

router.delete('/:reviewId', requireAuth, validate({ params: reviewIdParamSchema }), async (req, res) => {
  await reviews.deleteReview(req.valid.params.reviewId, req.user);
  res.status(204).end();
});

export default router;
