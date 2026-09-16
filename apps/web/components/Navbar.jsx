'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

const LINKS = [
  { href: '/catalog', label: 'Catálogo' },
  { href: '/drops', label: 'Drops' },
  { href: '/search', label: 'Buscador IA' },
  { href: '/download', label: 'App móvil' },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
            N
          </span>
          NOVA
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-muted hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/cart" className="btn-ghost relative" aria-label="Carrito">
            Carrito
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
          {loading ? null : user ? (
            <>
              {user.role === 'admin' && (
                <Link href="/admin" className="btn-ghost">
                  Admin
                </Link>
              )}
              <Link href="/account/orders" className="btn-ghost">
                {user.name.split(' ')[0]}
              </Link>
              <button onClick={logout} className="btn-secondary">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Ingresar
              </Link>
              <Link href="/register" className="btn-primary">
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg border border-border p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          <span className="block h-0.5 w-5 bg-foreground" />
          <span className="mt-1 block h-0.5 w-5 bg-foreground" />
          <span className="mt-1 block h-0.5 w-5 bg-foreground" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-muted" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/cart" className="text-sm font-medium text-muted" onClick={() => setOpen(false)}>
              Carrito{count > 0 ? ` (${count})` : ''}
            </Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
              {loading ? null : user ? (
                <>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="btn-secondary" onClick={() => setOpen(false)}>
                      Panel admin
                    </Link>
                  )}
                  <Link href="/account/orders" className="btn-secondary" onClick={() => setOpen(false)}>
                    Mis pedidos
                  </Link>
                  <button onClick={logout} className="btn-ghost">
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary" onClick={() => setOpen(false)}>
                    Ingresar
                  </Link>
                  <Link href="/register" className="btn-primary" onClick={() => setOpen(false)}>
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
