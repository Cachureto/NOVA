import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageHref(basePath, searchParams, page) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) params.delete('page');
  else params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ page, totalPages, basePath, searchParams }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);

  const itemClass =
    'flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors';

  return (
    <nav className="mt-12 flex items-center justify-center gap-1" aria-label="Paginación">
      {page > 1 ? (
        <Link
          href={pageHref(basePath, searchParams, page - 1)}
          className={`${itemClass} text-muted hover:bg-surface-hover`}
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <span className={`${itemClass} text-border-strong`}>
          <ChevronLeft size={18} />
        </span>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(basePath, searchParams, p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${itemClass} font-mono ${p === page ? 'bg-accent text-accent-foreground' : 'text-muted hover:bg-surface-hover'}`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link
          href={pageHref(basePath, searchParams, page + 1)}
          className={`${itemClass} text-muted hover:bg-surface-hover`}
          aria-label="Página siguiente"
        >
          <ChevronRight size={18} />
        </Link>
      ) : (
        <span className={`${itemClass} text-border-strong`}>
          <ChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}
