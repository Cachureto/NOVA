import Link from 'next/link';

// Marca Vokter: estrella de 4 puntas (una "nova") + wordmark
export function VokterMark({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M16 5.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5-.6-5.6-4.9-9.9-10.5-10.5C11.1 15.4 15.4 11.1 16 5.5Z"
        fill="var(--accent-foreground)"
      />
    </svg>
  );
}

export default function Logo({ className = '' }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Vokter, ir al inicio">
      <VokterMark className="h-8 w-8 transition-transform duration-500 group-hover:rotate-90" />
      <span className="font-display text-lg font-bold tracking-[-0.04em]">Vokter</span>
    </Link>
  );
}
