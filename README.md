<div align="center">

# 🥦 Pooja Vegetables

**Full-stack order management system for a real fruits & vegetables shop**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![CI](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/pooja-vegetables/ci.yml?style=flat-square&label=CI)](https://github.com/YOUR_USERNAME/pooja-vegetables/actions)

A monorepo with **three frontend apps** and **one backend API** serving a local vegetables shop, its B2B clients (restaurants & canteens), and local delivery customers.

[Features](#features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Roadmap](#roadmap)

</div>

---

## What is this?

Pooja Vegetables is a real-world project built for an actual shop. It manages:

- **Local customer orders** — mobile PWA, 4 km delivery radius, ₹150 minimum order
- **B2B bulk orders** — dedicated portal for restaurants and canteens with bulk pricing
- **Shop owner dashboard** — order management, daily price updates, bill generation, WhatsApp sharing

This is also a learning project focused on professional monorepo architecture, TypeScript, system design, and Git workflows.

---

## Features

**Dad's Dashboard** (`apps/dashboard`)
- Live order feed — local and B2B orders in one view
- One-click order status updates (pending → confirmed → out for delivery → delivered)
- Inline price editor — update all product prices in one table, one button
- Automatic price history logging on every update
- Professional PDF bill generation, shared directly via WhatsApp

**B2B Portal** (`apps/b2b`)
- Login for restaurants and canteens
- Bulk order placement with wholesale pricing
- Full order history with downloadable bills

**Customer PWA** (`apps/customer`)
- Installable on Android and iOS home screen
- Browser geolocation — orders outside 4 km are blocked at the API level
- ₹150 minimum order gate with clear feedback
- Order tracking and history

**Backend** (`backend`)
- JWT authentication with separate flows for admin, B2B, and customers
- Geo-fence and minimum order enforced as **middleware** — never trusted from the frontend
- `priceAtOrder` frozen on every order item at creation time
- `price_history` collection auto-written on every bulk price update
- Payments collection schema ready for Razorpay integration

---

## Architecture

```
pooja-vegetables/              ← npm workspaces monorepo
├── apps/
│   ├── dashboard/             ← Vite + React + TypeScript     (Dad's tool)
│   ├── b2b/                   ← Next.js 15 + TypeScript        (Restaurants & canteens)
│   └── customer/              ← Vite + React + TypeScript PWA  (Local customers)
├── backend/                   ← Express + TypeScript           (Railway)
└── packages/
    └── types/                 ← Shared TypeScript interfaces   (imported by all 4)
```

### Why this stack?

| Decision | Reason |
|---|---|
| **Monorepo** | Shared types across all apps — one interface change breaks everywhere simultaneously |
| **TypeScript everywhere** | `priceAtOrder`, dual pricing, three user roles — too many places to pass the wrong shape silently |
| **Next.js for B2B only** | SSR benefits the B2B portal; dashboard and customer app are internal/mobile-first SPAs |
| **Vite PWA for customer app** | `vite-plugin-pwa` makes service worker setup trivial; products cached for offline browsing |
| **Railway over Render** | No cold starts — real clients can't wait 30 seconds for the first request |
| **MongoDB** | Document-shaped orders with nested items; ACID transactions available for future payments |

### Key design decisions

- **`priceAtOrder` is frozen** — stored on the order item at creation time. Tomorrow's price change never affects yesterday's bill.
- **`price_history` is automatic** — every `PUT /api/products/bulk-price-update` call writes a snapshot. Your dad can always answer "what was the tomato price last Tuesday?"
- **Business rules live in backend middleware** — geo-fence and minimum order are never trusted from the frontend. A user can't bypass them by editing the request in DevTools.
- **Denormalized `clientName` and `clientPhone`** on orders — bills are always accurate even if a client later updates their profile.

### MongoDB collections

| Collection | Purpose |
|---|---|
| `users` | Local customers |
| `b2b_clients` | Restaurants and canteens (with hashed passwords) |
| `products` | Inventory with dual `priceRetail` + `priceBulk` |
| `orders` | All orders — `clientType: "local" \| "b2b"` distinguishes them |
| `price_history` | Immutable daily price snapshots — auto-written, never manual |
| `payments` | Schema ready, populated when Razorpay is integrated |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier)
- [Railway](https://railway.app) account (free $5/month credit)
- [Cloudinary](https://cloudinary.com) account (free tier — for bill PDFs)
- [Vercel](https://vercel.com) account (free tier — for frontends)

### Local setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/pooja-vegetables.git
cd pooja-vegetables

# 2. Install all workspace dependencies at once
npm install

# 3. Build shared types — must run before anything else
npm run types:build

# 4. Configure environment variables
cp backend/.env.example backend/.env
# Open backend/.env and fill in your MongoDB URI, JWT secret, Cloudinary keys
```

### Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/pooja-vegetables

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_random_string
JWT_EXPIRES_IN=7d

# Cloudinary (for bill PDFs)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Business rules — set to your actual shop coordinates
SHOP_LAT=18.5204
SHOP_LNG=73.8567
MAX_DELIVERY_KM=4
MIN_ORDER_AMOUNT=150
```

### Run in development

```bash
# Run all 4 apps simultaneously
npm run dev

# Or run individually
npm run dev:backend     # http://localhost:5000
npm run dev:dashboard   # http://localhost:5173
npm run dev:b2b         # http://localhost:5174
npm run dev:customer    # http://localhost:5175
```

---

## API Reference

All endpoints return `{ success: true, data: ... }` or `{ success: false, error: "...", code: "..." }`.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/b2b/login` | Public | Restaurant / canteen login |
| `POST` | `/api/auth/customer/register` | Public | Register a new local customer |
| `POST` | `/api/auth/customer/login` | Public | Local customer login by phone |

### Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | All available products (includes both prices) |
| `POST` | `/api/products` | Admin | Add a new product |
| `PUT` | `/api/products/bulk-price-update` | Admin | Update prices for multiple products — **auto-logs price_history** |
| `GET` | `/api/products/price-history/:id` | Admin | Price history for a specific product |

### Orders

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders/local` | Customer | Place a local order — geo-fence + ₹150 min enforced |
| `POST` | `/api/orders/b2b` | B2B | Place a bulk order — no geo or min-order restriction |
| `GET` | `/api/orders` | Admin | All orders — filter by `?clientType=local\|b2b&status=pending` |
| `GET` | `/api/orders/my` | Customer / B2B | Caller's own order history |
| `PATCH` | `/api/orders/:id/status` | Admin | Update order status |

### Dashboard

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Admin | Today's orders, revenue, pending count |

### Bills

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bills/generate/:orderId` | Admin | Generate PDF bill, upload to Cloudinary, return WhatsApp link |

### Error codes

| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | No token or expired token |
| `FORBIDDEN` | Valid token but wrong role |
| `GEO_OUT_OF_RANGE` | Customer is outside the 4 km delivery radius |
| `MIN_ORDER_NOT_MET` | Order total is below ₹150 |
| `LOCATION_MISSING` | Local order submitted without coordinates |

---

## Git Workflow

```
main          ← production — only merge from develop
└── develop   ← integration branch — merge features here first

feature/dad-dashboard
feature/b2b-auth
feature/customer-pwa
feature/pdf-bill-generation
feature/geo-validation
hotfix/fix-order-total
```

### Day-to-day

```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Commit with clear messages (conventional commits)
git commit -m "feat: add bulk price update endpoint with history logging"
git commit -m "fix: correct haversine formula for edge coordinates"
git commit -m "chore: update mongoose to 8.4.0"

# Push and open a PR into develop — never directly into main
git push origin feature/your-feature-name
```

### Commit message format

```
feat:     new feature
fix:      bug fix
chore:    dependency update, config change
docs:     documentation only
refactor: restructure without behaviour change
test:     add or update tests
```

---

## Roadmap

- [x] Phase 1 — Monorepo scaffold, shared types, backend structure, all middleware
- [ ] Phase 2 — Owner's dashboard (orders list, price editor, stat cards)
- [ ] Phase 3 — PDF bill generation + Cloudinary upload + WhatsApp sharing
- [ ] Phase 4 — B2B portal (login, bulk order form, order history)
- [ ] Phase 5 — Customer PWA (geolocation, cart, order tracking)
- [ ] Phase 6 — Payments (Razorpay integration using existing `payments` collection)

---

## Project context

This is a real-world freelancing project with real clients and real daily users. It was built to learn:

- Professional monorepo architecture with npm workspaces
- TypeScript across a full-stack codebase with shared types
- System design — separating mutable state from immutable history
- Git branching strategy used in professional teams
- Deploying a production Node.js app (Railway) and multiple React apps (Vercel)

---

<div align="center">

Built by [Ram](https://personal-portfolio-ten-psi-52.vercel.app/) · Pune, India

</div>
