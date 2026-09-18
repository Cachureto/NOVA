import Constants from 'expo-constants';
import { clearTokens, getTokens, saveTokens } from './session';

const DEFAULT_PORT = 4000; // backend Express
const WEB_PORT = 3000; // Next.js, que es quien sirve las fotos de /public

/**
 * Host desde el que Expo está sirviendo el bundle.
 * En el emulador y en un teléfono físico ese host es la IP del PC donde corre
 * Metro, que es el mismo PC donde corre el backend. Así la app encuentra la API
 * sola, sin tener que escribir la IP a mano en el .env.
 */
function hostFromExpo() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    '';
  const host = String(hostUri).split('/')[0].split(':')[0];
  return host || null;
}

function normalize(url) {
  const clean = String(url ?? '').trim().replace(/\/+$/, '');
  if (!clean) return null;
  return /^https?:\/\//i.test(clean) ? clean : `http://${clean}`;
}

/** URL por defecto: .env si existe, si no la IP detectada de Expo. */
export function detectApiUrl() {
  const fromEnv = normalize(process.env.EXPO_PUBLIC_API_URL);
  if (fromEnv) return fromEnv;
  const host = hostFromExpo();
  return `http://${host ?? 'localhost'}:${DEFAULT_PORT}`;
}

/**
 * Las fotos del catálogo se guardan como rutas relativas (`/products/x.jpg`) y
 * las sirve la web de Next.js, no la API. Por eso necesitan otro origen.
 */
export function detectWebUrl() {
  const fromEnv = normalize(process.env.EXPO_PUBLIC_WEB_URL);
  if (fromEnv) return fromEnv;
  // Mismo host que la API (así respeta la IP manual de Ajustes), otro puerto.
  const host = getApiUrl().replace(/^https?:\/\//i, '').split(':')[0];
  return `http://${host || 'localhost'}:${WEB_PORT}`;
}

/** Convierte la ruta que devuelve la API en una URL que el teléfono puede abrir. */
export function resolveImage(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${detectWebUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Override en memoria (la pantalla de Ajustes lo puede cambiar para probar otra IP).
let override = null;
export function setApiUrl(url) {
  override = normalize(url);
  return override;
}
export function getApiUrl() {
  return override ?? detectApiUrl();
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  /** Primer mensaje de validación del backend, si lo hay. */
  get fieldMessage() {
    return Array.isArray(this.details) && this.details[0]?.message
      ? this.details[0].message
      : null;
  }
}

async function request(path, { method = 'GET', body, token, timeoutMs = 10000 } = {}) {
  const base = getApiUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, `No se pudo conectar con ${base}`);
  } finally {
    clearTimeout(timer);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  return { ok: res.ok, status: res.status, data };
}

// Un solo refresh a la vez aunque varias peticiones reciban 401 al tiempo.
let refreshing = null;

async function refreshTokens() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const { refreshToken } = getTokens();
    if (!refreshToken) return null;
    try {
      const { ok, data } = await request('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken, client: 'mobile' },
      });
      if (!ok || !data?.accessToken) {
        await clearTokens();
        return null;
      }
      await saveTokens(data.accessToken, data.refreshToken);
      return data;
    } catch {
      // Error de red: no borramos la sesión, puede ser temporal.
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/**
 * Cliente único de la app.
 * `auth: true` agrega el access token y, si el backend responde 401, lo renueva
 * con el refresh token y reintenta una vez.
 */
export async function apiFetch(path, { auth = false, ...options } = {}) {
  const token = auth ? getTokens().accessToken : options.token;
  let res = await request(path, { ...options, token });

  if (auth && res.status === 401) {
    const renewed = await refreshTokens();
    if (renewed?.accessToken) {
      res = await request(path, { ...options, token: renewed.accessToken });
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, res.data?.error ?? `Error ${res.status}`, res.data?.details);
  }
  return res.data;
}
