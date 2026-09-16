import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import { formatDate } from '@/lib/format';

async function getFeatured() {
  const [{ items: products }, drops] = await Promise.all([
    apiFetch('/api/products?limit=4'),
    apiFetch('/api/drops?status=scheduled'),
  ]);
  return { products, drops: drops.slice(0, 2) };
}

export default async function HomePage() {
  const { products, drops } = await getFeatured();

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <span className="badge">Autenticidad · IA · Drops</span>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Sneakers y tecnología urbana, sin dudas de que son originales.
          </h1>
          <p className="mt-4 text-lg text-muted">
            NOVA verifica cada producto con un código de autenticidad único, te recomienda con un asistente de IA
            que solo conoce el catálogo real, y te avisa antes que nadie de los próximos drops.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/catalog" className="btn-primary">
              Ver catálogo
            </Link>
            <Link href="/search" className="btn-secondary">
              Probar el buscador IA
            </Link>
          </div>
        </div>
      </section>

      {drops.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Próximos drops</h2>
            <Link href="/drops" className="text-sm text-accent underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {drops.map((drop) => (
              <Link key={drop.id} href={`/drops/${drop.slug}`} className="card p-5">
                <h3 className="text-xl font-bold">{drop.name}</h3>
                <p className="mt-1 text-sm text-muted">{formatDate(drop.launchAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Destacados</h2>
          <Link href="/catalog" className="text-sm text-accent underline">
            Ver catálogo
          </Link>
        </div>
        <div className="mt-6">
          <ProductGrid products={products} />
        </div>
      </section>
    </div>
  );
}
