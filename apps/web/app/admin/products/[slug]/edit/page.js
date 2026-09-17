'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import ProductForm from '@/components/admin/ProductForm';
import AdminHeader from '@/components/admin/AdminHeader';

export default function EditProductPage() {
  const { slug } = useParams();
  const [categories, setCategories] = useState(null);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([apiFetch('/api/categories'), apiFetch(`/api/products/${slug}`)])
      .then(([cats, prod]) => {
        setCategories(cats.items);
        setProduct(prod);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <div className="alert-error">{error}</div>;
  if (!categories || !product) return <div className="skeleton h-96 max-w-3xl" />;

  return (
    <div>
      <AdminHeader title="Editar producto" description={product.name} backHref="/admin/products" />
      <ProductForm categories={categories} initial={product} />
    </div>
  );
}
