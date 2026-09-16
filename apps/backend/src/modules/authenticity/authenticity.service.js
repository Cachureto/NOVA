import crypto from 'node:crypto';
import { query } from '../../db/pool.js';

// NVP- = código de producto (impreso en la ficha), NVU- = código de unidad física (QR en el par).
const WELL_FORMED_RE = /^NV[PU]-[A-Z0-9-]{8,60}$/i;

function classify(match) {
  if (!match) return 'not_found';
  return match.isActive ? 'valid' : 'revoked';
}

// Cada verificación queda auditada en authenticity_checks, exista o no el código:
// permite detectar patrones de escaneo sospechosos (mismo código revocado escaneado muchas veces, etc.).
export async function validateCode({ code, source }, requesterIp, userId) {
  const { rows } = await query(
    `SELECT code, code_type AS "codeType", product_id AS "productId", unit_id AS "unitId",
            product_name AS "productName", is_active AS "isActive", status
     FROM v_authenticity_lookup WHERE code = $1`,
    [code],
  );
  const match = rows[0];
  const result = WELL_FORMED_RE.test(code) ? classify(match) : 'suspicious';

  const ipHash = requesterIp ? crypto.createHash('sha256').update(requesterIp).digest('hex') : null;
  await query(
    `INSERT INTO authenticity_checks (code_scanned, product_id, unit_id, user_id, result, source, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [code, match?.productId ?? null, match?.unitId ?? null, userId ?? null, result, source, ipHash],
  );

  return {
    code,
    result,
    valid: result === 'valid',
    product: match ? { id: match.productId, name: match.productName, type: match.codeType } : null,
  };
}
