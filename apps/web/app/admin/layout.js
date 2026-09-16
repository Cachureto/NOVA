'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const LINKS = [
  { href: '/admin/products', label: 'Productos' },
  { href: '/admin/drops', label: 'Drops' },
  { href: '/admin/orders', label: 'Pedidos' },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <nav className="flex gap-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={pathname.startsWith(l.href) ? 'btn-primary' : 'btn-secondary'}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
