import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { formatCOP } from '@/lib/format';
import AuthenticityValidator from '@/components/AuthenticityValidator';
import AddToCartButton from '@/components/AddToCartButton';
import ReviewsSection from '@/components/ReviewsSection';

async function getProduct(slug) {
  try {
    return await apiFetch(`/api/products/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const reviews = await apiFetch(`/api/products/${product.id}/reviews`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
            {product.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].altText ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">Sin imagen</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1).map((img) => (
                <div key={img.url} className="aspect-square overflow-hidden rounded-xl border border-border bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.altText ?? product.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs uppercase tracking-wide text-muted">
              {product.category?.name}
              {product.brand ? ` · ${product.brand}` : ''}
            </span>
            <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold">{formatCOP(product.priceCents)}</span>
              {product.stock > 0 ? (
                <span className="badge text-live border-live/30">Stock: {product.stock}</span>
              ) : (
                <span className="badge text-danger border-danger/40">Agotado</span>
              )}
              {product.reviewCount > 0 && (
                <span className="badge">
                  ★ {product.rating.toFixed(1)} ({product.reviewCount})
                </span>
              )}
            </div>
          </div>

          <p className="text-muted">{product.description}</p>

          <AddToCartButton product={product} />

          <AuthenticityValidator defaultCode={product.authenticityCode} />
        </div>
      </div>

      <ReviewsSection productId={product.id} initialReviews={reviews} />
    </div>
  );
}
