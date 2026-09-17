'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCOP } from '@/lib/format';
import AdminHeader from '@/components/admin/AdminHeader';

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
      <AdminHeader
        title="Productos"
        description={products ? `${products.length} productos en el catálogo` : 'Cargando…'}
        actionHref="/admin/products/new"
        actionLabel="Nuevo producto"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface-2 font-mono text-[11px] uppercase tracking-[0.12em] text-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products === null &&
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="skeleton h-10" />
                    </td>
                  </tr>
                ))}
              {products?.map((p) => (
                <tr key={p.id} className="bg-surface transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="product-tile h-11 w-11 shrink-0 rounded-lg">
                        {p.coverUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/products/${p.slug}`} className="block truncate font-medium hover:text-accent">
                          {p.name}
                        </Link>
                        <p className="truncate font-mono text-[11px] text-subtle">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name}</td>
                  <td className="px-4 py-3 font-medium">{formatCOP(p.priceCents)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 0 ? 'badge-danger' : p.stock <= 5 ? 'badge-warning' : 'badge'}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{p.authenticityCode}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.slug}/edit`}
                        className="icon-btn h-9 w-9 text-muted"
                        aria-label={`Editar ${p.name}`}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.slug)}
                        className="icon-btn h-9 w-9 text-muted hover:text-danger"
                        aria-label={`Eliminar ${p.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products?.length === 0 && (
          <p className="bg-surface px-4 py-10 text-center text-muted">No hay productos todavía.</p>
        )}
      </div>
    </div>
  );
}
