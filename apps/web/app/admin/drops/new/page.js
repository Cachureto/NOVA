'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

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
      <h2 className="mb-6 text-xl font-bold">Nuevo drop</h2>
      <form onSubmit={handleSubmit} className="card flex max-w-2xl flex-col gap-4 p-6">
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
          <input id="slug" className="input font-mono" required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="description">
            Descripción
          </label>
          <textarea
            id="description"
            className="input min-h-20"
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
          <label className="label">Productos incluidos</label>
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-xl border border-border p-3">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                {p.name}
              </label>
            ))}
            {products.length === 0 && <p className="text-sm text-muted">No hay productos creados todavía.</p>}
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn-primary self-start" disabled={submitting || selected.length === 0}>
          {submitting ? 'Creando…' : 'Crear drop'}
        </button>
      </form>
    </div>
  );
}
