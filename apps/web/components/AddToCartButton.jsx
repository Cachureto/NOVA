'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function AddToCartButton({ product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="label !mb-0" htmlFor="quantity">
          Cantidad
        </label>
        <input
          id="quantity"
          type="number"
          min="1"
          max={product.stock || 1}
          value={quantity}
          disabled={outOfStock}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="input w-20"
        />
      </div>
      <div className="flex gap-3">
        <button className="btn-primary flex-1" onClick={handleAdd} disabled={outOfStock}>
          {outOfStock ? 'Agotado' : added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
        </button>
        <Link href="/cart" className="btn-secondary">
          Ver carrito
        </Link>
      </div>
    </div>
  );
}
