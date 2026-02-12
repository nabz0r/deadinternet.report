# Contributing to deadinternet.report

Thanks for your interest! Here's how to contribute.

## Development Setup

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/deadinternet.report.git`
3. Set up locally:

```bash
cd deadinternet.report
cp .env.example .env
# Fill in at minimum: JWT_SECRET, INTERNAL_API_SECRET, NEXTAUTH_SECRET, POSTGRES_PASSWORD

# Start infrastructure
docker compose up -d db redis

# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-test.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

### Running Tests

```bash
cd backend
pytest -v                    # All tests
pytest tests/test_stats.py   # Single file
pytest -k "test_scan"        # By pattern
```

Tests use async SQLite + FakeRedis — no external services needed.

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: documentation changes
style: formatting, no code change
refactor: code restructuring
test: add or update tests
chore: maintenance tasks
```

## What We're Looking For

### High priority
- **New data sources** — If you find published research about AI content or bot traffic, open an issue or PR
- **Scanner accuracy** — Improvements to the Claude prompt or analysis pipeline
- **Internationalization** — Translations for the dashboard
- **Tests** — pytest for backend, vitest/jest for frontend

### Good first issues
- Add a new platform to the breakdown (TikTok, YouTube, etc.) with sourced data
- Add PDF export for scan results
- Improve error messages and loading states
- Add dark/light theme toggle

### Architecture improvements
- Implement WebSocket for real-time stats updates
- Add Prometheus metrics endpoint
- Add export formats (CSV, JSON) for scan history
- Improve mobile responsive design

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # Route handlers (stats, scanner, users, webhooks)
│   ├── core/            # Config, database, security, rate limiting, Redis
│   ├── middleware/       # IP rate limiting, request logging
│   ├── models/          # SQLAlchemy models (User, Scan, Subscription, ApiToken, aggregation)
│   ├── schemas/         # Pydantic request/response schemas
│   └── services/        # Scanner, Stripe, stats aggregation
├── alembic/versions/    # Database migrations
└── tests/               # pytest async test suite

frontend/
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components (layout, dashboard, scanner)
│   ├── lib/             # API client, auth utilities
│   └── types/           # TypeScript interfaces
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `pytest -v` and fix any failures
4. Test locally with `docker compose up -d`
5. Push and open a PR
6. Describe what you changed and why

## Data Integrity

All statistics in this project must be sourced from published research. When adding or updating data:

- Include the source name and date
- Link to the original report or study
- Use the most recent available data
- Never fabricate or extrapolate without marking as "projected"

## Code Style

- **Python:** Follow PEP 8, use type hints, async/await for all DB and I/O operations
- **TypeScript:** Strict mode, prefer `const`, named exports for components
- **CSS:** Tailwind utility classes, use the custom `dead-*` palette
- **Schemas:** Pydantic v2 `model_validate` / `model_dump`, not v1 `.from_orm()`

## Key Patterns

- **Auth:** JWT tokens from NextAuth, verified in FastAPI. API tokens (SHA-256 hashed) for Operator tier.
- **DB sessions:** Use `get_db` dependency (auto-commit/rollback). Use `get_db_direct()` context manager outside routes.
- **Redis:** Patch `redis_client` in both `app.core.redis` and `app.services.stats_service` for tests.
- **Rate limits:** Per-user daily limits via Redis. Per-IP limits via middleware.
- **Caching:** Scan results cached 24h. Stats cached 1h. Both configurable via env vars.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
