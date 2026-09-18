'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Package, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatCOP } from '@/lib/format';
import { QuantityStepper } from '@/components/AddToCartButton';

export default function CartPage() {
  const { items, count, updateQuantity, removeItem, subtotalCents } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-page flex max-w-xl flex-col items-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface text-muted">
          <ShoppingBag size={28} />
        </span>
        <h1 className="display mt-6 text-3xl">Tu carrito está vacío</h1>
        <p className="mt-3 text-muted">Explora el catálogo y agrega productos originales con certificado Vokter.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/catalog" className="btn-primary">
            Ver catálogo <ArrowRight size={17} />
          </Link>
          <Link href="/drops" className="btn-secondary">
            Ver drops
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Carrito</p>
      <h1 className="page-title mt-3">
        Tu carrito <span className="font-mono text-xl text-subtle">({count})</span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 p-4 sm:p-5">
              <Link href={`/products/${item.slug}`} className="product-tile h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverUrl} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/products/${item.slug}`} className="line-clamp-2 font-medium hover:text-accent">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted">{formatCOP(item.priceCents)} c/u</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="icon-btn h-9 w-9 shrink-0 text-subtle hover:text-danger"
                    aria-label={`Quitar ${item.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    max={item.stock}
                    onChange={(q) => updateQuantity(item.productId, q)}
                  />
                  <p className="font-display text-lg font-semibold">{formatCOP(item.priceCents * item.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">Resumen</h2>
          <dl className="mt-6 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Productos ({count})</dt>
              <dd>{formatCOP(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Envío</dt>
              <dd className="text-muted">Se coordina al confirmar</dd>
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-border pt-4">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-2xl font-semibold">{formatCOP(subtotalCents)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-6 h-12 w-full text-[15px]">
            Continuar al pago <ArrowRight size={17} />
          </Link>
          <Link href="/catalog" className="btn-ghost mt-2 w-full">
            Seguir comprando
          </Link>
          <ul className="mt-6 flex flex-col gap-2.5 border-t border-border pt-5 text-xs text-muted">
            <li className="flex items-center gap-2">
              <BadgeCheck size={15} className="text-live" /> Todos los productos con código de autenticidad
            </li>
            <li className="flex items-center gap-2">
              <Package size={15} className="text-accent" /> Sigue el estado de tu pedido desde tu cuenta
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
