# Contributing to deadinternet.report

Thanks for your interest! Here's how to contribute.

## Development Setup

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/deadinternet.report.git`
3. Set up locally:

```bash
cd deadinternet.report
cp .env.example .env  # Fill in at minimum: NEXTAUTH_SECRET, POSTGRES_*
docker compose up -d db redis  # Just infra

# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

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
- Improve mobile responsive design
- Add dark/light theme toggle
- Add PDF export for scan results
- Improve error messages and loading states

### Architecture improvements
- Add rate limiting per-IP in addition to per-user
- Implement WebSocket for real-time stats updates
- Add Prometheus metrics endpoint
- Implement scan result caching (same URL within 24h)

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test locally with `docker compose up -d`
4. Push and open a PR
5. Describe what you changed and why

## Data Integrity

All statistics in this project must be sourced from published research. When adding or updating data:

- Include the source name and date
- Link to the original report or study
- Use the most recent available data
- Never fabricate or extrapolate without marking as "projected"

## Code Style

- **Python:** Follow PEP 8, use type hints, async/await
- **TypeScript:** Strict mode, prefer `const`, named exports for components
- **CSS:** Tailwind utility classes, use the custom `dead-*` palette

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
