# Vokter — Verified Urban Tech Commerce

Vokter is a full-stack e-commerce platform for urban tech, accessories and home goods. Instead of
being a generic multi-category store, Vokter is built around three differentiators: **verified
product authenticity** on every item, an **AI shopping assistant** grounded strictly in the real
catalog, and **drops with waitlists** for limited releases.

## What makes Vokter different

- **Curated urban tech catalog** with its own visual identity, not a generic multi-category dump.
- **Verified authenticity.** Every product carries a unique, verifiable code (`VKT-…`) that customers
  can validate on the web or in the app.
- **Grounded AI assistant.** It answers only with real products, prices and stock — never invents
  an item that isn't in the catalog.
- **Drop calendar** with countdowns, waitlists and (mobile) push alerts for limited releases.

## Features

**Web** (`apps/web`, Next.js)
- Home with live/upcoming drop, categories with product counts, new arrivals and AI entry point
- Catalog with category and price filters, text search, sorting and pagination
- Product page with gallery, stock status, authenticity certificate validation, reviews and related products
- Conversational AI assistant (Gemini function calling) that never invents products, prices or stock
- Drop calendar with countdowns and waitlist sign-up
- Cart, checkout and order history with order progress
- Admin panel: products, drops and orders
- JWT authentication (register/login) shared with the future mobile app
- Mobile app download page (direct APK link + QR code once a build exists)

**Backend** (`apps/backend`, Express + PostgreSQL)
- Modules: auth, products, categories, orders, reviews, drops, authenticity, AI search
- Short-lived JWT access tokens + rotating refresh tokens (httpOnly cookie on web, body on mobile)
- Role-based admin routes and Zod validation on every endpoint
- Authenticity validation with an audit log of every check
- AI assistant: the model only translates the message into filters; results always come from PostgreSQL,
  with automatic filter relaxation when the model picks a category that returns nothing

**Mobile** (`apps/mobile`, planned)
- React Native (Expo) app using the same backend and JWT auth
- QR scanner to verify a product's authenticity in person
- Push notifications for new drops

## Tech stack

| Layer | Technology |
|---|---|
| Web | Next.js 16 (App Router), React 19, Tailwind CSS 4, lucide-react, self-hosted fonts (Fontsource) |
| Backend | Node.js 22, Express 5, JWT, Zod, bcryptjs |
| Database | PostgreSQL 16 (Docker for local development) |
| AI | Google Gemini (`@google/genai`) with function calling |
| Monorepo | npm workspaces + Turborepo |

## Project structure

```
.
├── apps/
│   ├── backend/
│   │   ├── db/
│   │   │   ├── migrations/   # SQL schema (run automatically on the first Docker boot)
│   │   │   └── seeds/        # Demo catalog: 40 products, 6 categories, 3 drops
│   │   ├── scripts/          # seed.js (db:seed) and make-admin.js (db:admin)
│   │   └── src/
│   │       ├── config/  db/  middleware/  utils/
│   │       └── modules/      # auth, products, categories, orders, reviews, drops, authenticity, ai
│   └── web/
│       ├── app/              # Routes: catalog, products, drops, search, cart, checkout, account, admin…
│       ├── components/       # UI components (ProductCard, FilterBar, AuthenticityValidator…)
│       ├── lib/              # API client, auth/cart contexts, formatters
│       └── public/products/  # Product photos used by the demo catalog
├── docker-compose.yml        # Local PostgreSQL 16 (host port 5433)
├── package.json              # npm workspaces + scripts
└── turbo.json
```

## Getting started

