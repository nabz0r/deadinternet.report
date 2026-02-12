# API Reference

> Base URL: `https://deadinternet.report/api/v1`
>
> Interactive docs: `https://deadinternet.report/docs` (Swagger UI)

---

## Authentication

Public endpoints require no authentication. Protected endpoints require a Bearer token in the `Authorization` header.

### Browser-based (JWT)

In the browser, authentication is handled automatically through the Next.js API proxy (`/api/backend/...`), which extracts the NextAuth session and re-signs it as an HS256 JWT.

### API Tokens (Operator tier)

Operator-tier users can create API tokens for programmatic access. API tokens work with the same `Authorization: Bearer` header and are accepted on all authenticated endpoints plus batch scanning.

```bash
# Create a token via the dashboard or API
# Token format: dir_<64 hex chars>

# Use the token for API calls
curl -H "Authorization: Bearer dir_abc123..." \
  https://deadinternet.report/api/v1/scanner/batch \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com", "https://test.com"]}'
```

The backend tries JWT decoding first. If that fails, it falls back to API token lookup (SHA-256 hash comparison).

---

## Public Endpoints

### GET /stats/

Full dataset including all metrics. Stats are blended with live scan data when available (research data + aggregated scan results).

**Response:**
```json
{
  "dead_internet_index": 0.67,
  "last_updated": "2026-02-11",
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

The Dead Internet Index composite score. Blends research data (70%) with live scan results (30%) when sufficient scans exist (10+).

**Response:**
```json
{
  "index": 0.67,
  "last_updated": "2026-02-11"
}
```

### GET /stats/analytics

Global scan analytics including the Dead Internet Index, scan summary, dynamic ticker facts, volume trends, and top domains.

**Response:**
```json
{
  "dead_internet_index": 0.67,
  "scan_summary": {
    "total_scans": 1542,
    "avg_ai_probability": 0.62,
    "verdict_breakdown": {
      "ai_generated": 823,
      "mixed": 412,
      "human": 307
    },
    "verdict_rates": {
      "ai_generated": 0.534,
      "mixed": 0.267,
      "human": 0.199
    },
    "total_tokens_used": 385000,
    "avg_scan_duration_ms": 2150
  },
  "dynamic_ticker_facts": [
    "53.4% of scanned pages were flagged as AI-generated",
    "Average AI probability across all scans: 62.0%"
  ],
  "scan_volume_trend": [
    { "date": "2026-02-10", "total": 45, "ai_generated": 24, "mixed": 12, "human": 9, "avg_ai_probability": 0.61 }
  ],
  "top_domains": [
    { "domain": "example.com", "scan_count": 42, "ai_generated_count": 28, "mixed_count": 8, "human_count": 6, "avg_ai_probability": 0.71, "ai_rate": 0.667, "last_scanned": "2026-02-11" }
  ]
}
```

### GET /stats/domains?limit=20&sort=scan_count

Top scanned domains ranked by scan count or AI rate.

**Query parameters:**
- `limit` (int, default 20) — max domains to return
- `sort` (string, default "scan_count") — sort by `scan_count` or `ai_rate`

**Response:**
```json
[
  {
    "domain": "example.com",
    "scan_count": 42,
    "ai_generated_count": 28,
    "mixed_count": 8,
    "human_count": 6,
    "avg_ai_probability": 0.71,
    "ai_rate": 0.667,
    "last_scanned": "2026-02-11"
  }
]
```

### GET /stats/volume?days=30

Daily scan volume trend for charting.

**Query parameters:**
- `days` (int, default 30) — number of days to include

**Response:**
```json
[
  {
    "date": "2026-02-10",
    "total": 45,
    "ai_generated": 24,
    "mixed": 12,
    "human": 9,
    "avg_ai_probability": 0.61
  }
]
```

### GET /health

Health check for monitoring. Verifies database and Redis connectivity.

**Response (200):**
```json
{
  "service": "deadinternet-api",
  "database": "ok",
  "redis": "ok",
  "status": "healthy"
}
```

**Response (503):**
```json
{
  "service": "deadinternet-api",
  "database": "error",
  "redis": "ok",
  "status": "degraded"
}
```

---

## Scanner Endpoints (Hunter+ required)

### POST /scanner/scan

Analyze a URL for AI-generated content using Claude AI. Results are cached for the configured TTL (default 24h).

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
    "created_at": "2026-02-11T15:30:00Z"
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

### POST /scanner/batch (Operator required, supports API tokens)

Batch-analyze up to 10 URLs concurrently. Each URL counts toward the daily scan limit. URLs are processed with a concurrency limit of 3.

**Request:**
```json
{
  "urls": [
    "https://example.com/article-1",
    "https://example.com/article-2",
    "https://blog.test/post"
  ]
}
```

**Response:**
```json
{
  "total": 3,
  "succeeded": 2,
  "failed": 1,
  "results": [
    {
      "url": "https://example.com/article-1",
      "status": "success",
      "result": {
        "id": "a1b2c3d4-...",
        "url": "https://example.com/article-1",
        "ai_probability": 0.85,
        "verdict": "ai_generated",
        "analysis": "Highly formulaic structure...",
        "content_snippet": "In today's...",
        "model_used": "claude-sonnet-4-5-20250929",
        "scan_duration_ms": 2100,
        "created_at": "2026-02-12T10:00:00Z"
      },
      "error": null
    },
    {
      "url": "https://blog.test/post",
      "status": "error",
      "result": null,
      "error": "Cannot resolve hostname: blog.test"
    }
  ],
  "usage": {
    "used": 15,
    "limit": 1000,
    "remaining": 985
  }
}
```

**Errors:**
- `403` — Requires Operator tier
- `422` — Empty list, >10 URLs, or invalid URL format
- `429` — Not enough remaining daily scans for the full batch

---

## API Token Endpoints (Operator required)

### POST /users/tokens

Create a new API token. Maximum 5 active (non-revoked) tokens per user. The raw token is returned **only once** at creation.

**Request:**
```json
{
  "name": "CI Pipeline"
}
```

**Response:**
```json
{
  "id": "token-uuid",
  "name": "CI Pipeline",
  "token": "dir_a1b2c3d4e5f6...",
  "token_prefix": "dir_a1b2",
  "created_at": "2026-02-12T10:00:00Z"
}
```

**Errors:**
- `400` — Maximum 5 active tokens reached
- `403` — Requires Operator tier
- `422` — Name empty or >100 characters

### GET /users/tokens

List all API tokens for the current user (including revoked). The raw token value is **never** returned in list responses.

**Response:**
```json
[
  {
    "id": "token-uuid",
    "name": "CI Pipeline",
    "token_prefix": "dir_a1b2",
    "revoked": false,
    "last_used_at": "2026-02-12T09:15:00Z",
    "created_at": "2026-02-11T10:00:00Z"
  }
]
```

### DELETE /users/tokens/{token_id}

Revoke an API token. Revoked tokens cannot be used for authentication.

**Response:**
```json
{
  "id": "token-uuid",
  "revoked": true
}
```

**Errors:**
- `400` — Token already revoked
- `404` — Token not found (or belongs to another user)

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

### GET /users/me/analytics

Personal scan analytics for the authenticated user. Includes total scans, monthly activity, verdict breakdown, top domains (www-stripped, grouped), and recent daily activity (last 30 days).

**Response:**
```json
{
  "total_scans": 87,
  "scans_this_month": 23,
  "avg_ai_probability": 0.58,
  "verdict_breakdown": {
    "ai_generated": 42,
    "mixed": 28,
    "human": 17
  },
  "top_domains": [
    {
      "domain": "example.com",
      "scan_count": 15,
      "ai_generated_count": 10,
      "mixed_count": 3,
      "human_count": 2,
      "avg_ai_probability": 0.72,
      "ai_rate": 0.667
    }
  ],
  "recent_activity": [
    {
      "date": "2026-02-10",
      "total": 5,
      "ai_generated": 3,
      "mixed": 1,
      "human": 1
    }
  ]
}
```

### POST /users/sync

Sync user from NextAuth on login. Called internally by the NextAuth JWT callback. Requires `X-Internal-Secret` header.

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

Create a Stripe Checkout session. Uses idempotency keys to prevent duplicate sessions.

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

## Internal Endpoints

### POST /stats/aggregate

Trigger the full data aggregation pipeline. Requires `X-Internal-Secret` header for authentication.

The pipeline:
1. Computes daily scan aggregates (scan_aggregates table)
2. Computes domain statistics (domain_stats table)
3. Calculates the dynamic Dead Internet Index
4. Generates global scan summary
5. Creates dynamic ticker facts
6. Computes scan volume trends
7. Identifies top domains
8. Caches all results in Redis

**Request headers:**
```
X-Internal-Secret: YOUR_INTERNAL_API_SECRET
```

**Response:**
```json
{
  "status": "ok",
  "message": "Aggregation complete"
}
```

---

## Rate Limits

| Tier | Scans/day | API Rate |
|------|-----------|----------|
| Ghost | 0 | 30 req/s (nginx) + 60 req/min (app) |
| Hunter | 10 | 30 req/s (nginx) + 60 req/min (app) |
| Operator | 1,000 | 30 req/s (nginx) + 60 req/min (app) |

Rate limit headers on all responses:
- `X-RateLimit-Limit`: Max requests per window
- `X-RateLimit-Remaining`: Requests remaining in window

Additional header on all responses:
- `X-Request-Duration-Ms`: Server-side request processing time

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
