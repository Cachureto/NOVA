'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { formatCOP } from '@/lib/format';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotalCents } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="text-muted">Explora el catálogo y agrega algo que te guste.</p>
        <Link href="/catalog" className="btn-primary">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Tu carrito</h1>

      <div className="mt-6 flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.productId} className="card flex items-center gap-4 p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-hover">
              {item.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.coverUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1">
              <Link href={`/products/${item.slug}`} className="font-medium hover:underline">
                {item.name}
              </Link>
              <p className="text-sm text-muted">{formatCOP(item.priceCents)} c/u</p>
            </div>
            <input
              type="number"
              min="1"
              max={item.stock}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
              className="input w-20"
            />
            <p className="w-28 text-right font-semibold">{formatCOP(item.priceCents * item.quantity)}</p>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-sm text-danger hover:underline"
              aria-label={`Quitar ${item.name}`}
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="card mt-6 flex items-center justify-between p-5">
        <span className="text-lg font-semibold">Subtotal</span>
        <span className="text-xl font-bold">{formatCOP(subtotalCents)}</span>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Link href="/catalog" className="btn-secondary">
          Seguir comprando
        </Link>
        <Link href="/checkout" className="btn-primary">
          Continuar al pago
        </Link>
      </div>
    </div>
  );
}
