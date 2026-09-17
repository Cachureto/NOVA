import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Bell, CalendarClock, Package } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { DROP_STATUS } from '@/lib/status';
import WaitlistButton from '@/components/WaitlistButton';
import Countdown from '@/components/Countdown';
import ProductGrid from '@/components/ProductGrid';

// cache(): generateMetadata y la página comparten la misma petición en cada render
const getDrop = cache(async (slug) => {
  try {
    return await apiFetch(`/api/drops/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const drop = await getDrop(slug);
  return { title: drop ? `Drop ${drop.name}` : 'Drop' };
}

export default async function DropPage({ params }) {
  const { slug } = await params;
  const drop = await getDrop(slug);
  if (!drop) notFound();

  const canJoin = ['scheduled', 'live'].includes(drop.status);
  const status = DROP_STATUS[drop.status] ?? { label: drop.status, badge: 'badge' };

  return (
    <div className="container-page py-8 sm:py-10">
      <nav className="flex items-center gap-2 text-xs text-subtle" aria-label="Migas de pan">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span>/</span>
        <Link href="/drops" className="hover:text-foreground">
          Drops
        </Link>
        <span>/</span>
        <span className="truncate text-muted">{drop.name}</span>
      </nav>

      <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="grid lg:grid-cols-2">
          <div className="product-tile m-2 aspect-[4/3] rounded-[20px] lg:m-3 lg:aspect-auto lg:min-h-[460px]">
            {drop.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={drop.coverUrl} alt={drop.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-4xl font-bold text-black/15">
                NOVA DROP
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10">
            <span className={`${status.badge} w-fit`}>{status.label}</span>
            <h1 className="display mt-5 text-4xl leading-tight sm:text-5xl">{drop.name}</h1>
            {drop.description && <p className="mt-4 leading-relaxed text-muted">{drop.description}</p>}

            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                [CalendarClock, 'Lanzamiento', formatDate(drop.launchAt)],
                [Bell, 'En espera', drop.waitlistCount],
                [Package, 'Productos', drop.products.length],
              ].map(([Icon, label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-background p-3 first:col-span-2 sm:first:col-span-1"
                >
                  <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
                    <Icon size={12} /> {label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            {drop.status === 'scheduled' && (
              <div className="mt-8">
                <p className="eyebrow mb-3">Abre en</p>
                <Countdown target={drop.launchAt} size="lg" />
              </div>
            )}

            <div className="mt-8">
              <WaitlistButton dropSlug={drop.slug} disabled={!canJoin} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
              <BadgeCheck size={14} className="text-live" /> Todos los productos del drop incluyen código de
              autenticidad
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <p className="eyebrow">Incluido en el drop</p>
        <h2 className="display mt-3 text-2xl sm:text-3xl">Productos del lanzamiento</h2>
        <div className="mt-8">
          <ProductGrid products={drop.products} emptyAction={false} />
        </div>
      </section>
    </div>
  );
}
