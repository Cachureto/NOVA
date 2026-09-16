'use client';

export default function Error({ error, reset }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="text-muted">{error?.message ?? 'No pudimos cargar esta página.'}</p>
      <button className="btn-primary" onClick={() => reset()}>
        Reintentar
      </button>
    </div>
  );
}
