'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { CalendarClock, LoaderCircle, Package, Receipt } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const LINKS = [
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/drops', label: 'Drops', icon: CalendarClock },
  { href: '/admin/orders', label: 'Pedidos', icon: Receipt },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="container-page flex justify-center py-32">
        <LoaderCircle size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Administración</p>
          <h1 className="page-title mt-3">Panel NOVA</h1>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1"
          aria-label="Secciones admin"
        >
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-accent text-accent-foreground' : 'text-muted hover:text-foreground'
                }`}
              >
                <Icon size={15} /> {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
