import { Suspense } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';
import FilterBar, { SortSelect } from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { apiFetch } from '@/lib/api';
import { formatCOP } from '@/lib/format';

export const metadata = { title: 'Catálogo' };

const FILTER_KEYS = ['category', 'minPrice', 'maxPrice', 'q', 'sort', 'page'];
const PAGE_SIZE = 24;

async function getCategories() {
  const { items } = await apiFetch('/api/categories');
  return items;
}

async function getProducts(sp) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    if (sp[key]) params.set(key, sp[key]);
  }
  params.set('limit', String(PAGE_SIZE));
  return apiFetch(`/api/products?${params.toString()}`);
}

export default async function CatalogPage({ searchParams }) {
  const sp = await searchParams;
  const [categories, { items: products, total, page }] = await Promise.all([getCategories(), getProducts(sp)]);

  const activeCategory = categories.find((c) => c.slug === sp.category);
  const currentParams = Object.fromEntries(FILTER_KEYS.filter((k) => sp[k]).map((k) => [k, sp[k]]));

  // Chips de filtros activos: cada uno enlaza a la URL sin ese filtro
  const without = (...keys) => {
    const params = new URLSearchParams(currentParams);
    keys.forEach((k) => params.delete(k));
    params.delete('page');
    const qs = params.toString();
    return qs ? `/catalog?${qs}` : '/catalog';
  };
  const chips = [
    activeCategory && { label: activeCategory.name, href: without('category') },
    sp.q && { label: `“${sp.q}”`, href: without('q') },
    (sp.minPrice || sp.maxPrice) && {
      label: `${sp.minPrice ? formatCOP(Number(sp.minPrice)) : '$0'} – ${sp.maxPrice ? formatCOP(Number(sp.maxPrice)) : 'más'}`,
      href: without('minPrice', 'maxPrice'),
    },
  ].filter(Boolean);

  return (
    <div>
      <section className="border-b border-border bg-surface/40">
        <div className="container-page py-10 sm:py-14">
          <nav className="flex items-center gap-2 text-xs text-subtle" aria-label="Migas de pan">
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-muted">Catálogo</span>
            {activeCategory && (
              <>
                <span>/</span>
                <span className="text-muted">{activeCategory.name}</span>
              </>
            )}
          </nav>
          <h1 className="page-title mt-4">{activeCategory ? activeCategory.name : 'Catálogo'}</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Productos originales con código de autenticidad verificable. Filtra por categoría y precio para encontrar el
            tuyo.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[250px_1fr] lg:gap-12">
        <Suspense fallback={<div className="skeleton hidden h-96 lg:block" />}>
          <FilterBar categories={categories} />
        </Suspense>

        <div className="min-w-0">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-2 text-sm text-muted">
                <span className="font-mono font-semibold text-foreground">{total}</span> producto
                {total === 1 ? '' : 's'}
              </p>
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  scroll={false}
                  className="badge gap-1 transition-colors hover:border-border-strong hover:text-foreground"
                >
                  {chip.label}
                  <X size={12} />
                </Link>
              ))}
            </div>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          <div className="mt-6">
            <ProductGrid products={products} columns="compact" />
          </div>

          <Pagination
            page={page ?? 1}
            totalPages={Math.ceil(total / PAGE_SIZE)}
            basePath="/catalog"
            searchParams={currentParams}
          />
        </div>
      </div>
    </div>
  );
}
