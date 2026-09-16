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

**Web**
- Product catalog with category and price filters
- Product page with authenticity certificate validation
- Conversational AI search assistant (grounded strictly in real catalog data — no hallucinated products or prices)
- Drop calendar with waitlist sign-up
- Mobile app download page (direct APK link + QR code)
- JWT-based authentication

**Mobile (React Native + Expo)**
- Login/registration sharing the same backend and JWT auth as the web app
- Catalog and product detail views
- QR scanner to verify a product's authenticity in person
- Push notifications for new drops
- Purchase history and reviews

## Tech Stack

| Layer | Technology |
|---|---|
| Web | Next.js, Tailwind CSS |
| Mobile | React Native (Expo) |
| Backend | Node.js, Express, JWT |
| Database | PostgreSQL (Supabase) |
| AI | OpenAI/Anthropic API with function calling over the product database |
| Hosting | Vercel (web), Render/Railway (backend), Supabase (database) |

## Project Structure

```
.
├── web/         # Next.js storefront
├── mobile/      # React Native (Expo) app
├── backend/     # Express API, auth, and AI assistant endpoint
└── README.md
```

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, AI_API_KEY
npm run dev
```

### Web
```bash
cd web
npm install
cp .env.example .env   # set NEXT_PUBLIC_API_URL
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Download the Mobile App

The Android build is available directly from the web app's download page
(`/download`), via direct link or QR code. To generate a new build:

```bash
cd mobile
eas build -p android --profile preview
```

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
