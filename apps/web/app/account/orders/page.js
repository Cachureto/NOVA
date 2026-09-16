'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCOP, formatDate } from '@/lib/format';

const STATUS_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

function OrdersContent() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const router = useRouter();
  const createdId = useSearchParams().get('created');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/account/orders');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch('/api/orders', { token: accessToken })
      .then((res) => setOrders(res.items))
      .catch((err) => setError(err.message));
  }, [accessToken]);

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Mis pedidos</h1>

      {createdId && (
        <div className="mt-4 rounded-xl border border-live/40 bg-live/10 p-3 text-sm text-live">
          ¡Pedido confirmado! Te avisaremos cuando cambie de estado.
        </div>
      )}

      {error && <p className="mt-4 text-danger">{error}</p>}
      {orders === null && !error && <p className="mt-4 text-muted">Cargando pedidos…</p>}

      {orders?.length === 0 && (
        <p className="mt-4 text-muted">
          Todavía no tienes pedidos. Explora el{' '}
          <Link href="/catalog" className="text-accent underline">
            catálogo
          </Link>
          .
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {orders?.map((order) => (
          <div key={order.id} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="badge">{STATUS_LABEL[order.status] ?? order.status}</span>
              <span className="text-sm text-muted">{formatDate(order.createdAt)}</span>
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity} × {item.productName}
                  </span>
                  <span>{formatCOP(item.unitPriceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-border pt-3 font-semibold">
              <span>Total</span>
              <span>{formatCOP(order.totalCents)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersContent />
    </Suspense>
  );
}
