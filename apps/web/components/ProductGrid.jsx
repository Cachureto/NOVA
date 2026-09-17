import Link from 'next/link';
import { SearchX } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, columns = 'default', emptyAction = true }) {
  if (products.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-muted">
          <SearchX size={22} />
        </span>
        <p className="font-display text-lg font-semibold">No encontramos productos</p>
        <p className="max-w-sm text-sm text-muted">Prueba con otra categoría o amplía el rango de precio.</p>
        {emptyAction && (
          <Link href="/catalog" className="btn-secondary mt-2">
            Limpiar filtros
          </Link>
        )}
      </div>
    );
  }

  const grid =
    columns === 'compact'
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4'
      : 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={grid}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </div>
  );
}
