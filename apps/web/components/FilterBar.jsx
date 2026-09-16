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

  return (
    <form onSubmit={applyFilters} className="card flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[140px] flex-1">
        <label className="label" htmlFor="filter-category">
          Categoría
        </label>
        <select id="filter-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-28">
        <label className="label" htmlFor="filter-min">
          Precio mín.
        </label>
        <input
          id="filter-min"
          type="number"
          min="0"
          className="input"
          placeholder="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
      </div>
      <div className="w-28">
        <label className="label" htmlFor="filter-max">
          Precio máx.
        </label>
        <input
          id="filter-max"
          type="number"
          min="0"
          className="input"
          placeholder="1.000.000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>
      <div className="w-44">
        <label className="label" htmlFor="filter-sort">
          Ordenar por
        </label>
        <select id="filter-sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn-primary">
        Filtrar
      </button>
    </form>
  );
}
