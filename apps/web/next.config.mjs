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

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
