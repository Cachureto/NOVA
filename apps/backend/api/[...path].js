/**
 * Punto de entrada de la API en Vercel.
 *
 * Vercel convierte cada archivo de `api/` en una función. El nombre
 * `[...path].js` es una ruta comodín: atiende `/api/health`, `/api/products/…`
 * y cualquier otra cosa bajo `/api`, y la función recibe la URL original, así
 * que el enrutado de Express sigue funcionando tal cual.
 *
 * Se hace con un archivo de verdad, y no confiando en que Vercel adivine que
 * esto es una app de Express, porque esa detección no estaba entrando y el
 * build terminaba buscando un sitio estático ("No Output Directory named
 * public"). Aquí no hay nada que adivinar.
 *
 * `src/server.js` (el `app.listen` de local) no se toca ni se usa: en
 * serverless quien escucha es Vercel.
 */
export { app as default } from '../src/app.js';
