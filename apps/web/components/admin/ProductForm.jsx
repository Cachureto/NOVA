'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageOff, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCOP } from '@/lib/format';

export default function ProductForm({ categories, initial }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [categorySlug, setCategorySlug] = useState(initial?.category?.slug ?? categories[0]?.slug ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priceCents, setPriceCents] = useState(initial?.priceCents ?? '');
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [authenticityCode, setAuthenticityCode] = useState(initial?.authenticityCode ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.images?.[0]?.url ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      name,
      slug,
      categorySlug,
      brand: brand || undefined,
      description,
      priceCents: Number(priceCents),
      stock: Number(stock),
      authenticityCode,
      images: imageUrl ? [{ url: imageUrl }] : [],
    };

    try {
      if (isEdit) {
        await apiFetch(`/api/products/${initial.slug}`, { method: 'PATCH', token: accessToken, body });
      } else {
        await apiFetch('/api/products', { method: 'POST', token: accessToken, body });
      }
      router.push('/admin/products');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="card flex flex-col gap-5 p-6 sm:p-8">
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
              placeholder="nombre-del-producto"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="category">
              Categoría
            </label>
            <select
              id="category"
              className="input"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="brand">
              Marca <span className="text-subtle">(opcional)</span>
            </label>
            <input id="brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">
            Descripción
          </label>
          <textarea
            id="description"
            className="input min-h-28"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="price">
              Precio (COP)
            </label>
            <input
              id="price"
              type="number"
              min="0"
              className="input"
              required
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="stock">
              Stock
            </label>
            <input
              id="stock"
              type="number"
              min="0"
              className="input"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="authenticityCode">
            Código de autenticidad
          </label>
          <input
            id="authenticityCode"
            className="input font-mono uppercase"
            required
            placeholder="VKT-XXXXXXXX"
            value={authenticityCode}
            onChange={(e) => setAuthenticityCode(e.target.value.toUpperCase())}
          />
          <p className="mt-2 text-xs text-subtle">Formato VKT- seguido de al menos 8 letras, números o guiones.</p>
        </div>
        <div>
          <label className="label" htmlFor="imageUrl">
            URL de imagen <span className="text-subtle">(opcional)</span>
          </label>
          <input
            id="imageUrl"
            className="input"
            placeholder="https://…"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        {error && <div className="alert-error">{error}</div>}
        <button type="submit" className="btn-primary self-start" disabled={submitting}>
          {submitting && <LoaderCircle size={17} className="animate-spin" />}
          {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>

      <aside className="card p-4 lg:sticky lg:top-24">
        <p className="eyebrow mb-3 px-1">Vista previa</p>
        <div className="product-tile aspect-square">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-black/30">
              <ImageOff size={32} />
            </div>
          )}
        </div>
        <div className="px-1 pt-4 pb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
            {brand || categories.find((c) => c.slug === categorySlug)?.name || 'Vokter'}
          </p>
          <p className="mt-1 font-medium">{name || 'Nombre del producto'}</p>
          <p className="mt-2 font-display text-lg font-semibold">{formatCOP(Number(priceCents) || 0)}</p>
          <p className="mt-2 truncate font-mono text-xs text-muted">{authenticityCode || 'VKT-XXXXXXXX'}</p>
        </div>
      </aside>
    </form>
  );
}