**Requirements:** Node.js 22+, npm 10+, Docker Desktop.

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
npm run db:up
```

On the first boot Docker runs every file in `apps/backend/db/migrations/`. The database is exposed on
`localhost:5433` (user `nova`, password `nova_dev`, database `nova`).

### 3. Configure environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

In `apps/backend/.env` set at least:
- `JWT_ACCESS_SECRET`: generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `GEMINI_API_KEY`: free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (only needed for the AI assistant)

### 4. Load the demo catalog

```bash
npm run db:seed
```

Idempotent: it can be run many times without duplicating data. Prices and stock are demo values.

### 5. Run the apps

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/health

### 6. Create an admin account

Every account created from the website is a customer. To open the admin panel, register on the web
and then run:

```bash
npm run db:admin -- your@email.com
```

Log out and log in again so the session picks up the admin role. To create a new admin account
directly (the password is asked in the terminal):

```bash
npm run db:admin -- your@email.com "Your Name"
```

## Available scripts (repo root)

| Script | What it does |
|---|---|
| `npm run dev` | Runs web and backend in parallel (Turborepo) |
| `npm run build` | Production build |
| `npm run lint` | Lints the web app |
| `npm run db:up` / `db:down` | Starts / stops the PostgreSQL container |
| `npm run db:reset` | Deletes the database volume and recreates it from the migrations |
| `npm run db:seed` | Loads the demo catalog |
| `npm run db:admin -- email` | Gives admin role to an account (or creates it) |

## Sharing the database with the team

For a clean setup, each teammate runs steps 2–6 above. To share your exact data (products, orders,
accounts), export a dump:

```bash
docker exec nova-db pg_dump -U nova -d nova -Fc --no-owner --exclude-table-data=refresh_tokens -f /tmp/nova.dump
docker cp nova-db:/tmp/nova.dump ./nova.dump
```

And restore it (backend stopped; this **replaces** the local database):

```bash
docker cp ./nova.dump nova-db:/tmp/nova.dump
docker exec nova-db psql -U nova -d postgres -c "DROP DATABASE IF EXISTS nova WITH (FORCE)" -c "CREATE DATABASE nova"
docker exec nova-db pg_restore -U nova -d nova --no-owner /tmp/nova.dump
```

Dumps contain user emails and password hashes: share them privately and never commit them
(`*.dump` is git-ignored).

## Technical decisions

- **Relational model instead of arrays.** Order items, drop products and waitlists are join tables
  with foreign keys, so data stays consistent and queries per user are indexed.
- **Money as integers.** Prices are stored as integer pesos (`price_cents`), never floats, and are
  frozen in `order_items` at purchase time.
- **Authenticity.** Product codes (`VKT-…`) live on each product; the schema also supports per-unit
  codes (`VKU-…`) for physical QR labels. Every validation is logged in `authenticity_checks`.
- **Grounded AI.** Gemini only returns structured filters (text, category, price range) through
  function calling. Categories come from the database, and products, prices and stock always come
  from PostgreSQL, so the assistant cannot hallucinate items.
- **Auth for web and mobile.** 15-minute access JWT plus rotating refresh tokens stored hashed.
  Reusing an already-rotated refresh token revokes every session of that user.
- **Always-fresh pages.** Catalog, drops and stock pages render on every request, so they never show
  stale prices or stock.

## Troubleshooting

- **The AI assistant returns an error:** the free Gemini key has a low daily request quota per model.
  Wait for the reset or use a key with more quota.
- **`password authentication failed`:** check that `DATABASE_URL` uses port `5433` when using Docker.
- **The admin panel redirects to the home page:** the account is not an admin yet (see step 6) or the
  session is older than the role change; log out and log in again.

## Mobile app download

The APK link and QR code will be available at `/download` once the first EAS build is published
(`NEXT_PUBLIC_APK_URL` in `apps/web/.env`).

## Authors

- **Alejandro Mier** — [github.com/Cachureto](https://github.com/Cachureto)
- **Juan Villaquiran** — [github.com/pipeeex](https://github.com/pipeeex)
- **Gabriel Badillo** — [github.com/gabrielbadillo123](https://github.com/gabrielbadillo123)

## License

This project was developed for evaluation purposes as part of a technical assessment.
