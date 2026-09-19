/**
 * En producción la web y la API son dos proyectos de Vercel con dominios
 * distintos. Para el navegador eso rompería el login: la cookie httpOnly del
 * refresh token es sameSite=lax y el navegador no la manda entre dominios.
 *
 * Con este rewrite el navegador siempre habla con el dominio de la web y Next
 * reenvía /api/* al backend por detrás. Todo queda same-site, sin CORS y con
 * una sola URL pública.
 */
const API_ORIGIN =
  process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Los rewrites se resuelven al construir, no en cada petición: lo que se
// escriba aquí queda congelado en el build. Si la variable falta en Vercel, el
// fallback a localhost se hornea y el resultado es una web desplegada en la que
// /api/* da 404 y las páginas revientan al renderizar, sin ninguna pista de por
// qué. Es mejor que el build falle aquí y se vea el motivo.
if (process.env.VERCEL && !process.env.API_ORIGIN && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    'Falta API_ORIGIN. Defínela en las variables de entorno del proyecto ' +
      '(marcada para Production) con el dominio de la API, sin barra final.',
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
