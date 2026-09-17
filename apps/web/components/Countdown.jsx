'use client';

import { useEffect, useState } from 'react';

const UNITS = [
  ['d', 'Días', 86400],
  ['h', 'Horas', 3600],
  ['m', 'Min', 60],
  ['s', 'Seg', 1],
];

function split(ms) {
  let total = Math.max(0, Math.floor(ms / 1000));
  return UNITS.map(([key, label, secs]) => {
    const value = Math.floor(total / secs);
    total -= value * secs;
    return { key, label, value };
  });
}

// El tiempo se calcula solo en el cliente para evitar diferencias de hidratación
export default function Countdown({ target, size = 'md' }) {
  const [parts, setParts] = useState(null);

  useEffect(() => {
    const tick = () => setParts(split(new Date(target).getTime() - Date.now()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [target]);

  const box = size === 'lg' ? 'min-w-16 px-3 py-3 text-3xl' : 'min-w-12 px-2 py-2 text-xl';

  return (
    <div className="flex items-center gap-2" aria-live="off">
      {(parts ?? UNITS.map(([key, label]) => ({ key, label, value: null }))).map((p) => (
        <div key={p.key} className="flex flex-col items-center gap-1.5">
          <span
            className={`rounded-xl border border-border bg-background text-center font-mono font-semibold tabular-nums ${box}`}
          >
            {p.value === null ? '--' : String(p.value).padStart(2, '0')}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
