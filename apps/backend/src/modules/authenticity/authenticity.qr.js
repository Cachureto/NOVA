import QRCode from 'qrcode';
import { query } from '../../db/pool.js';
import { notFound } from '../../utils/httpError.js';

const WELL_FORMED_RE = /^VK[TU]-[A-Z0-9-]{8,60}$/i;

/**
 * Genera el QR de un código de autenticidad como SVG.
 * El QR lleva el código pelado (VKT-…): la app de Vokter lo reconoce y
 * cualquier otro lector muestra el texto, que es lo que está impreso en la caja.
 * Solo se genera para códigos que existen, así no se imprimen etiquetas falsas.
 */
export async function authenticityQrSvg(rawCode) {
  const code = String(rawCode ?? '').trim().toUpperCase();
  if (!WELL_FORMED_RE.test(code)) throw notFound('Código no válido');

  const { rows } = await query('SELECT code FROM v_authenticity_lookup WHERE code = $1', [code]);
  if (!rows[0]) throw notFound('Código no encontrado');

  return QRCode.toString(code, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#09090b', light: '#ffffff' },
  });
}
