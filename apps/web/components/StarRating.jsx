import { Star } from 'lucide-react';

export default function StarRating({ value = 0, size = 14, className = '' }) {
  const rounded = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rounded ? 'fill-accent text-accent' : 'fill-transparent text-border-strong'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
