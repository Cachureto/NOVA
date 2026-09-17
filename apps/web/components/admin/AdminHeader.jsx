import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

export default function AdminHeader({ title, description, actionHref, actionLabel, backHref }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
          >
            <ArrowLeft size={14} /> Volver
          </Link>
        )}
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actionHref && (
        <Link href={actionHref} className="btn-primary">
          <Plus size={17} /> {actionLabel}
        </Link>
      )}
    </div>
  );
}
