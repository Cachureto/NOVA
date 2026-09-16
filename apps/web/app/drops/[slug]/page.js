import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { formatCOP, formatDate } from '@/lib/format';
import WaitlistButton from '@/components/WaitlistButton';

const STATUS_LABEL = {
  scheduled: 'Próximamente',
  live: 'En vivo',
  sold_out: 'Agotado',
  ended: 'Finalizado',
  cancelled: 'Cancelado',
};

async function getDrop(slug) {
  try {
    return await apiFetch(`/api/drops/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default async function DropPage({ params }) {
  const { slug } = await params;
  const drop = await getDrop(slug);
  if (!drop) notFound();

  const canJoin = ['scheduled', 'live'].includes(drop.status);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <span className="badge">{STATUS_LABEL[drop.status] ?? drop.status}</span>
      <h1 className="mt-3 text-3xl font-bold">{drop.name}</h1>
      <p className="mt-1 text-muted">
        {formatDate(drop.launchAt)} · {drop.waitlistCount} en lista de espera
      </p>
      <p className="mt-4 max-w-2xl text-muted">{drop.description}</p>

      <div className="mt-6">
        <WaitlistButton dropSlug={drop.slug} disabled={!canJoin} />
      </div>

      <h2 className="mt-12 text-xl font-bold">Productos incluidos</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {drop.products.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="card overflow-hidden">
            <div className="aspect-square bg-surface-hover">
              {p.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverUrl} alt={p.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-sm text-muted">{formatCOP(p.priceCents)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
