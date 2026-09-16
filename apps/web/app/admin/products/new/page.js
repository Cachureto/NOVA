'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    apiFetch('/api/categories').then((r) => setCategories(r.items));
  }, []);

  if (!categories) return null;

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Nuevo producto</h2>
      <ProductForm categories={categories} />
    </div>
  );
}
