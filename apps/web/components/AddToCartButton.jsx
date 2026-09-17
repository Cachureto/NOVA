'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

export function QuantityStepper({ value, onChange, max, disabled, size = 'md' }) {
  const h = size === 'sm' ? 'h-9' : 'h-12';
  const w = size === 'sm' ? 'w-9' : 'w-11';
  return (
    <div className={`inline-flex ${h} items-center rounded-full border border-border-strong bg-background`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className={`flex ${h} ${w} items-center justify-center rounded-full text-muted transition-colors hover:text-foreground disabled:opacity-30`}
        aria-label="Disminuir cantidad"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-8 text-center font-mono text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={`flex ${h} ${w} items-center justify-center rounded-full text-muted transition-colors hover:text-foreground disabled:opacity-30`}
        aria-label="Aumentar cantidad"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function AddToCartButton({ product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} max={product.stock || 1} disabled={outOfStock} />
        <button className="btn-primary h-12 flex-1 text-[15px]" onClick={handleAdd} disabled={outOfStock}>
          {outOfStock ? (
            'Agotado'
          ) : added ? (
            <>
              <Check size={18} /> Agregado al carrito
            </>
          ) : (
            <>
              <ShoppingBag size={18} /> Agregar al carrito
            </>
          )}
        </button>
      </div>
      {added && (
        <Link href="/cart" className="btn-secondary h-12 animate-fade-up">
          Ver carrito y pagar
        </Link>
      )}
    </div>
  );
}
