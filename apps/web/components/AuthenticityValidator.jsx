'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

const RESULT_TEXT = {
  valid: (p) => `✓ Código auténtico — ${p?.name ?? 'producto NOVA'}`,
  revoked: () => 'Este código fue revocado. No confíes en este producto.',
  not_found: () => 'Este código no existe en la base de datos de NOVA.',
  suspicious: () => 'Formato de código inválido — no corresponde a NOVA.',
};

export default function AuthenticityValidator({ defaultCode }) {
  const [code, setCode] = useState(defaultCode ?? '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch('/api/authenticity/validate', {
        method: 'POST',
        body: { code, source: 'web' },
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold">Código de autenticidad</h2>
      <p className="mt-1 text-sm text-muted">Verifica que este producto sea 100% original NOVA.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          className="input font-mono"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="NVP-XXXXXXXX"
        />
        <button type="submit" className="btn-secondary shrink-0" disabled={loading}>
          {loading ? 'Validando…' : 'Validar'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {result && (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            result.valid ? 'border-live/40 bg-live/10 text-live' : 'border-danger/40 bg-danger/10 text-danger'
          }`}
        >
          {(RESULT_TEXT[result.result] ?? (() => 'Resultado desconocido'))(result.product)}
        </div>
      )}
    </div>
  );
}
