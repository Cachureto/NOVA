import Link from 'next/link';
import { formatCOP } from '@/lib/format';

export default function ProductCard({ product }) {
  const outOfStock = product.stock <= 0;

  return (
    <Link href={`/products/${product.slug}`} className="card group flex flex-col overflow-hidden">
      <div className="aspect-square w-full overflow-hidden bg-surface-hover">
        {product.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.coverUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">Sin imagen</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs uppercase tracking-wide text-muted">{product.category?.name}</span>
        <h3 className="line-clamp-2 font-semibold">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{formatCOP(product.priceCents)}</span>
          {outOfStock ? (
            <span className="badge text-danger border-danger/40">Agotado</span>
          ) : (
            <span className="badge text-live border-live/30">Stock: {product.stock}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
