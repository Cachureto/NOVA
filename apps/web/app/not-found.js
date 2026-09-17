import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-page flex max-w-lg flex-col items-center py-28 text-center">
      <p className="display text-8xl text-accent">404</p>
      <h1 className="display mt-6 text-3xl">No encontramos esta página</h1>
      <p className="mt-3 text-muted">Puede que el producto o el drop ya no exista.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
        <Link href="/catalog" className="btn-secondary">
          Ver catálogo <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
