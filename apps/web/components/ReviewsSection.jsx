'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function ReviewsSection({ productId, initialReviews }) {
  const { user, accessToken } = useAuth();
  const [reviews, setReviews] = useState(initialReviews.items);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const review = await apiFetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        token: accessToken,
        body: { rating: Number(rating), comment: comment || undefined },
      });
      setReviews((prev) => [review, ...prev]);
      setComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold">Reseñas</h2>

      {user ? (
        <form onSubmit={handleSubmit} className="card mt-4 flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <label className="label !mb-0" htmlFor="rating">
              Calificación
            </label>
            <select id="rating" className="input w-24" value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="input min-h-24"
            placeholder="¿Qué te pareció el producto?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn-primary self-start" disabled={submitting}>
            {submitting ? 'Publicando…' : 'Publicar reseña'}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">
          <Link href="/login" className="text-accent underline">
            Inicia sesión
          </Link>{' '}
          para dejar una reseña.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {reviews.length === 0 && <p className="text-muted">Todavía no hay reseñas para este producto.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.user.name}</span>
              <div className="flex items-center gap-2">
                {r.verifiedPurchase && <span className="badge text-live border-live/30">Compra verificada</span>}
                <span className="text-sm text-muted">
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </span>
              </div>
            </div>
            {r.comment && <p className="mt-2 text-sm text-muted">{r.comment}</p>}
            <p className="mt-2 text-xs text-muted">{formatDate(r.createdAt)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
