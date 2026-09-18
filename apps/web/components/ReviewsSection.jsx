'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import StarRating from './StarRating';

function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label="Calificación"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            size={26}
            strokeWidth={1.5}
            className={`transition-colors ${
              n <= (hover || value) ? 'fill-accent text-accent' : 'fill-transparent text-border-strong'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

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
      setReviews((prev) => [{ ...review, user: { ...review.user, name: review.user?.name ?? user.name } }, ...prev]);
      setComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <section id="resenas" className="mt-20 scroll-mt-24 border-t border-border pt-16">
      <div className="grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">Opiniones</p>
          <h2 className="display mt-3 text-2xl sm:text-3xl">Reseñas de clientes</h2>

          <div className="card mt-6 p-6">
            <div className="flex items-end gap-3">
              <span className="font-display text-5xl font-semibold">{average.toFixed(1)}</span>
              <div className="pb-1.5">
                <StarRating value={average} size={16} />
                <p className="mt-1 text-xs text-muted">
                  {count} reseña{count === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <ul className="mt-6 flex flex-col gap-2">
              {distribution.map((d) => (
                <li key={d.stars} className="flex items-center gap-3 text-xs">
                  <span className="w-3 font-mono text-muted">{d.stars}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: count ? `${(d.count / count) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="w-5 text-right font-mono text-subtle">{d.count}</span>
                </li>
              ))}
            </ul>
          </div>

          {user ? (
            <form onSubmit={handleSubmit} className="card mt-4 flex flex-col gap-4 p-6">
              <p className="text-sm font-semibold">Escribe tu reseña</p>
              <RatingInput value={rating} onChange={setRating} />
              <textarea
                className="input min-h-28 resize-y"
                placeholder="¿Qué te pareció el producto?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Publicando…' : 'Publicar reseña'}
              </button>
            </form>
          ) : (
            <div className="card mt-4 p-6 text-sm text-muted">
              <Link href="/login" className="link">
                Inicia sesión
              </Link>{' '}
              para dejar una reseña. Las compras verificadas se marcan automáticamente.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {count === 0 && (
            <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-muted">
                <MessageSquare size={22} />
              </span>
              <p className="font-semibold">Todavía no hay reseñas</p>
              <p className="text-sm text-muted">Sé el primero en contar tu experiencia con este producto.</p>
            </div>
          )}
          {reviews.map((r) => (
            <article key={r.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover font-mono text-sm font-semibold">
                    {(r.user?.name ?? '?').charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{r.user?.name ?? 'Cliente Vokter'}</p>
                    <p className="text-xs text-subtle">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.verifiedPurchase && (
                    <span className="badge-live">
                      <BadgeCheck size={13} /> Compra verificada
                    </span>
                  )}
                  <StarRating value={r.rating} />
                </div>
              </div>
              {r.comment && <p className="mt-4 leading-relaxed text-muted">{r.comment}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
