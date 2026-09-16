'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import ProductForm from '@/components/admin/ProductForm';

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

  if (error) return <p className="text-danger">{error}</p>;
  if (!categories || !product) return null;

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Editar producto</h2>
      <ProductForm categories={categories} initial={product} />
    </div>
  );
}
