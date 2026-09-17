'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCOP, formatDate } from '@/lib/format';
import { ORDER_STATUS } from '@/lib/status';
import AdminHeader from '@/components/admin/AdminHeader';

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const res = await apiFetch('/api/orders/all?limit=50', { token: accessToken });
      setOrders(res.items);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!accessToken) return;
    apiFetch('/api/orders/all?limit=50', { token: accessToken })
      .then((res) => setOrders(res.items))
      .catch((err) => setError(err.message));
  }, [accessToken]);

  async function handleStatusChange(id, status) {
    try {
      await apiFetch(`/api/orders/${id}/status`, { method: 'PATCH', token: accessToken, body: { status } });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <AdminHeader title="Pedidos" description="Últimos 50 pedidos de la tienda." />
      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="flex flex-col gap-3">
        {orders === null && !error && [0, 1].map((i) => <div key={i} className="skeleton h-32" />)}
        {orders?.map((o) => {
          const status = ORDER_STATUS[o.status] ?? { label: o.status, badge: 'badge' };
          return (
            <div key={o.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-subtle">#{o.id.slice(0, 8).toUpperCase()}</span>
                    <span className={status.badge}>{status.label}</span>
                  </div>
                  <p className="mt-2 font-medium">
                    {o.user.name} <span className="font-normal text-muted">· {o.user.email}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg font-semibold">{formatCOP(o.totalCents)}</span>
                  <select
                    className="input h-10 w-44"
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    aria-label="Estado del pedido"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {o.items.map((i) => (
                  <li key={i.id} className="badge">
                    <span className="font-mono text-foreground">{i.quantity}×</span> {i.productName}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {orders?.length === 0 && <p className="card px-4 py-10 text-center text-muted">Todavía no hay pedidos.</p>}
      </div>
    </div>
  );
}
