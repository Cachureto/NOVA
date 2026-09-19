# Vokter — Verified Urban Tech Commerce

Vokter is a full-stack e-commerce platform for urban tech, accessories and home goods. Instead of
being a generic multi-category store, Vokter is built around three differentiators: **verified
product authenticity** on every item, an **AI shopping assistant** grounded strictly in the real
catalog, and **drops with waitlists** for limited releases.

## What makes Vokter different

- **Curated urban tech catalog** with its own visual identity, not a generic multi-category dump.
- **Verified authenticity.** Every product carries a unique, verifiable code (`VKT-…`) that customers
  can validate on the web or by scanning its QR with the app.
- **Grounded AI assistant.** It answers only with real products, prices and stock — never invents
  an item that isn't in the catalog.
- **Drop calendar** with countdowns, waitlists and push alerts for limited releases.

## Features

**Web** (`apps/web`, Next.js)
- Home with live/upcoming drop, categories with product counts, new arrivals and AI entry point
- Catalog with category and price filters, text search, sorting and pagination
- Product page with gallery, stock status, authenticity certificate (code + scannable QR), reviews
  and related products
- Conversational AI assistant (Gemini function calling) that never invents products, prices or stock
- Drop calendar with countdowns and waitlist sign-up
- Cart, checkout and order history with order progress
- Admin panel: products, drops and orders
- JWT authentication (register/login) shared with the mobile app
- App download page with a direct APK link and a QR code

**Backend** (`apps/backend`, Express + PostgreSQL)
- Modules: auth, products, categories, orders, reviews, drops, authenticity, notifications, AI search
- Short-lived JWT access tokens + rotating refresh tokens (httpOnly cookie on web, body on mobile)
- Role-based admin routes and Zod validation on every endpoint
- Authenticity validation with an audit log of every check, plus a printable QR per code
- Push notifications to a drop's waitlist when it goes live (Expo push, idempotent per drop)
- AI assistant: the model only translates the message into filters; results always come from PostgreSQL,
  with automatic filter relaxation when the model picks a category that returns nothing

**Mobile** (`apps/mobile`, Expo + Expo Router)
- Catalog with search, category filters and pagination; product detail with gallery
- Cart, checkout and order history
- Login and register with the same JWT auth as the web
- QR scanner to verify a product's authenticity in person
- Drop waitlists with push notifications

## Tech stack

| Layer | Technology |
|---|---|
| Web | Next.js 16 (App Router), React 19, Tailwind CSS 4, lucide-react, self-hosted fonts (Fontsource) |
| Backend | Node.js 22, Express 5, JWT, Zod, bcryptjs, qrcode, expo-server-sdk |
| Database | PostgreSQL 16 (Docker for local development) |
| Mobile | React Native 0.86, Expo SDK 57, Expo Router, EAS Build |
| AI | Google Gemini (`@google/genai`) with function calling |
| Monorepo | npm workspaces + Turborepo |

## Project structure

```
.
├── apps/
│   ├── backend/
│   │   ├── db/
│   │   │   ├── migrations/   # SQL schema, applied in order by db:migrate
│   │   │   ├── seeds/        # Demo catalog: 40 products, 6 categories, 3 drops
│   │   │   └── dump-latest.sql  # Optional: exact copy of the team's catalog
│   │   ├── scripts/          # migrate.js, seed.js, make-admin.js
│   │   └── src/
│   │       ├── config/  db/  middleware/  utils/
│   │       └── modules/      # auth, products, categories, orders, reviews,
│   │                         # drops, authenticity, notifications, ai
│   ├── web/
│   │   ├── app/              # Routes: catalog, products, drops, search, cart, checkout, admin…
│   │   ├── components/       # ProductCard, FilterBar, AuthenticityValidator…
│   │   ├── lib/              # API client, auth/cart contexts, formatters
│   │   └── public/products/  # Product photos used by the catalog
│   └── mobile/
│       ├── app/              # Screens (Expo Router): index, product/[slug], carrito,
│       │                     # pedidos, escaner, drops, login, registro, cuenta, ajustes
│       ├── src/lib/          # api, session, auth-context, cart-context, push, authenticity
│       └── eas.json          # Build profiles (the APK comes from `preview`)
├── docker-compose.yml        # Local PostgreSQL 16 (host port 5433)
├── package.json              # npm workspaces + scripts
└── turbo.json
```

---

# Getting started

**Requirements**

| | |
|---|---|
| Node.js | 22 or newer (`node -v`) |
| npm | 10 or newer (`npm -v`) |
| Docker Desktop | running, for the database |
| For the mobile app | a physical Android phone with **Expo Go**, or Android Studio with an emulator |

Every command below is run **from the repository root** unless it says otherwise.

### 1. Install dependencies

```bash
npm install
```

One install covers the three apps — it's an npm workspaces monorepo.

