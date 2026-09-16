'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const SORTS = [
  { value: 'newest', label: 'Más nuevos' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'rating', label: 'Mejor calificados' },
];

export default function FilterBar({ categories }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest');

  function applyFilters(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort && sort !== 'newest') params.set('sort', sort);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  const activeCount = [category, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
          </span>
          <h2 className="text-sm font-semibold text-foreground">Filtrar catálogo</h2>
        </div>
        {activeCount > 0 && (
          <span className="badge border-accent/30 text-accent">
            {activeCount} filtro{activeCount === 1 ? '' : 's'} activo{activeCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr_auto]">
        <div>
          <label className="label" htmlFor="filter-category">
            Categoría
          </label>
          <select
            id="filter-category"
            className="input h-11"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Rango de precio</label>
          <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-accent">
            <input
              id="filter-min"
              type="number"
              min="0"
              inputMode="numeric"
              aria-label="Precio mínimo"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
              placeholder="Mín."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="text-muted">–</span>
            <input
              id="filter-max"
              type="number"
              min="0"
              inputMode="numeric"
              aria-label="Precio máximo"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
              placeholder="Máx."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="filter-sort">
            Ordenar por
          </label>
          <select id="filter-sort" className="input h-11" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button type="submit" className="btn-primary h-11 w-full lg:w-auto lg:px-6">
            Filtrar
          </button>
        </div>
      </form>
    </div>
  );
}
