export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Cliente único para Server Components (fetch directo al backend) y Client
// Components (con token y cookies de sesión). Nunca cachea: los datos de
// Vokter (stock, precio, waitlist) cambian a cada rato.
export async function apiFetch(path, { method = 'GET', body, token, withCredentials = false } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: withCredentials ? 'include' : 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con la API de Vokter. ¿Está corriendo el backend?');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Error ${res.status}`, data?.details);
  }
  return data;
}
