# NOVA — notas de estado del proyecto

Monorepo (npm workspaces + turbo): `apps/backend` (Express + PostgreSQL) y `apps/web` (Next.js). No hay app móvil todavía.

## Cómo correrlo en local

```bash
npm run db:up                 # Postgres en Docker (docker-compose.yml), puerto host 5433
cd apps/backend && npm run dev # necesita apps/backend/.env (ver .env.example) — no está en git
cd apps/web && npm run dev
```

`apps/backend/.env` no existe en git (gitignored). `DATABASE_URL` debe apuntar a `localhost:5433` (no 5432), porque así lo expone `docker-compose.yml`.

## Estado actual (última sesión: 2026-09-16)

- Backend: módulos de auth, products, categories, orders, reviews, drops, authenticity, ai — todos implementados.
- Web: catálogo con filtros (categoría/precio/orden, ya verificado que funciona), carrito, checkout, login/registro, panel admin, calendario de drops, validador de autenticidad, buscador conversacional con IA (Gemini).
- Base de datos: 54 productos, 41 con foto real. Las fotos vienen de un catálogo mayorista de fotos que el usuario compartió (`apps/web/public/products/*.jpg`). Los productos y sus imágenes se insertaron directo por SQL (no hay migración versionada para esos datos de catálogo — si se recrea la BD desde cero con `db:down && db:up`, esos 54 productos y sus imágenes **no vuelven a aparecer solos**, solo quedan los `.jpg` en disco).
- IA conversacional: usa Gemini (`GEMINI_API_KEY` en `.env`). **La clave está en el tier gratis: 20 solicitudes/día por modelo.** Si el buscador tira error, probablemente se agotó la cuota del día — no es un bug de código. `apps/backend/src/modules/ai/ai.service.js` ya reintenta en 503 transitorio y da un mensaje claro si es 429 por cuota.
- Pendiente/pistas para retomar: varios tenis genéricos (categoría sneakers) y "NOVA Audífonos Urban Pro" siguen sin foto — no había fotos de ellos en el material que compartió el usuario.
- Repo remoto: `https://github.com/Cachureto/NOVA`, rama `main`. El usuario (`gabrielbadillo123`) no tenía permiso de push en un token; usó uno de otra cuenta que sí tenía acceso.
