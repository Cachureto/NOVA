'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, CircleAlert, LoaderCircle, Lock, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { apiFetch } from '@/lib/api';
import { formatCOP } from '@/lib/format';

const STEPS = ['Carrito', 'Envío', 'Confirmación'];

export default function CheckoutPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { items, count, subtotalCents, clearCart } = useCart();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/checkout');
  }, [authLoading, user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const order = await apiFetch('/api/orders', {
        method: 'POST',
        token: accessToken,
        body: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: { fullName, phone, address, city },
        },
      });
      clearCart();
      router.push(`/account/orders?created=${order.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container-page flex justify-center py-32">
        <LoaderCircle size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex max-w-xl flex-col items-center py-24 text-center">
        <h1 className="display text-3xl">No tienes nada en el carrito</h1>
        <p className="mt-3 text-muted">Agrega productos para finalizar tu compra.</p>
        <Link href="/catalog" className="btn-primary mt-8">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <ol className="flex items-center gap-2 text-xs sm:gap-3" aria-label="Pasos de compra">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
                i <= 1 ? 'bg-accent text-accent-foreground' : 'border border-border text-subtle'
              }`}
            >
              {i + 1}
            </span>
            <span className={i === 1 ? 'font-semibold text-foreground' : 'text-muted'}>{step}</span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border sm:w-12" />}
          </li>
        ))}
      </ol>

      <h1 className="page-title mt-8">Finalizar compra</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <MapPin size={18} className="text-accent" /> Datos de envío
          </h2>
          <p className="mt-1 text-sm text-muted">Enviaremos tu pedido a esta dirección.</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="fullName">
                Nombre completo
              </label>
              <input
                id="fullName"
                required
                autoComplete="name"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                className="input"
                placeholder="300 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="city">
                Ciudad
              </label>
              <input
                id="city"
                required
                autoComplete="address-level2"
                className="input"
                placeholder="Bogotá"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">
                Dirección
              </label>
              <input
                id="address"
                required
                autoComplete="street-address"
                className="input"
                placeholder="Calle, número, apartamento"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="alert-error mt-6" role="alert">
              <CircleAlert size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary mt-8 h-12 w-full text-[15px]" disabled={submitting}>
            {submitting ? <LoaderCircle size={18} className="animate-spin" /> : <Lock size={17} />}
            {submitting ? 'Confirmando pedido…' : `Confirmar pedido · ${formatCOP(subtotalCents)}`}
          </button>
        </form>

        <aside className="card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">
            Tu pedido <span className="font-mono text-sm text-subtle">({count})</span>
          </h2>
          <ul className="mt-5 flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="product-tile h-14 w-14">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 font-mono text-[10px] font-bold text-background">
                    {item.quantity}
                  </span>
                </div>
                <p className="line-clamp-2 flex-1 text-sm">{item.name}</p>
                <p className="text-sm font-medium">{formatCOP(item.priceCents * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
            <span className="font-semibold">Total</span>
            <span className="font-display text-2xl font-semibold">{formatCOP(subtotalCents)}</span>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted">
            <BadgeCheck size={15} className="text-live" /> Recibirás cada producto con su código de autenticidad
          </p>
        </aside>
      </div>
    </div>
  );
}
