# NOVA — Verified Streetwear & Tech Commerce Platform

NOVA is a full-stack e-commerce platform for sneakers and urban tech, built as a
technical proposal inspired by an analysis of [VOKTER](https://vokter-five.vercel.app/).
Rather than replicating a generic multi-category store, NOVA is designed around
three differentiators the reference platform lacks: **verified product
authenticity**, an **AI shopping assistant**, and a **community-driven drop
system**.

## Why NOVA is different

| VOKTER | NOVA |
|---|---|
| Generic multi-category catalog | Focused on sneakers & urban tech with a clear identity |
| No trust/authenticity mechanism | Unique QR-verifiable authenticity code per product |
| Static, admin-curated bundles | AI concierge that curates bundles from real catalog data |
| Passive email newsletter | Drop calendar with waitlists and push notifications |

## Features

**Web** (`apps/web`, Next.js)
- Product catalog with category, price range and sort filters
- Product detail pages with real photos, authenticity certificate validation and reviews
- Conversational AI search assistant powered by Gemini function calling (grounded strictly in real catalog data — no hallucinated products or prices)
- Cart and checkout flow, order history
- Drop calendar with waitlist sign-up
- Admin panel: manage products, drops and orders
- JWT-based authentication (login/register)
- Mobile app download page (direct APK link + QR code, once a build exists)

**Backend** (`apps/backend`, Express + PostgreSQL)
- Modular API: auth, products, categories, orders, reviews, drops, authenticity, AI search
- JWT access tokens, role-based admin routes
- Zod request validation on every endpoint
- Product authenticity codes (`NVP-XXXX...`) verifiable from the storefront

**Mobile (planned, not yet in this repo)**
- React Native (Expo) app sharing the same backend and JWT auth as the web app
- QR scanner to verify a product's authenticity in person
- Push notifications for new drops

## Tech Stack

| Layer | Technology |
|---|---|
| Web | Next.js (App Router), Tailwind CSS |
| Backend | Node.js, Express 5, JWT, Zod |
| Database | PostgreSQL (local via Docker for development) |
| AI | Google Gemini (`@google/genai`) with function calling over the product database |
| Monorepo | npm workspaces + Turborepo |

## Project Structure

```
.
├── apps/
│   ├── web/         # Next.js storefront (catalog, cart, checkout, admin, AI search)
│   └── backend/     # Express API: auth, catalog, orders, drops, authenticity, AI
├── docker-compose.yml   # Local PostgreSQL for development
├── package.json          # npm workspaces + turbo scripts
└── README.md
```

## Getting Started

Install dependencies once from the repo root (npm workspaces):

```bash
npm install
```

### Database
```bash
npm run db:up   # starts PostgreSQL in Docker (docker-compose.yml)
```
The first boot runs the SQL files in `apps/backend/db/migrations/` automatically.

### Backend
```bash
cd apps/backend
cp .env.example .env   # set DATABASE_URL, JWT_ACCESS_SECRET, GEMINI_API_KEY
npm run dev
```

### Web
```bash
cd apps/web
cp .env.example .env   # set NEXT_PUBLIC_API_URL
npm run dev
```

Or run everything at once from the repo root with `npm run dev` (Turborepo runs both dev servers in parallel).

> **Nota sobre la IA**: la clave gratuita de Gemini (`aistudio.google.com/apikey`) tiene un límite bajo de solicitudes por día por modelo. Si el buscador conversacional empieza a devolver error, probablemente se agotó esa cuota diaria — no es un bug, hay que esperar al reinicio o usar una clave con más cuota.

## Screenshots

*Add screenshots or a short screen recording of the web and mobile apps here
before submission.*

## Authors

- **Alejandro Mier** — [github.com/Cachureto](https://github.com/Cachureto)
- **Juan Villaquiran** — [github.com/pipeeex](https://github.com/pipeeex)
- **Gabriel Badillo** — [github.com/gabrielbadillo123](https://github.com/gabrielbadillo123)

## License

This project was developed for evaluation purposes as part of a technical
assessment referencing [VOKTER](https://vokter-five.vercel.app/) as a design
inspiration only.
