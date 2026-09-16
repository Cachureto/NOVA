'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCOP, formatDate } from '@/lib/format';

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
const STATUS_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

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
      <h2 className="text-xl font-bold">Pedidos</h2>
      {error && <p className="mt-4 text-danger">{error}</p>}

      <div className="mt-6 flex flex-col gap-4">
        {orders?.map((o) => (
          <div key={o.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {o.user.name} <span className="font-normal text-muted">({o.user.email})</span>
                </p>
                <p className="text-sm text-muted">
                  {formatDate(o.createdAt)} · {formatCOP(o.totalCents)}
                </p>
              </div>
              <select className="input w-44" value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <ul className="mt-3 flex flex-col gap-1 text-sm text-muted">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.quantity} × {i.productName}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {orders?.length === 0 && <p className="text-muted">Todavía no hay pedidos.</p>}
      </div>
    </div>
  );
}
