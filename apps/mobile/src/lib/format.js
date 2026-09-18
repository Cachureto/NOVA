// Formato de precio igual que la web (apps/web/lib/format.js).
// Hermes trae Intl completo en Android, pero dejamos un respaldo manual por si
// alguna build sale sin ICU.
export function formatCOP(value) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$ ${Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('es-CO').format(n);
  } catch {
    return String(n);
  }
}
