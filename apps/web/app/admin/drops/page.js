'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';

const STATUSES = ['scheduled', 'live', 'sold_out', 'ended', 'cancelled'];
const STATUS_LABEL = {
  scheduled: 'Próximamente',
  live: 'En vivo',
  sold_out: 'Agotado',
  ended: 'Finalizado',
  cancelled: 'Cancelado',
};

export default function AdminDropsPage() {
  const { accessToken } = useAuth();
  const [drops, setDrops] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setDrops(await apiFetch('/api/drops'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    apiFetch('/api/drops').then(setDrops).catch((err) => setError(err.message));
  }, []);

  async function handleStatusChange(slug, status) {
    try {
      await apiFetch(`/api/drops/${slug}/status`, { method: 'PATCH', token: accessToken, body: { status } });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Drops</h2>
        <Link href="/admin/drops/new" className="btn-primary">
          Nuevo drop
        </Link>
      </div>

      {error && <p className="mt-4 text-danger">{error}</p>}

      <div className="mt-6 flex flex-col gap-4">
        {drops?.map((d) => (
          <div key={d.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{d.name}</p>
              <p className="text-sm text-muted">
                {formatDate(d.launchAt)} · {d.waitlistCount} en espera · {d.products.length} producto
                {d.products.length === 1 ? '' : 's'}
              </p>
            </div>
            <select
              className="input w-44"
              value={d.status}
              onChange={(e) => handleStatusChange(d.slug, e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        ))}
        {drops?.length === 0 && <p className="text-muted">No hay drops todavía.</p>}
      </div>
    </div>
  );
}
