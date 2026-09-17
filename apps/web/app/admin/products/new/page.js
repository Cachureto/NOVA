'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import ProductForm from '@/components/admin/ProductForm';
import AdminHeader from '@/components/admin/AdminHeader';

export default function NewProductPage() {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    apiFetch('/api/categories').then((r) => setCategories(r.items));
  }, []);

  if (!categories) return <div className="skeleton h-96 max-w-3xl" />;

  return (
    <div>
      <AdminHeader
        title="Nuevo producto"
        description="Completa la ficha y asigna su código de autenticidad."
        backHref="/admin/products"
      />
      <ProductForm categories={categories} />
    </div>
  );
}
