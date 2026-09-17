'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Check, LoaderCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import AdminHeader from '@/components/admin/AdminHeader';

export default function NewDropPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [launchAt, setLaunchAt] = useState('');
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/products?limit=60').then((r) => setProducts(r.items));
  }, []);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/drops', {
        method: 'POST',
        token: accessToken,
        body: { name, slug, description, launchAt: new Date(launchAt).toISOString(), productIds: selected },
      });
      router.push('/admin/drops');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Nuevo drop"
        description="Programa un lanzamiento y elige sus productos."
        backHref="/admin/drops"
      />
      <form onSubmit={handleSubmit} className="card flex max-w-3xl flex-col gap-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Nombre
            </label>
            <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="slug">
              Slug
            </label>
            <input
              id="slug"
              className="input font-mono"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">
            Descripción
          </label>
          <textarea
            id="description"
            className="input min-h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="launchAt">
            Fecha de lanzamiento
          </label>
          <input
            id="launchAt"
            type="datetime-local"
            className="input"
            required
            value={launchAt}
            onChange={(e) => setLaunchAt(e.target.value)}
          />
        </div>
        <div>
          <label className="label">
            Productos incluidos <span className="font-mono text-subtle">({selected.length} seleccionados)</span>
          </label>
          <div className="grid max-h-80 gap-2 overflow-y-auto rounded-xl border border-border p-2 sm:grid-cols-2">
            {products.map((p) => {
              const checked = selected.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 text-sm transition-colors ${
                    checked ? 'border-accent bg-accent/5' : 'border-transparent hover:bg-surface-hover'
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(p.id)} />
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      checked ? 'border-accent bg-accent text-accent-foreground' : 'border-border-strong'
                    }`}
                  >
                    {checked && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="product-tile h-9 w-9 shrink-0 rounded-md">
                    {p.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="truncate">{p.name}</span>
                </label>
              );
            })}
            {products.length === 0 && <p className="text-sm text-muted">No hay productos creados todavía.</p>}
          </div>
        </div>
        {error && <div className="alert-error">{error}</div>}
        <button type="submit" className="btn-primary self-start" disabled={submitting || selected.length === 0}>
          {submitting && <LoaderCircle size={17} className="animate-spin" />}
          {submitting ? 'Creando…' : 'Crear drop'}
        </button>
      </form>
    </div>
  );
}
