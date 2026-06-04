# Pooja Vegetables 🥦

Full-stack order management system for Pooja Vegetables shop.
Three apps, one backend, one shared types package.

## Apps

| App | Stack | Port | Deploy |
|---|---|---|---|
| `apps/dashboard` | Vite + React + TS | 5173 | Vercel |
| `apps/b2b` | Next.js 15 + TS | 5174 | Vercel |
| `apps/customer` | Vite + React + TS + PWA | 5175 | Vercel |
| `backend` | Express + TS | 5000 | Railway |

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Atlas account (free tier)
- Railway account (free)
- Cloudinary account (free tier)

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/pooja-vegetables.git
cd pooja-vegetables

# 2. Install all dependencies (installs for all workspaces at once)
npm install

# 3. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values

# 4. Build shared types first (other packages depend on this)
npm run types:build

# 5. Run everything in development
npm run dev
```

## Develop a single app

```bash
npm run dev:backend    # Backend only
npm run dev:dashboard  # Dad's dashboard only
npm run dev:b2b        # B2B portal only
npm run dev:customer   # Customer PWA only
```

## Git workflow

```
main          ← production, always deployable
└── develop   ← integration branch

Feature branch naming:
  feature/dad-dashboard
  feature/b2b-auth
  feature/customer-pwa
  feature/pdf-bill-generation
  feature/geo-validation
  hotfix/fix-order-total
```

### Day-to-day workflow

```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Work, commit often with clear messages
git add .
git commit -m "feat: add bulk price update endpoint"

# Push and open a PR into develop
git push origin feature/your-feature-name
# Open PR on GitHub → merge into develop → test → merge develop into main
```

### Commit message format

```
feat: add geo-fence middleware
fix: correct priceAtOrder calculation
chore: update dependencies
docs: add API route documentation
refactor: extract bill PDF into utility function
```

## Build phases

- **Phase 1** — Backend + Auth ✅ (scaffold done)
- **Phase 2** — Dad's Dashboard (orders list, status updates, price editor)
- **Phase 3** — Bill PDF generation + WhatsApp sharing
- **Phase 4** — B2B Portal (login, bulk order, history)
- **Phase 5** — Customer PWA (geolocation, cart, order tracking)
- **Phase 6** — Payments (Razorpay integration)

## Key design decisions

- `priceAtOrder` on every `OrderItem` — price is **frozen at order time**
- `price_history` collection — auto-written on every bulk price update
- Geo-fence and min-order checks are **backend middleware** — never trusted from frontend
- Shared `@pooja-vegetables/types` package — TypeScript interfaces used by all 4 apps
- `clientName` and `clientPhone` are **denormalized** on orders — bills work even if client data changes
