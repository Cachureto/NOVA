// Zona horaria fija: el servidor (UTC) y el navegador renderizan la misma hora
// y se evitan errores de hidratación en componentes cliente.
const TIME_ZONE = 'America/Bogota';

export function formatCOP(cents) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents);
}

// Se arma por partes porque "dateStyle + timeStyle" cambia de texto entre versiones de ICU (Node vs navegador)
export function formatDate(iso) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(d);
  const time = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: TIME_ZONE,
  }).format(d);
  return `${date}, ${time}`;
}

export function formatShortDate(iso) {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: TIME_ZONE }).format(
    new Date(iso),
  );
}

export function formatNumber(n) {
  return new Intl.NumberFormat('es-CO').format(n);
}
