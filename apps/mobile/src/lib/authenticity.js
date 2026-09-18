import { apiFetch } from './api';

// VKT- = código de producto (el que sale en la ficha), VKU- = código de una unidad física.
const CODE_RE = /VK[TU]-[A-Z0-9-]{8,60}/i;

/**
 * El QR puede traer el código pelado o dentro de una URL.
 * Si no reconocemos nada, mandamos el texto tal cual: el backend lo registra
 * como sospechoso, que es justo lo que queremos saber.
 */
export function extractCode(scanned) {
  const text = String(scanned ?? '').trim();
  const match = text.match(CODE_RE);
  return (match ? match[0] : text).toUpperCase().slice(0, 64);
}

export async function validateCode(code) {
  return apiFetch('/api/authenticity/validate', {
    method: 'POST',
    body: { code, source: 'mobile' },
    auth: true, // si hay sesión, la verificación queda asociada al usuario
  });
}

export const RESULTS = {
  valid: {
    icon: 'shield-checkmark',
    tone: 'live',
    title: 'Producto auténtico',
    text: 'Este código está registrado y activo en Vokter.',
  },
  revoked: {
    icon: 'alert-circle',
    tone: 'warning',
    title: 'Código revocado',
    text: 'El código existe pero fue dado de baja. No confíes en este producto.',
  },
  not_found: {
    icon: 'close-circle',
    tone: 'danger',
    title: 'No está en Vokter',
    text: 'Ningún producto nuestro tiene este código.',
  },
  suspicious: {
    icon: 'warning',
    tone: 'danger',
    title: 'Código sospechoso',
    text: 'No tiene el formato de un código de Vokter (VKT- o VKU-).',
  },
};
