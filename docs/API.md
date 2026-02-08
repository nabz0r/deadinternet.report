# API Reference

> Base URL: `https://deadinternet.report/api/v1`
>
> Interactive docs: `https://deadinternet.report/docs` (Swagger UI)

---

## Authentication

Public endpoints require no authentication. Protected endpoints require a Bearer JWT token in the `Authorization` header.

In the browser, authentication is handled automatically through the Next.js API proxy (`/api/backend/...`), which extracts the NextAuth session and re-signs it as an HS256 JWT.

For direct API access (Operator tier), use the token from your profile:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://deadinternet.report/api/v1/scanner/scan \
  -d '{"url": "https://example.com"}'
```

---

## Public Endpoints

### GET /stats/

Full dataset including all metrics.

**Response:**
```json
{
  "dead_internet_index": 0.67,
  "last_updated": "2026-02-08",
  "global": {
    "bot_traffic_pct": 51.0,
    "ai_content_new_pages_pct": 74.2,
    "ai_articles_pct": 50.3,
    "source_bot_traffic": "Imperva/Thales Bad Bot Report 2024",
    "source_ai_pages": "Ahrefs bot_or_not study, 900k pages, April 2025",
    "source_ai_articles": "Graphite SEO study, 65k URLs, 2020-2025"
  },
  "platforms": { ... },
  "timeline": [ ... ],
  "ticker_facts": [ ... ]
}
```

### GET /stats/platforms

Platform-specific bot and AI percentages.

**Response:**
```json
{
  "x_twitter": {
    "bot_pct": 59.0,
    "label": "X / Twitter",
    "source": "X internal estimates + Mashable Super Bowl analysis",
    "trend": "up"
  },
  "reddit": {
    "bot_pct": 28.0,
    "label": "Reddit",
    "source": "Stanford Internet Observatory estimates",
    "trend": "up"
  },
  "linkedin": { ... },
  "web_general": { ... },
  "social_media": { ... }
}
```

### GET /stats/timeline

Historical data points for charting (2014-2026).

**Response:**
```json
[
  { "year": 2014, "bot_pct": 59.1, "ai_content_pct": 0.0 },
  { "year": 2023, "bot_pct": 49.6, "ai_content_pct": 15.0 },
  { "year": 2025, "bot_pct": 53.5, "ai_content_pct": 74.2 },
  { "year": 2026, "bot_pct": 56.0, "ai_content_pct": 82.0, "projected": true }
]
```

### GET /stats/ticker

Array of facts for the scrolling ticker.

**Response:**
```json
[
  "75.85% of Super Bowl LVIII Twitter traffic was bots - Mashable",
  "OpenAI GPT bots now make up 13% of total web traffic",
  ...
]
```

### GET /stats/index

The Dead Internet Index composite score.

**Response:**
```json
{
  "index": 0.67,
  "last_updated": "2026-02-08"
}
```

### GET /health

Health check for monitoring.

**Response:**
```json
{
  "status": "alive",
  "service": "deadinternet-api"
}
```

---

## Scanner Endpoints (Hunter+ required)

### POST /scanner/scan

Analyze a URL for AI-generated content using Claude AI.

**Request:**
```json
{
  "url": "https://example.com/blog/some-article"
}
```

**Response:**
```json
{
  "result": {
    "id": "a1b2c3d4-...",
    "url": "https://example.com/blog/some-article",
    "ai_probability": 0.78,
    "verdict": "ai_generated",
    "analysis": "High AI probability detected. The article uses generic transitional phrases, lacks personal anecdotes, and follows a formulaic listicle structure typical of LLM output.",
    "content_snippet": "In today's rapidly evolving digital landscape...",
    "model_used": "claude-sonnet-4-5-20250929",
    "scan_duration_ms": 3420,
    "created_at": "2026-02-08T15:30:00Z"
  },
  "usage": {
    "used": 3,
    "limit": 10,
    "remaining": 7
  }
}
```

**Verdicts:** `human` (< 0.3), `mixed` (0.3 - 0.6), `ai_generated` (> 0.6)

**Errors:**
- `403` — Requires Hunter tier or above
- `429` — Daily scan limit reached
- `502` — URL fetch or Claude API failure

### GET /scanner/usage

Current daily scan usage.

**Response:**
```json
{
  "used": 3,
  "limit": 10,
  "remaining": 7
}
```

### GET /scanner/history?limit=20&offset=0

Paginated scan history.

**Response:**
```json
{
  "scans": [ ... ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

---

## User Endpoints (auth required)

### GET /users/me

Current user profile.

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "image": "https://avatars...",
  "tier": "hunter",
  "created_at": "2026-01-15T10:00:00Z"
}
```

### POST /users/sync

Sync user from NextAuth on login. Called internally by the NextAuth JWT callback.

**Request:**
```json
{
  "id": "nextauth-user-id",
  "email": "user@example.com",
  "name": "User Name",
  "image": "https://avatars..."
}
```

**Response:**
```json
{
  "id": "user-uuid",
  "tier": "ghost",
  "synced": true,
  "created": true
}
```

### POST /users/checkout?price_id=price_xxx

Create a Stripe Checkout session.

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/..."
}
```

### POST /users/portal

Open Stripe billing portal for subscription management.

**Response:**
```json
{
  "portal_url": "https://billing.stripe.com/p/session/..."
}
```

---

## Rate Limits

| Tier | Scans/day | API Rate |
|------|-----------|----------|
| Ghost | 0 | 30 req/s (nginx) |
| Hunter | 10 | 30 req/s (nginx) |
| Operator | 1,000 | 30 req/s (nginx) |

Rate limit headers on scanner responses:
- `X-RateLimit-Limit`: Max scans per day
- `X-RateLimit-Remaining`: Scans remaining

---

## Error Format

All errors follow the same format:

```json
{
  "detail": "Human-readable error message"
}
```

HTTP status codes:
- `400` — Bad request (invalid input)
- `401` — Authentication required
- `403` — Insufficient tier
- `404` — Not found
- `429` — Rate limit exceeded
- `502` — Backend/external service error
