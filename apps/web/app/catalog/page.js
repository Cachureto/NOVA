import { Suspense } from 'react';
import ProductGrid from '@/components/ProductGrid';
import FilterBar from '@/components/FilterBar';
import { apiFetch } from '@/lib/api';

export const metadata = { title: 'Catálogo — NOVA' };

const FILTER_KEYS = ['category', 'minPrice', 'maxPrice', 'q', 'sort'];

async function getCategories() {
  const { items } = await apiFetch('/api/categories');
  return items;
}

async function getProducts(sp) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    if (sp[key]) params.set(key, sp[key]);
  }
  return apiFetch(`/api/products?${params.toString()}`);
}

export default async function CatalogPage({ searchParams }) {
  const sp = await searchParams;
  const [categories, { items: products, total }] = await Promise.all([getCategories(), getProducts(sp)]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Catálogo</h1>
      <p className="mt-2 text-muted">
        {total} producto{total === 1 ? '' : 's'} disponibles en NOVA.
      </p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <FilterBar categories={categories} />
        </Suspense>
      </div>

      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
