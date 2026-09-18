'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import AuthShell from '@/components/AuthShell';
import PasswordInput from '@/components/PasswordInput';

function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Bienvenido de vuelta"
      title="Ingresa a Vokter"
      description="Accede para comprar, dejar reseñas y unirte a los drops."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link href={`/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">
            Crea una gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <div className="alert-error" role="alert">
            <CircleAlert size={18} className="shrink-0" />
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary h-12 text-[15px]" disabled={loading}>
          {loading && <LoaderCircle size={18} className="animate-spin" />}
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
