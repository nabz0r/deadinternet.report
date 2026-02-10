# ☠️ deadinternet.report

> **Real-time dashboard tracking how much of the internet is AI-generated.**
> Bloomberg Terminal aesthetic meets Dead Internet Theory — backed by real data.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF.svg)](.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/Tests-42_passing-brightgreen.svg)](backend/tests/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Security](https://img.shields.io/badge/Security_Audit-35_issues_found-red.svg)](docs/Security.md)
[![Critical Fixes](https://img.shields.io/badge/Critical_Fixes-7%2F7_✅-brightgreen.svg)](docs/Security.md)

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

### Deploy in 4 commands

```bash
git clone https://github.com/nabz0r/deadinternet.report.git
cd deadinternet.report
cp .env.example .env   # ← Edit with your API keys
# Generate required secrets:
export JWT_SECRET=$(openssl rand -hex 32)
export INTERNAL_API_SECRET=$(openssl rand -hex 32)
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
docker compose up -d
```

Open `http://localhost` — you're live.

---

## Architecture

Full architecture documentation with Mermaid diagrams: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

```mermaid
graph TB
    Browser["🌐 Browser"] -->|HTTPS| Nginx["Nginx :80/:443"]
    Nginx -->|/| Next["Next.js 14 :3000"]
    Nginx -->|/api/v1| FastAPI["FastAPI :8000"]

    Next -->|Re-signed HS256 JWT| FastAPI
    Next -->|OAuth 2.0| OAuth["Google / GitHub"]

    FastAPI --> Scanner["URL Scanner"]
    FastAPI --> Stripe["Stripe Service"]
    Scanner -->|Analyze| Claude["Claude API"]

    FastAPI --> PG[("PostgreSQL")]
    FastAPI --> Redis[("Redis")]
```

### Auth flow

NextAuth.js encrypts JWTs as JWE (A256GCM). The backend uses python-jose which can't decrypt JWE. The solution:

```
Browser → NextAuth (JWE token) → Next.js API Proxy → re-sign as HS256 JWT → FastAPI backend
```

The proxy at `/api/backend/[...path]` handles this transparently. The shared secret is `JWT_SECRET` (not NEXTAUTH_SECRET — they are separate keys since the security audit fix).

### Tech stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js 14 (App Router) | Dashboard, auth, Stripe checkout |
| Styling | Tailwind CSS + custom theme | Bloomberg Terminal aesthetic |
| Auth | NextAuth.js v4 | Google/GitHub SSO, JWT sessions |
| Backend | FastAPI (async Python) | REST API, business logic |
| Database | PostgreSQL 16 | Users, scans, subscriptions |
| Cache | Redis 7 | Rate limiting, stats cache, scan result cache |
| AI Scanner | Claude API (Anthropic) | URL content analysis |
| Payments | Stripe | Subscription management |
| Proxy | Nginx | TLS termination, routing, rate limiting |
| CI/CD | GitHub Actions | Lint, test, build on every push |
| Deploy | Docker Compose | One-command orchestration |

---

## Testing

The backend has a comprehensive test suite (42 tests) covering security, API, rate limiting, and scanner logic. Tests use async SQLite and FakeRedis — no external services required.

```bash
cd backend
pip install -r requirements-test.txt
JWT_SECRET=test-secret INTERNAL_API_SECRET=test-secret python -m pytest tests/ -v
```

### What's tested

| Suite | Tests | Covers |
|-------|-------|--------|
| `test_security.py` | 10 | JWT auth, tier enforcement, token edge cases, health check |
| `test_scanner_service.py` | 24 | SSRF protection (IP ranges, DNS), prompt injection filtering |
| `test_stats_api.py` | 5 | Public stats endpoints, Redis caching |
| `test_rate_limiter.py` | 5 | Per-tier scan limits, ghost tier blocking |

### CI/CD

GitHub Actions runs on every push (`.github/workflows/ci.yml`):
1. **Backend** — lint with ruff, run full pytest suite
2. **Frontend** — lint with ESLint, production build
3. **Docker** — verify docker compose builds cleanly

---

## Security

A comprehensive security audit was performed on Feb 8, 2026 — see **[docs/Security.md](docs/Security.md)**.

**All 7 critical vulnerabilities have been fixed:**

| # | Vulnerability | Status |
|---|---------------|--------|
| C1 | `/users/sync` publicly accessible | ✅ X-Internal-Secret header |
| C2 | JWT secret hardcoded to "change-me" | ✅ Startup validation, crashes if weak |
| C3 | SSRF in URL scanner | ✅ IP blocklist + DNS resolution check |
| C4 | Prompt injection via web content | ✅ Content sanitization + explicit instruction |
| C5 | No error handling on Claude JSON | ✅ try/except + validation + fallback |
| C6 | Missing security headers | ✅ CSP, HSTS, X-Frame-Options, etc. |
| C7 | Weak JWT validation | ✅ require_sub, require_exp, claim validation |

Additionally fixed: proxy path whitelist (E4), CSP headers (E5), JWT_SECRET separation (E10).

### Additional hardening

- **CSP** — `unsafe-eval` removed from Content-Security-Policy; `X-Powered-By` header disabled
- **Nginx** — HTTPS redirect, TLS 1.2+, security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- **Docker Compose** — Redis password authentication enabled
- **IP rate limiting** — 60 req/min per IP at application level (configurable via `IP_RATE_LIMIT` / `IP_RATE_WINDOW`)
- **Stripe idempotency** — checkout sessions use idempotency keys; webhooks deduplicated via Redis (48h TTL)
- **Webhook error handling** — internal errors logged, never exposed to Stripe

---

## Database

### Models

| Table | Key fields | Constraints |
|-------|-----------|-------------|
| `users` | email (unique), tier, stripe_customer_id | `CHECK tier IN (ghost, hunter, operator)` |
| `scans` | user_id (FK CASCADE), url, ai_probability, verdict | `CHECK verdict IN (human, mixed, ai_generated)`, `CHECK ai_probability 0.0-1.0` |
| `subscriptions` | user_id (FK CASCADE, unique), stripe_subscription_id, status, tier | `CHECK status IN (active, canceled, past_due, trialing, incomplete, incomplete_expired)` |

### Indexes

- `users.email` (unique), `users.stripe_customer_id`
- `scans.user_id`, `scans.url`, `scans(user_id, created_at)` composite for history queries
- `subscriptions.user_id` (unique), `subscriptions.stripe_subscription_id` (unique), `subscriptions.stripe_price_id`

### Connection pool

- `pool_size=20`, `max_overflow=10`
- `pool_pre_ping=True` — detects stale connections before use
- `pool_recycle=3600` — recycles connections after 1 hour

### Cascade behavior

Deleting a user automatically deletes all associated scans and subscription records, both at the ORM level (`cascade="all, delete-orphan"`) and at the database level (`ON DELETE CASCADE`).

### Migrations

Alembic manages schema migrations. The initial migration (`001_initial_schema`) is included.

```bash
# Apply migrations
docker compose exec backend alembic upgrade head

# Create a new migration after model changes
docker compose exec backend alembic revision --autogenerate -m "description"
```

---

## Configuration

Copy `.env.example` to `.env` and fill in your values.

### Required secrets (generate these!)

```bash
# These are MANDATORY — the app will crash without them
JWT_SECRET=$(openssl rand -hex 32)              # Backend JWT signing
INTERNAL_API_SECRET=$(openssl rand -hex 32)     # Frontend <-> Backend internal auth
NEXTAUTH_SECRET=$(openssl rand -base64 32)      # NextAuth session encryption
```

### Required API keys

| Variable | Where to get it | Required for |
|----------|----------------|---------------|
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Google login |
| `GOOGLE_CLIENT_SECRET` | Same | Google login |
| `GITHUB_CLIENT_ID` | [GitHub Developer Settings](https://github.com/settings/developers) | GitHub login |
| `GITHUB_CLIENT_SECRET` | Same | GitHub login |
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
| `REDIS_PASSWORD` | `changeme` | Redis password (**change in prod**) |
| `NEXTAUTH_URL` | `http://localhost:3000` | Public frontend URL |
| `DEBUG` | `false` | Enables `/docs` and `/redoc` endpoints |
| `IP_RATE_LIMIT` | `60` | Max requests per IP per window |
| `IP_RATE_WINDOW` | `60` | Rate limit window in seconds |
| `SCAN_CACHE_TTL` | `86400` | Scan result cache duration (seconds) |
| `STATS_CACHE_TTL` | `3600` | Dashboard stats cache duration (seconds) |

---

## Pricing Tiers

| Feature | Ghost (Free) | Hunter ($9/mo) | Operator ($29/mo) |
|---------|:---:|:---:|:---:|
| Public dashboard | ✅ | ✅ | ✅ |
| Global stats | ✅ | ✅ | ✅ |
| Historical timeline | ✅ | ✅ | ✅ |
| Live URL scanner | — | 10/day | Unlimited |
| Scan history | — | ✅ | ✅ |
| API access (token) | — | — | ✅ |
| Bulk URL analysis | — | — | ✅ |
| Priority support | — | — | ✅ |

---

## API Reference

Full docs: **[docs/API.md](docs/API.md)** | Interactive: `/docs` (when DEBUG=true)

### Public endpoints
```
GET  /api/v1/stats/           → Full dataset
GET  /api/v1/stats/platforms  → Platform breakdown
GET  /api/v1/stats/timeline   → Historical data 2014-2026
GET  /api/v1/stats/ticker     → Ticker tape facts
GET  /api/v1/stats/index      → Dead Internet Index
GET  /health                  → Deep health check (DB + Redis)
```

### Authenticated (Hunter+)
```
POST /api/v1/scanner/scan     → Analyze a URL
GET  /api/v1/scanner/usage    → Daily scan usage
GET  /api/v1/scanner/history  → Scan history (paginated, validated)
```

### User management
```
GET  /api/v1/users/me         → Profile
POST /api/v1/users/sync       → Internal: sync from NextAuth
POST /api/v1/users/checkout   → Stripe checkout (idempotent)
POST /api/v1/users/portal     → Billing portal
```

### Health check

`GET /health` verifies database and Redis connectivity. Returns `200` when healthy, `503` when degraded:

```json
{
  "service": "deadinternet-api",
  "database": "ok",
  "redis": "ok",
  "status": "healthy"
}
```

---

## Project Structure

```
.
├── docker-compose.yml
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml              # ← CI: lint, test, build, docker
├── docs/
│   ├── ARCHITECTURE.md         # ← Mermaid diagrams, flow charts
│   ├── Security.md             # ← Audit report + fix status
│   ├── API.md                  # ← Endpoint documentation
│   └── DEPLOYMENT.md           # ← VPS deployment guide
│
├── frontend/                   # Next.js 14
│   └── src/
│       ├── app/
│       │   ├── page.tsx            # Landing (SSR)
│       │   ├── login/              # Google/GitHub SSO
│       │   ├── pricing/            # Tier comparison + SEO metadata
│       │   ├── dashboard/          # Main dashboard (lazy-loaded)
│       │   │   ├── history/        # Scan history (Hunter+)
│       │   │   └── success/        # Post-checkout
│       │   └── api/
│       │       ├── auth/           # NextAuth handler
│       │       └── backend/        # API proxy (JWT re-sign)
│       ├── components/
│       │   ├── layout/             # Header, Footer, MobileNav
│       │   ├── dashboard/          # Gauge, Charts, Scanner, etc.
│       │   ├── landing/            # HeroCounter, LivePulse
│       │   └── ui/                 # Toast, Skeleton, ErrorBoundary
│       ├── lib/
│       │   ├── auth.ts             # NextAuth config
│       │   ├── api-client.ts       # Type-safe API client
│       │   └── constants.ts        # Tier definitions
│       └── types/
│           ├── api.ts              # API response type definitions
│           └── next-auth.d.ts      # NextAuth type augmentation
│
├── backend/                    # FastAPI
│   ├── tests/                  # pytest test suite (42 tests)
│   │   ├── conftest.py             # Async fixtures, FakeRedis
│   │   ├── test_security.py        # JWT, auth, tier enforcement
│   │   ├── test_scanner_service.py # SSRF, prompt injection
│   │   ├── test_stats_api.py       # Stats endpoints
│   │   └── test_rate_limiter.py    # Scan rate limits
│   ├── alembic/
│   │   └── versions/
│   │       └── 001_initial_schema.py  # ← Initial migration
│   └── app/
│       ├── core/
│       │   ├── config.py           # Settings + secret validation
│       │   ├── security.py         # JWT decode + auth
│       │   ├── database.py         # Async SQLAlchemy + pool config
│       │   ├── redis.py            # Redis client wrapper
│       │   └── rate_limiter.py     # Per-user scan limits
│       ├── middleware/
│       │   └── ip_rate_limit.py    # IP-based rate limiting
│       ├── services/
│       │   ├── scanner_service.py  # SSRF protection + Claude + caching
│       │   ├── stats_service.py    # Cached stats from research
│       │   └── stripe_service.py   # Checkout + idempotent webhooks
│       └── api/v1/
│           ├── stats.py            # Public endpoints
│           ├── scanner.py          # Auth + rate limited + validated
│           ├── users.py            # Sync + billing
│           └── webhooks.py         # Stripe receiver (deduped)
│
├── nginx/                      # Reverse proxy (HTTPS + security headers)
└── scripts/                    # Utilities
```

---

## Development

```bash
# Full stack with Docker
docker compose up -d
docker compose logs -f

# Rebuild after changes
docker compose build && docker compose up -d

# Reset everything
docker compose down -v && docker compose up -d

# Run backend tests locally
cd backend
pip install -r requirements-test.txt
JWT_SECRET=test-secret INTERNAL_API_SECRET=test-secret python -m pytest tests/ -v

# DB migrations
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "description"
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture diagrams, auth flow, data model, component tree |
| [docs/Security.md](docs/Security.md) | Security audit report, vulnerability status, remediation timeline |
| [docs/API.md](docs/API.md) | API endpoint reference with examples |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide (VPS, SSL, DNS) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>The internet is 67% dead. This dashboard proves it.</strong><br/>
  <a href="https://deadinternet.report">deadinternet.report</a>
</p>