### 2. Start PostgreSQL

```bash
npm run db:up
```

This starts the `nova-db` container with PostgreSQL 16, exposed on **`localhost:5433`** (user `nova`,
password `nova_dev`, database `nova`). Port 5433 and not 5432, so it doesn't collide with a
PostgreSQL you may already have installed on your machine.

### 3. Configure environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

Neither `.env` is in git. In `apps/backend/.env` you must set:

- **`JWT_ACCESS_SECRET`** — any random string of 32+ characters. Generate one with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

- **`GEMINI_API_KEY`** — only for the AI assistant. Free key at
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Everything else works without it.

`DATABASE_URL` already points to port **5433** in the example; leave it as it is unless you changed
`docker-compose.yml`.

### 4. Create the schema

```bash
npm run db:migrate
```

Applies every pending file in `db/migrations/` and records it in the `schema_migrations` table, so
it is safe to run again: it only applies what's missing.

On a brand-new container Docker already ran those files on first boot, so this just registers them
and finishes. It matters later: run it after every `git pull` that brings a new migration, and
**you never need to delete the database to update the schema.**

### 5. Load the catalog

```bash
npm run db:seed
```

40 demo products, 6 categories and 3 drops. Idempotent, so running it twice doesn't duplicate
anything. Prices and stock are demo values.

If you want the **exact same catalog as the rest of the team** (same products, photos and drops),
use the committed dump instead:

```bash
npm run db:restore
```

The dump excludes account data (users, tokens, orders, reviews) on purpose, so it carries no
personal data and is safe to commit.

To regenerate it after changing the catalog, run this from the repository root:

```bash
docker exec nova-db pg_dump -U nova -d nova --clean --if-exists --no-owner --no-acl \
  --exclude-table-data=users --exclude-table-data=refresh_tokens --exclude-table-data=push_tokens \
  --exclude-table-data=orders --exclude-table-data=order_items --exclude-table-data=reviews \
  --exclude-table-data=authenticity_checks --exclude-table-data=ai_tool_calls --exclude-table-data=drop_waitlist \
  | findstr /v "^COMMENT ON EXTENSION" > apps/backend/db/dump-latest.sql
```

`--no-owner --no-acl` and dropping the `COMMENT ON EXTENSION` lines are what make the dump portable.
Without them it carries `ALTER ... OWNER TO nova`, and restoring it into a managed database (Neon,
Supabase…) fails with `must be able to SET ROLE "nova"`, because there the owner is another role.
With them, the objects belong to whoever runs the restore: `nova` locally, `neondb_owner` on Neon.

### 6. Run web and backend

```bash
npm run dev
```

Turborepo starts both in parallel:

- Web → <http://localhost:3000>
- API → <http://localhost:4000/api/health> (should answer `{"status":"ok"}`)

At this point you can register an account on the web and browse the catalog.

### 7. Create an admin account

Every account created from the website is a customer. Register on the web, then promote it:

```bash
npm run db:admin -- your@email.com
```

Log out and log in again so the session picks up the new role, and the **Admin** entry appears in
the menu. To create an admin from scratch instead (it asks for the password in the terminal):

```bash
npm run db:admin -- your@email.com "Your Name"
```

---

## Running the mobile app

The app talks to the backend on your computer, so **the backend and the web have to be running**
(`npm run dev`) and the phone has to be on the **same Wi-Fi** as the computer.

### 1. Open the port in the firewall

This is the step people forget, and the symptom is the app showing "Sin conexión" while the web
works fine: Windows blocks incoming connections to Node by default. In **PowerShell as
administrator**, once:

```powershell
New-NetFirewallRule -DisplayName "Vokter API 4000" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "Vokter Web 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
```

Port 4000 is the API; **3000 is needed too**, because the product photos are served by Next.js, not
by the backend. Without it the catalog loads but the images come out blank.

### 2. Start the app

```bash
cd apps/mobile
npx expo start --android --clear
```

Scan the QR with Expo Go (physical phone) or press `a` to open it in the emulator.

**You don't have to configure the IP.** The app reads the address Expo is serving the bundle from
and looks for the API on that same host, so it works on an emulator and on a physical phone with
the same code. If you ever need to point it elsewhere, the **Ajustes** screen (Account → Connection)
lets you type the URL on the device, and it's remembered.

> Push notifications do **not** work in Expo Go: Expo removed remote notifications from it in
> SDK 53. Everything else does. Waitlist sign-ups are saved correctly; the alerts only arrive in the
> APK.

### 3. Build the APK (optional)

```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas build -p android --profile preview
```

Three things to know before building:

- **The backend URL is baked into the build.** A standalone APK has no Expo dev server, so the
  automatic detection doesn't apply: set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` in the
  `preview` profile of `eas.json` first. With a LAN IP there, the APK only works on that network.
