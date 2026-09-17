'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';

export default function Error({ error, reset }) {
  return (
    <div className="container-page flex max-w-lg flex-col items-center py-28 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <TriangleAlert size={26} />
      </span>
      <h1 className="display mt-6 text-3xl">Algo salió mal</h1>
      <p className="mt-3 text-muted">{error?.message ?? 'No pudimos cargar esta página.'}</p>
      <button className="btn-primary mt-8" onClick={() => reset()}>
        <RotateCcw size={16} /> Reintentar
      </button>
    </div>
  );
}
