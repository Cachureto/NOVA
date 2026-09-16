'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { apiFetch } from '@/lib/api';
import { formatCOP } from '@/lib/format';

export default function CheckoutPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { items, subtotalCents, clearCart } = useCart();
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

  if (authLoading || !user) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">No tienes nada en el carrito</h1>
        <Link href="/catalog" className="btn-primary">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Finalizar compra</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6">
          <h2 className="font-semibold">Dirección de envío</h2>
          <div>
            <label className="label" htmlFor="fullName">
              Nombre completo
            </label>
            <input id="fullName" required className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Teléfono
            </label>
            <input id="phone" required className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="address">
              Dirección
            </label>
            <input id="address" required className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="city">
              Ciudad
            </label>
            <input id="city" required className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Confirmando…' : 'Confirmar pedido'}
          </button>
        </form>

        <div className="card h-fit p-6">
          <h2 className="font-semibold">Resumen</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>{formatCOP(item.priceCents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
            <span>Total</span>
            <span>{formatCOP(subtotalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