- **Cleartext HTTP is enabled** via `expo-build-properties`, because Android 9+ blocks plain
  `http://` in release builds and the demo backend runs without TLS.
- **Push notifications need FCM V1 credentials** (a Firebase service account key uploaded to EAS).
  The CLI asks for them during the build; you can skip it and add them later with `eas credentials`.

EAS uploads what is **committed to git**, so commit before building.

When it finishes, put the artifact URL in `apps/web/.env` and the `/download` page turns into a
download button plus a QR pointing at the APK:

```bash
NEXT_PUBLIC_APK_URL=https://expo.dev/artifacts/eas/....apk
```

---

## Available scripts (repository root)

| Script | What it does |
|---|---|
| `npm run dev` | Runs web and backend in parallel (Turborepo) |
| `npm run build` | Production build |
| `npm run lint` | Lints the web app |
| `npm run db:up` / `db:down` | Starts / stops the PostgreSQL container |
| `npm run db:migrate` | Applies pending migrations to an existing database |
| `npm run db:seed` | Loads the demo catalog (idempotent) |
| `npm run db:restore` | Loads the team's catalog from `db/dump-latest.sql` |
| `npm run db:reset` | **Deletes the volume** and recreates the database from scratch. Docker replays the migrations on first boot, so afterwards you only need `db:seed` |
| `npm run db:admin -- email` | Gives the admin role to an account (or creates it) |
| `npm run mobile` | Shortcut for `expo start --android` in `apps/mobile` |

## Technical decisions

- **Relational model instead of arrays.** Order items, drop products and waitlists are join tables
  with foreign keys, so data stays consistent and queries per user are indexed.
- **Money as integers.** Prices are stored as integer pesos (`price_cents`), never floats, and are
  frozen in `order_items` at purchase time. The order total is always recalculated by the backend
  inside a transaction, so a stale price in a client's cart can never be charged.
- **Authenticity.** Product codes (`VKT-…`) live on each product; the schema also supports per-unit
  codes (`VKU-…`) for physical QR labels. Every validation is logged in `authenticity_checks`,
  including the ones that fail — that's how cloned codes get spotted.
- **Grounded AI.** Gemini only returns structured filters (text, category, price range) through
  function calling. Categories come from the database, and products, prices and stock always come
  from PostgreSQL, so the assistant cannot hallucinate items.
- **Auth for web and mobile.** 15-minute access JWT plus rotating refresh tokens stored hashed.
  Reusing an already-rotated refresh token revokes every session of that user. On mobile the tokens
  live in `expo-secure-store` and a 401 transparently refreshes and retries the request.
- **Push that doesn't duplicate.** Announcing a drop is claimed atomically through
  `drops.announced_at`, so restarting the server or re-marking it live never notifies twice; if the
  send fails entirely, the mark is released so it can be retried.
- **Versioned migrations.** `schema_migrations` records what has been applied, so the schema evolves
  without recreating the database.
- **Always-fresh pages.** Catalog, drops and stock pages render on every request, so they never show
  stale prices or stock.

## Troubleshooting

**Database**

- **`password authentication failed`** — `DATABASE_URL` must use port `5433`, not `5432`. If you
  have PostgreSQL installed natively, that's what's answering on 5432.
- **`unable to get image 'postgres:16'`** — Docker Desktop isn't running, or its engine hasn't
  started yet.
- **The catalog is empty** — you skipped `npm run db:seed` (or `db:restore`).
- **A column or table is missing after a `git pull`** — run `npm run db:migrate`.

**Web**

- **"No se pudo conectar con la API de Vokter"** — the backend isn't running, or the port in
  `NEXT_PUBLIC_API_URL` doesn't match.
- **The AI assistant returns an error** — the free Gemini key has a low daily quota per model. Wait
  for the reset or use a key with more quota. It's not a bug in the code.
- **The admin panel redirects to the home page** — the account isn't an admin yet, or the session
  predates the role change: log out and log in again.

**Mobile**

- **"Sin conexión" while the web works** — the firewall rule for port 4000 is missing (see above),
  or the phone is on a different network than the computer.
- **The catalog loads but the photos are blank** — the web isn't running, or port 3000 is blocked.
  Next.js serves the images, not the backend.
- **Push notifications never arrive** — expected in Expo Go; they need the APK with FCM credentials.
- **`eas` is not recognized as a command** — the npm global folder isn't in your PATH. Open a new
  terminal, or use `npx eas-cli@latest …` instead.

## Authors

- **Alejandro Mier** — [github.com/Cachureto](https://github.com/Cachureto)
- **Juan Villaquiran** — [github.com/pipeeex](https://github.com/pipeeex)
- **Gabriel Badillo** — [github.com/gabrielbadillo123](https://github.com/gabrielbadillo123)

## License

This project was developed for evaluation purposes as part of a technical assessment.
