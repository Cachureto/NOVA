'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleCheck, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCOP, formatDate } from '@/lib/format';
import { ORDER_STATUS } from '@/lib/status';

const PROGRESS = ['pending', 'paid', 'shipped', 'delivered'];

function OrderProgress({ status }) {
  const index = PROGRESS.indexOf(status);
  if (index === -1) return null;
  return (
    <div className="mt-5 grid grid-cols-4 gap-2">
      {PROGRESS.map((s, i) => (
        <div key={s}>
          <div className={`h-1 rounded-full ${i <= index ? 'bg-accent' : 'bg-surface-hover'}`} />
          <p className={`mt-2 text-[11px] ${i <= index ? 'text-foreground' : 'text-subtle'}`}>
            {ORDER_STATUS[s].label}
          </p>
        </div>
      ))}
    </div>
  );
}

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
    <div className="container-page max-w-4xl py-10">
      <p className="eyebrow">Mi cuenta</p>
      <h1 className="page-title mt-3">Mis pedidos</h1>
      <p className="mt-2 text-muted">Hola, {user.name.split(' ')[0]}. Aquí puedes seguir el estado de tus compras.</p>

      {createdId && (
        <div className="alert-success mt-6 animate-fade-up">
          <CircleCheck size={20} className="shrink-0" />
          <div>
            <p className="font-semibold">¡Pedido confirmado!</p>
            <p className="mt-0.5 opacity-90">Te avisaremos cuando cambie de estado.</p>
          </div>
        </div>
      )}

      {error && <div className="alert-error mt-6">{error}</div>}

      {orders === null && !error && (
        <div className="mt-8 flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-44" />
          ))}
        </div>
      )}

      {orders?.length === 0 && (
        <div className="card mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Package size={28} className="text-muted" />
          <p className="font-display text-lg font-semibold">Todavía no tienes pedidos</p>
          <p className="text-sm text-muted">Cuando compres algo, lo verás aquí con su estado.</p>
          <Link href="/catalog" className="btn-primary mt-3">
            Explorar catálogo
          </Link>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {orders?.map((order) => {
          const status = ORDER_STATUS[order.status] ?? { label: order.status, badge: 'badge' };
          return (
            <article key={order.id} className={`card p-5 sm:p-6 ${order.id === createdId ? 'border-accent/40' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-subtle">PEDIDO #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)}</p>
                </div>
                <span className={status.badge}>{status.label}</span>
              </div>

              <OrderProgress status={order.status} />

              <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-5">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted">
                      <span className="font-mono text-foreground">{item.quantity}×</span> {item.productName}
                    </span>
                    <span className="shrink-0">{formatCOP(item.unitPriceCents * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                <span className="text-sm text-muted">Total</span>
                <span className="font-display text-xl font-semibold">{formatCOP(order.totalCents)}</span>
              </div>
            </article>
          );
        })}
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
