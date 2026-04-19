# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sunu Shop — MERN stack e-commerce platform for tech products (computers, electronics, home appliances, mobile phones, accessories, gaming) and repair/installation services targeting the West African market (Senegal, Mali, Guinea). Services are handled via WhatsApp/phone (no online booking system). Primary language: French. Primary currency: FCFA (XOF).

## Architecture

Monorepo with three packages:
- **client/** — React 18 + TypeScript + Vite + Tailwind CSS + Redux Toolkit
- **server/** — Node.js 20 + Express 4 + TypeScript + Mongoose 8
- **shared/** — Shared TypeScript types and constants (api.types, product.types, order.types, roles, orderStatus)

### Frontend (client/)
- State: Redux Toolkit (slices in `src/features/` — auth, cart, wishlist)
- Routing: React Router v6, French URL paths (`/boutique`, `/produit/:slug`, `/mon-compte`, `/commande`, `/favoris`, `/connexion`, `/services`, `/services/:slug`)
- Admin routes under `/admin/*` protected by `AdminRoute` component
- API calls via Axios instance in `src/services/api.ts` with JWT interceptor and auto-refresh
- Styling: Tailwind with custom theme — primary: #0EA5E9 (blue), secondary: #1E293B (dark gray), accent: #F97316 (orange), background: #F8FAFC
- Fonts: Inter (headings and body), DM Sans (prices)

### Backend (server/)
- All routes mounted at `/api/v1/` prefix
- Auth: JWT double-token strategy (15min access + 7d refresh HttpOnly cookie)
- Roles: client, admin, superadmin
- File uploads: Multer → Cloudinary
- Email: Nodemailer with HTML templates
- Pattern: routes → controllers → services, with asyncHandler wrapper and ApiError/ApiResponse classes

## Commands

```bash
# Install all dependencies (root + client + server)
npm run install:all

# Run both client and server in development
npm run dev

# Run only client (Vite dev server, port 5173)
npm run dev:client

# Run only server (nodemon, port 5000)
npm run dev:server

# Build everything
npm run build

# Seed database with tech categories, products, services, users
npm run seed

# Lint
npm run lint
```

## Key Conventions

- All API responses use `ApiResponse` wrapper: `{ success, message, data }`
- Prices stored as integers in FCFA (XOF), formatted with `formatPrice()` utility
- Product URLs use slugs (auto-generated from name via `slugify` utility)
- Order numbers auto-generated as `ORD-YYYYMMDD-XXXX`
- Cart and wishlist persisted to localStorage via Redux middleware
- Free shipping threshold: 25,000 FCFA
- Password hashing: bcryptjs with 12 salt rounds
- Rate limiting: 100 req/15min general, 5 req/15min for auth endpoints
- WhatsApp number constant: `WHATSAPP_NUMBER` in `client/src/utils/constants.ts`

## Database Models

8 Mongoose models in `server/src/models/`: User, Product, Category, Order, Review, Coupon, Payment, Service. All have composite indexes optimized for filtering/sorting. Category supports hierarchical parent-child structure.

## Tech Categories

| Slug | Name |
|------|------|
| informatique | Informatique |
| telephones | Téléphonie Mobile |
| electronique | Électronique & TV |
| electromenager | Électroménager |
| accessoires | Accessoires & Câbles |
| gaming | Gaming |

## Services

Services are NOT bookable online — they are contact-only via WhatsApp/phone. The Service model has: title, slug, description, shortDescription, category, startingPrice, estimatedDuration, image, isAvailable, features[], whatsappMessage.

API routes: `GET /api/v1/services`, `GET /api/v1/services/slug/:slug`, admin CRUD.

## Environment

Copy `.env.example` to `.env` and fill in: MongoDB URI, JWT secrets, Cloudinary credentials, Stripe/OrangeMoney/Wave keys, SMTP config.
