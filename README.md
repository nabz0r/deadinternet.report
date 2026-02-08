# ☠️ deadinternet.report

> **Real-time dashboard tracking how much of the internet is AI-generated.**
> Bloomberg Terminal aesthetic meets Dead Internet Theory — backed by real data.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

---

## What is this?

A data-driven dashboard that aggregates **published research** about AI-generated content, bot traffic, and synthetic media across the internet. Not speculation — sourced numbers from Europol, Imperva/Thales, Ahrefs, Cloudflare, and more.

Premium tier includes a **live URL scanner** powered by Claude AI that estimates how likely a page's content was AI-generated.

### Key findings

| Metric | Value | Source |
|--------|-------|--------|
| Bot traffic (global) | **51%** | Imperva/Thales Bad Bot Report 2024 |
| New pages with AI content | **74.2%** | Ahrefs bot_or_not study (900k pages) |
| New articles AI-written | **50.3%** | Graphite SEO study (65k URLs) |
| X/Twitter bot accounts | **~59%** | Internal estimates + Mashable |
| Projected synthetic content 2026 | **90%** | Europol |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose v2+
- API keys (see [Configuration](#configuration))

### Deploy in 3 commands

```bash
git clone https://github.com/nabz0r/deadinternet.report.git
cd deadinternet.report
cp .env.example .env   # ← Edit with your API keys
docker compose up -d
```

Open `http://localhost` — you're live.

### Verify it's running

```bash
# Backend health check
curl http://localhost/health
# → {"status":"alive","service":"deadinternet-api"}

# Stats endpoint (public)
curl http://localhost/api/v1/stats/
# → Full dataset JSON

# API docs
open http://localhost/docs
```

---

## Architecture

```
                    ┌──────────────┐
    :80/:443        │    Nginx     │
   ─────────────►   │ reverse proxy│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
     ┌────────────────┐       ┌────────────────┐
     │   Next.js 14   │       │    FastAPI     │
     │   :3000        │       │    :8000       │
     │                │       │                │
     │ • Dashboard UI │       │ • REST API     │
     │ • SSO (NextAuth│       │ • URL Scanner  │
     │ • API Proxy    │──────►│ • Stripe hooks │
     │ • Stripe UI    │ JWT   │ • Rate limiter │
     └────────────────┘       └───────┬────────┘
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                  ┌──────────┐ ┌──────────┐ ┌──────────┐
                  │PostgreSQL│ │  Redis   │ │Claude API│
                  │  :5432   │ │  :6379   │ │(Anthropic│
                  │          │ │          │ │          │
                  │ Users    │ │ Cache    │ │ Content  │
                  │ Scans    │ │ Sessions │ │ Analysis │
                  │ Subs     │ │ Limits   │ │          │
                  └──────────┘ └──────────┘ └──────────┘
```

### Tech stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js 14 (App Router) | Dashboard, auth, Stripe checkout |
| Styling | Tailwind CSS + custom theme | Bloomberg Terminal aesthetic |
| Auth | NextAuth.js v4 | Google/GitHub SSO, JWT sessions |
| Backend | FastAPI (async Python) | REST API, business logic |
| Database | PostgreSQL 16 | Users, scans, subscriptions |
| Cache | Redis 7 | Rate limiting, stats cache |
| AI Scanner | Claude API (Anthropic) | URL content analysis |
| Payments | Stripe | Subscription management |
| Proxy | Nginx | SSL, routing, rate limiting |
| Deploy | Docker Compose | One-command orchestration |

### Auth flow

NextAuth.js encrypts JWTs as JWE (A256GCM). The backend uses python-jose which can't decrypt JWE. The solution:

```
Browser → NextAuth (JWE token) → Next.js API Proxy → re-sign as HS256 JWT → FastAPI backend
```

The proxy at `/api/backend/[...path]` handles this transparently. The shared secret is `NEXTAUTH_SECRET`.

---

## Configuration

Copy `.env.example` to `.env` and fill in your values:

### Required keys

| Variable | Where to get it | Required for |
|----------|----------------|---------------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Auth (everything) |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Google login |
| `GOOGLE_CLIENT_SECRET` | Same | Google login |
| `GITHUB_ID` | [GitHub Developer Settings](https://github.com/settings/developers) | GitHub login |
| `GITHUB_SECRET` | Same | GitHub login |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/settings/keys) | URL scanner |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI or Dashboard | Webhook verification |
| `STRIPE_PRICE_HUNTER` | Stripe Products → Price ID | Hunter tier ($9/mo) |
| `STRIPE_PRICE_OPERATOR` | Stripe Products → Price ID | Operator tier ($29/mo) |

### Optional / defaults

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `deadinet` | DB username |
| `POSTGRES_PASSWORD` | `deadinet` | DB password (**change in prod**) |
| `NEXTAUTH_URL` | `http://localhost:3000` | Public frontend URL |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Public API URL (for browser) |
| `API_URL` | `http://backend:8000` | Internal API URL (Docker network) |
| `SCAN_RATE_HUNTER` | `10` | Scans/day for Hunter tier |
| `SCAN_RATE_OPERATOR` | `1000` | Scans/day for Operator tier |
| `DEBUG` | `true` | Enables `/docs` endpoint |

### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://deadinternet.report/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

### GitHub OAuth setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Authorization callback URL: `https://deadinternet.report/api/auth/callback/github`
4. Copy Client ID and Secret to `.env`

### Stripe setup

1. Create 2 products in [Stripe Dashboard](https://dashboard.stripe.com/products):
   - **Hunter** — $9/month recurring
   - **Operator** — $29/month recurring
2. Copy the Price IDs to `.env`
3. Set up webhook endpoint: `https://deadinternet.report/api/v1/webhooks/stripe`
4. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## Pricing Tiers

| Feature | Ghost (Free) | Hunter ($9/mo) | Operator ($29/mo) |
|---------|:---:|:---:|:---:|
| Public dashboard | ✅ | ✅ | ✅ |
| Global stats | ✅ | ✅ | ✅ |
| Historical timeline | ✅ | ✅ | ✅ |
| Platform breakdown | ✅ | ✅ | ✅ |
| Live URL scanner | — | 10/day | Unlimited |
| Platform alerts | — | ✅ | ✅ |
| PDF export | — | ✅ | ✅ |
| "Human Verified" badge | — | ✅ | ✅ |
| API access (token) | — | — | ✅ |
| Bulk URL analysis | — | — | ✅ |
| Webhooks | — | — | ✅ |
| Priority support | — | — | ✅ |

---

## API Reference

Full interactive docs at `/docs` (Swagger UI) when running.

### Public endpoints (no auth)

```
GET  /api/v1/stats/           → Full dataset (index, global, platforms, timeline, ticker)
GET  /api/v1/stats/platforms  → Platform breakdown (X, Reddit, LinkedIn, Web, Social)
GET  /api/v1/stats/timeline   → Historical data 2014-2026
GET  /api/v1/stats/ticker     → Ticker tape facts array
GET  /api/v1/stats/index      → Dead Internet Index score (0-1)
GET  /health                  → Health check
```

### Authenticated endpoints (Hunter+)

```
POST /api/v1/scanner/scan     → Analyze a URL {"url": "https://..."}
GET  /api/v1/scanner/usage    → Current daily scan usage
GET  /api/v1/scanner/history  → Scan history (paginated)
```

### User endpoints (auth required)

```
GET  /api/v1/users/me         → Current user profile
POST /api/v1/users/sync       → Sync user from NextAuth (internal)
POST /api/v1/users/checkout   → Create Stripe checkout session
POST /api/v1/users/portal     → Open Stripe billing portal
```

### Webhooks

```
POST /api/v1/webhooks/stripe  → Stripe webhook receiver
```

See [docs/API.md](docs/API.md) for detailed request/response examples.

---

## Project Structure

```
.
├── docker-compose.yml          # Orchestration (5 services)
├── .env.example                # All env vars documented
│
├── frontend/                   # Next.js 14
│   ├── Dockerfile              # Multi-stage build (standalone)
│   ├── package.json            # Dependencies
│   ├── next.config.js          # Standalone output, image domains
│   ├── tailwind.config.ts      # Custom "dead" color palette
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          # Root layout + SessionProvider
│       │   ├── page.tsx            # Landing page (SSR, public)
│       │   ├── login/page.tsx      # Google/GitHub SSO
│       │   ├── pricing/page.tsx    # Tier comparison
│       │   ├── dashboard/page.tsx  # Main dashboard (auth)
│       │   └── api/
│       │       ├── auth/[...nextauth]/route.ts  # NextAuth handler
│       │       └── backend/[...path]/route.ts   # API proxy (JWT re-sign)
│       ├── components/
│       │   ├── Providers.tsx            # SessionProvider wrapper
│       │   ├── layout/Header.tsx        # Navigation + user menu
│       │   └── dashboard/
│       │       ├── DeadIndexGauge.tsx    # SVG circular gauge
│       │       ├── StatCard.tsx         # Animated metric card
│       │       ├── PlatformBreakdown.tsx # Horizontal bar chart
│       │       ├── TimelineChart.tsx     # Recharts area chart
│       │       ├── LiveScanner.tsx       # URL scanner UI
│       │       └── TickerTape.tsx        # Scrolling news bar
│       ├── lib/
│       │   ├── auth.ts          # NextAuth config + callbacks
│       │   ├── api-client.ts    # API client (public + proxied)
│       │   ├── constants.ts     # Tier definitions + feature gates
│       │   └── utils.ts         # Formatting helpers
│       ├── hooks/
│       │   ├── useCountUp.ts    # Animated counter
│       │   └── useExtrapolation.ts  # Real-time counter
│       └── types/
│           └── next-auth.d.ts   # Session type augmentation
│
├── backend/                    # FastAPI (async Python)
│   ├── Dockerfile              # Python 3.12-slim
│   ├── requirements.txt        # All deps pinned
│   ├── alembic.ini             # DB migration config
│   ├── alembic/
│   │   ├── env.py              # Async migration setup
│   │   └── script.py.mako      # Migration template
│   └── app/
│       ├── main.py             # FastAPI app + lifespan
│       ├── core/
│       │   ├── config.py       # Pydantic settings (env vars)
│       │   ├── database.py     # Async SQLAlchemy engine
│       │   ├── redis.py        # Redis client wrapper
│       │   ├── security.py     # JWT decode + auth dependencies
│       │   └── rate_limiter.py  # Per-user daily scan limits
│       ├── models/
│       │   ├── user.py         # User (email, tier, stripe_id)
│       │   ├── scan.py         # Scan (url, probability, verdict)
│       │   └── subscription.py # Subscription (stripe sync)
│       ├── schemas/
│       │   ├── scan.py         # Request/response validation
│       │   └── user.py         # Profile schemas
│       ├── services/
│       │   ├── scanner_service.py  # URL fetch + Claude analysis
│       │   ├── stats_service.py    # Cached stats (Redis)
│       │   └── stripe_service.py   # Checkout + webhook handling
│       └── api/v1/
│           ├── stats.py        # Public stats endpoints
│           ├── scanner.py      # Scanner endpoints (auth)
│           ├── users.py        # User + sync + billing
│           └── webhooks.py     # Stripe webhook receiver
│
├── nginx/                      # Reverse proxy
│   ├── Dockerfile
│   ├── nginx.conf              # Routing rules + rate limiting
│   └── certs/                  # SSL certs (mount in prod)
│
└── scripts/
    └── seed_data.py            # Redis cache seeder
```

---

## Development

### Local setup (without Docker)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Need PostgreSQL + Redis running locally
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/deadinternet"
export REDIS_URL="redis://localhost:6379/0"
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp ../.env.example .env.local  # Edit with local values
npm run dev
```

### Useful commands

```bash
# Rebuild after code changes
docker compose build && docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Reset everything
docker compose down -v && docker compose up -d

# Seed Redis cache
docker compose exec backend python -m scripts.seed_data

# Create a DB migration
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose exec backend alembic upgrade head

# Access PostgreSQL
docker compose exec db psql -U deadinet -d deadinternet

# Access Redis
docker compose exec redis redis-cli
```

---

## Deployment (Production)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full VPS deployment guide with SSL, DNS, and systemd.

Quick version:

```bash
# On your VPS (Ubuntu 24)
sudo apt update && sudo apt install -y docker.io docker-compose-v2
git clone https://github.com/nabz0r/deadinternet.report.git
cd deadinternet.report
cp .env.example .env && nano .env  # Fill in production values

# Set production URLs
# NEXTAUTH_URL=https://deadinternet.report
# NEXT_PUBLIC_API_URL=https://deadinternet.report

docker compose up -d
```

---

## Contributing

1. Fork it
2. Create a feature branch (`git checkout -b feat/awesome-thing`)
3. Commit with conventional commits (`git commit -m 'feat: add awesome thing'`)
4. Push to your fork (`git push origin feat/awesome-thing`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>The internet is 67% dead. This dashboard proves it.</strong><br/>
  <a href="https://deadinternet.report">deadinternet.report</a>
</p>
