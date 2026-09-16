'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCOP } from '@/lib/format';

export default function AdminProductsPage() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const { items } = await apiFetch('/api/products?limit=60');
      setProducts(items);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    apiFetch('/api/products?limit=60')
      .then(({ items }) => setProducts(items))
      .catch((err) => setError(err.message));
  }, []);

  async function handleDelete(slug) {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      await apiFetch(`/api/products/${slug}`, { method: 'DELETE', token: accessToken });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Productos</h2>
        <Link href="/admin/products/new" className="btn-primary">
          Nuevo producto
        </Link>
      </div>

      {error && <p className="mt-4 text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Categoría</th>
              <th className="py-2 pr-4">Precio</th>
              <th className="py-2 pr-4">Stock</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-2 pr-4">{p.name}</td>
                <td className="py-2 pr-4">{p.category?.name}</td>
                <td className="py-2 pr-4">{formatCOP(p.priceCents)}</td>
                <td className="py-2 pr-4">{p.stock}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  <Link href={`/admin/products/${p.slug}/edit`} className="text-accent underline">
                    Editar
                  </Link>
                  <button onClick={() => handleDelete(p.slug)} className="ml-4 text-danger underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products?.length === 0 && <p className="py-6 text-muted">No hay productos todavía.</p>}
      </div>
    </div>
  );
}
