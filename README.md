# deadinternet.report

> **Real-time dashboard tracking how much of the internet is AI-generated.**
> Bloomberg Terminal aesthetic meets Dead Internet Theory.

## What is this?

A data-driven dashboard that aggregates real research about AI-generated content, bot traffic, and synthetic media across the internet. Premium tier includes a live URL scanner powered by Claude AI.

**Data sources:** Europol, Imperva/Thales, Ahrefs, Cloudflare, Graphite, Nature Scientific Reports.

## Quick Start

```bash
git clone https://github.com/nabz0r/deadinternet.report.git
cd deadinternet.report
cp .env.example .env   # Edit with your API keys
docker compose up -d   # That's it
# Open http://localhost
```

## Architecture

```
Nginx :80 --> Next.js :3000 (frontend)
         \-> FastAPI :8000 (backend) --> PostgreSQL :5432
                                    \-> Redis :6379
                                    \-> Claude API (scanner)
                                    \-> Stripe (payments)
```

| Service  | Tech           | Purpose                        |
|----------|----------------|--------------------------------|
| Frontend | Next.js 14     | Dashboard UI, Auth, Stripe     |
| Backend  | FastAPI        | API, Scanner, Webhooks         |
| Database | PostgreSQL 16  | Users, scans, subscriptions    |
| Cache    | Redis 7        | Rate limiting, sessions, cache |
| Proxy    | Nginx          | SSL termination, routing       |
| AI       | Claude (Anthropic) | Content analysis (scanner) |
| Payments | Stripe         | Subscription management        |

## Pricing Tiers

| Feature             | Ghost (Free) | Hunter ($9/mo) | Operator ($29/mo) |
|---------------------|:---:|:---:|:---:|
| Public dashboard    | Yes | Yes | Yes |
| Global stats        | Yes | Yes | Yes |
| Historical timeline | Yes | Yes | Yes |
| Live URL scanner    | -- | 10/day | Unlimited |
| Platform alerts     | -- | Yes | Yes |
| PDF export          | -- | Yes | Yes |
| API access          | -- | -- | Yes |
| Bulk URL analysis   | -- | -- | Yes |
| Webhooks            | -- | -- | Yes |

## Key Stats (sourced)

- **51%** of internet traffic is bots (Imperva/Thales 2024)
- **74.2%** of new web pages contain AI content (Ahrefs, 900k pages)
- **50.3%** of new articles are AI-written (Graphite, 65k URLs)
- **59%** of X/Twitter accounts are bots
- **90%** synthetic content predicted by 2026 (Europol)

## Project Structure

```
docker-compose.yml       # One-command deploy
frontend/                # Next.js 14 (App Router + Tailwind)
  src/app/               # Pages (landing, dashboard, login, pricing)
  src/components/        # React components (gauge, charts, scanner)
  src/lib/               # Auth, API client, constants
  src/hooks/             # useCountUp, useExtrapolation
backend/                 # FastAPI (async Python)
  app/api/v1/            # REST endpoints
  app/models/            # SQLAlchemy (user, scan, subscription)
  app/services/          # Scanner (Claude), Stripe, Stats
  app/core/              # Config, DB, Redis, Security
nginx/                   # Reverse proxy config
scripts/                 # Data seeding
```

## Development

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Contributing

1. Fork it
2. Create a feature branch (`git checkout -b feat/thing`)
3. Commit (`git commit -m 'feat: add thing'`)
4. Push + PR

## License

MIT
