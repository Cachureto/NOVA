'use client';

import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';

export default function ProductGallery({ images, name, verified }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="product-tile aspect-square rounded-3xl border border-border">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.url}
            src={current.url}
            alt={current.altText ?? name}
            className="absolute inset-0 h-full w-full animate-fade-up object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl font-bold text-black/15">
            NOVA
          </div>
        )}
        {verified && (
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <BadgeCheck size={15} className="text-live" /> Autenticidad verificada
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`product-tile aspect-square rounded-xl border-2 transition-all ${
                i === active ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
