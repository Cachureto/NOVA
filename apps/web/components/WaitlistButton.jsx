'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

export default function WaitlistButton({ dropSlug, disabled }) {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleJoin() {
    if (!user) {
      router.push(`/login?next=/drops/${dropSlug}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/drops/${dropSlug}/waitlist`, { method: 'POST', token: accessToken });
      setJoined(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return <span className="badge text-live border-live/30">✓ Estás en la lista de espera</span>;
  }

  return (
    <div>
      <button className="btn-primary" onClick={handleJoin} disabled={loading || disabled}>
        {loading ? 'Uniendo…' : disabled ? 'Lista de espera cerrada' : 'Unirme a la lista de espera'}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
