import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Drops — NOVA' };

const STATUS_LABEL = {
  scheduled: 'Próximamente',
  live: 'En vivo',
  sold_out: 'Agotado',
  ended: 'Finalizado',
  cancelled: 'Cancelado',
};

export default async function DropsPage() {
  const drops = await apiFetch('/api/drops');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Drops</h1>
      <p className="mt-2 text-muted">
        Lanzamientos exclusivos y limitados. Únete a la lista de espera para no quedarte por fuera.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {drops.map((drop) => (
          <Link key={drop.id} href={`/drops/${drop.slug}`} className="card overflow-hidden">
            <div className="aspect-video bg-surface-hover">
              {drop.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={drop.coverUrl} alt={drop.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">NOVA Drop</div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="badge">{STATUS_LABEL[drop.status] ?? drop.status}</span>
                <span className="text-xs text-muted">{drop.waitlistCount} en espera</span>
              </div>
              <h2 className="mt-3 text-xl font-bold">{drop.name}</h2>
              <p className="mt-1 text-sm text-muted">{formatDate(drop.launchAt)}</p>
            </div>
          </Link>
        ))}
        {drops.length === 0 && <p className="text-muted">No hay drops programados por ahora.</p>}
      </div>
    </div>
  );
}
