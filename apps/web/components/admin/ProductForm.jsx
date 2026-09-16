'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

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
        <label className="label" htmlFor="category">
          Categoría
        </label>
        <select id="category" className="input" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="brand">
          Marca (opcional)
        </label>
        <input id="brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
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
      <div className="grid grid-cols-2 gap-4">
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
          className="input font-mono"
          required
          placeholder="NVP-XXXXXXXX"
          value={authenticityCode}
          onChange={(e) => setAuthenticityCode(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="imageUrl">
          URL de imagen (opcional)
        </label>
        <input id="imageUrl" className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" className="btn-primary self-start" disabled={submitting}>
        {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
      </button>
    </form>
  );
}
