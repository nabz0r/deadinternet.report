# Architecture — deadinternet.report

> Overview of the architecture, data flows, and technical decisions.

---

## Overview

```mermaid
graph TB
    subgraph Internet
        Browser["Browser"]
        Stripe["Stripe API"]
        Claude["Claude API<br/>(Anthropic)"]
        OAuth["Google / GitHub<br/>OAuth Providers"]
    end

    subgraph Docker["Docker Compose"]
        Nginx["Nginx<br/>:80/:443<br/>Reverse Proxy"]

        subgraph Frontend["Frontend Container"]
            Next["Next.js 14<br/>:3000<br/>App Router + SSR"]
            NextAuth["NextAuth.js<br/>JWT Sessions"]
            Proxy["API Proxy<br/>/api/backend/*"]
        end

        subgraph Backend["Backend Container"]
            FastAPI["FastAPI<br/>:8000<br/>Async Python"]
            Scanner["Scanner Service<br/>SSRF Protection<br/>Prompt Sanitization<br/>Batch + Single"]
            Aggregation["Aggregation Service<br/>DII Calculation<br/>Domain Analytics"]
            StripeService["Stripe Service<br/>Checkout + Webhooks"]
            RateLimiter["Rate Limiter<br/>Per-user daily limits"]
            TokenAuth["API Token Auth<br/>SHA-256 hashed<br/>Dual auth (JWT + token)"]
            ReqLogger["Request Logger<br/>Structured logging"]
        end

        subgraph Data["Data Layer"]
            PG[("PostgreSQL 16<br/>:5432<br/>Users, Scans, Subs,<br/>Aggregates, Domains, Tokens")]
            Redis[("Redis 7<br/>:6379<br/>Cache, Rate Limits,<br/>Live Analytics")]
        end
    end

    Browser -->|HTTPS| Nginx
    Nginx -->|/| Next
    Nginx -->|/api/v1| FastAPI
    Nginx -->|/api/v1/webhooks| FastAPI

    Next -->|SSO| NextAuth
    NextAuth -->|OAuth 2.0| OAuth
    Next -->|Re-signed JWT| Proxy
    Proxy -->|HS256 JWT| FastAPI

    FastAPI --> Scanner
    FastAPI --> Aggregation
    FastAPI --> StripeService
    FastAPI --> RateLimiter
    FastAPI --> TokenAuth

    Scanner -->|Fetch + Analyze| Claude
    StripeService -->|Webhooks| Stripe

    FastAPI --> PG
    FastAPI --> Redis
    Aggregation --> PG
    Aggregation --> Redis
    RateLimiter --> Redis

    style Nginx fill:#1a1a2e,color:#ff6600,stroke:#ff6600
    style Next fill:#111,color:#e0e0e0,stroke:#333
    style FastAPI fill:#111,color:#00cc66,stroke:#00cc66
    style PG fill:#111,color:#4169E1,stroke:#4169E1
    style Redis fill:#111,color:#DC382D,stroke:#DC382D
    style Claude fill:#111,color:#d4a574,stroke:#d4a574
    style Stripe fill:#111,color:#635BFF,stroke:#635BFF
```

---

## Authentication Flow

The auth flow is non-standard because NextAuth.js encrypts its JWTs as JWE (A256GCM),
which cannot be decoded on the Python side. Solution: the Next.js proxy re-signs tokens as HS256.

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js
    participant NA as NextAuth
    participant P as API Proxy
    participant F as FastAPI
    participant DB as PostgreSQL

    Note over B,NA: 1. Login Flow
    B->>N: GET /login
    N->>B: Render login page
    B->>NA: Click "Sign in with Google"
    NA->>B: Redirect -> Google OAuth
    B->>NA: OAuth callback with code
    NA->>NA: Create JWE session token

    Note over NA,F: 2. First Login - User Sync
    NA->>F: POST /api/v1/users/sync
    Note right of NA: Header: X-Internal-Secret
    F->>DB: INSERT or UPDATE user
    DB->>F: User record + tier
    F->>NA: {id, tier: "ghost"}
    NA->>NA: Store tier in JWT claims
    NA->>B: Set session cookie (JWE)

    Note over B,F: 3. Authenticated API Call
    B->>P: POST /api/backend/scanner/scan
    Note right of B: Cookie: next-auth session
    P->>P: Decode JWE -> extract claims
    P->>P: Re-sign as HS256 JWT
    Note right of P: JWT_SECRET (shared)
    P->>F: POST /api/v1/scanner/scan
    Note right of P: Authorization: Bearer <HS256>
    F->>F: Verify JWT, extract user
    F->>B: Scan results
```

---

## Scanner Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as FastAPI
    participant RL as Rate Limiter
    participant R as Redis
    participant S as Scanner Service
    participant Web as Target URL
    participant C as Claude API
    participant DB as PostgreSQL

    U->>F: POST /api/v1/scanner/scan {url}
    F->>F: Verify JWT -> user_id, tier

    F->>RL: Check daily usage
    RL->>R: GET scan_count:{user_id}
    R->>RL: count
    alt Limit exceeded
        RL->>U: 429 Too Many Requests
    end

    F->>R: Check cache for URL
    alt Cache hit
        R->>U: Cached scan result
    end

    F->>S: scan_url(url)
    S->>S: validate_url()
    Note right of S: Block private IPs,<br/>localhost, metadata,<br/>non-HTTP schemes

    S->>Web: HTTP GET (timeout 15s)
    Web->>S: HTML content

    S->>S: sanitize_content()
    Note right of S: Remove prompt injection<br/>patterns, truncate to 4000 chars

    S->>C: messages.create()
    Note right of S: System: SCANNER_PROMPT<br/>User: <content_to_analyze>...
    C->>S: JSON response

    S->>S: Parse + validate JSON
    Note right of S: Clamp ai_probability [0,1]<br/>Validate verdict enum<br/>Fallback on parse error

    S->>DB: INSERT scan record
    S->>R: INCR scan_count:{user_id}
    S->>R: Cache result (TTL)
    S->>U: {ai_probability, verdict, analysis, signals}
```

---

## Data Aggregation Flow

```mermaid
sequenceDiagram
    participant T as Trigger<br/>(API / Cron)
    participant A as Aggregation Service
    participant DB as PostgreSQL
    participant R as Redis

    T->>A: run_full_aggregation()

    Note over A,DB: Step 1: Daily Rollups
    A->>DB: SELECT scans GROUP BY date, verdict
    DB->>A: Raw scan data
    A->>DB: UPSERT scan_aggregates

    Note over A,DB: Step 2: Domain Stats
    A->>DB: SELECT all scan URLs
    A->>A: Parse URLs -> extract domains<br/>Strip www. prefix
    A->>DB: UPSERT domain_stats

    Note over A,R: Step 3: Dead Internet Index
    A->>A: research_score = (bot*0.4 + ai_content*0.4 + ai_articles*0.2)
    A->>DB: SELECT AVG(ai_probability) WHERE verdict=ai_generated
    A->>A: DII = research*0.7 + live_scans*0.3<br/>(requires 10+ scans for blending)

    Note over A,R: Step 4: Cache Results
    A->>A: Generate scan summary
    A->>A: Generate dynamic ticker facts
    A->>A: Compute volume trends + top domains
    A->>R: SET stats:live {analytics JSON}
    A->>R: SET stats:global {blended stats}
```

---

## Stripe Payment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant N as Next.js
    participant F as FastAPI
    participant S as Stripe
    participant DB as PostgreSQL

    Note over U,S: 1. Checkout
    U->>N: Click "UPGRADE" on /pricing
    N->>F: POST /api/v1/users/checkout?price_id=...
    F->>F: Validate price_id in [hunter, operator]
    F->>S: stripe.checkout.Session.create()
    Note right of F: With idempotency key
    S->>F: {url: checkout_url}
    F->>N: {checkout_url}
    N->>U: Redirect -> Stripe Checkout

    Note over U,S: 2. Payment
    U->>S: Complete payment on Stripe
    S->>U: Redirect -> /dashboard/success

    Note over S,DB: 3. Webhook (async)
    S->>F: POST /api/v1/webhooks/stripe
    Note right of S: checkout.session.completed
    F->>F: Verify webhook signature
    F->>F: Check Redis dedup (48h TTL)
    F->>S: Retrieve subscription details
    S->>F: {price_id, status}
    F->>DB: UPDATE user SET tier = 'hunter'
    F->>DB: INSERT subscription record
    F->>S: 200 OK

    Note over U,DB: 4. Session Refresh
    U->>N: Visit /dashboard/success
    N->>N: session.update() -> refresh tier
    N->>U: "UPGRADE COMPLETE" + countdown
    N->>U: Redirect -> /dashboard
```

---

## Data Model

```mermaid
erDiagram
    USER {
        string id PK "UUID from OAuth"
        string email UK "Unique, indexed"
        string name "Display name"
        string image "Avatar URL"
        string tier "ghost|hunter|operator"
        string stripe_customer_id "Nullable"
        datetime created_at
        datetime updated_at
    }

    SCAN {
        string id PK "UUID"
        string user_id FK "-> USER.id"
        string url "Scanned URL (max 2000)"
        float ai_probability "0.0 - 1.0"
        string verdict "human|mixed|ai_generated"
        text analysis "Claude's explanation"
        text content_snippet "First 500 chars"
        string model_used "Claude model version"
        int tokens_used "API tokens consumed"
        int scan_duration_ms "Processing time"
        datetime created_at
        datetime updated_at
    }

    SUBSCRIPTION {
        int id PK "Auto-increment"
        string user_id FK "-> USER.id"
        string stripe_subscription_id UK
        string stripe_price_id
        string status "active|canceled|past_due"
        string tier "hunter|operator"
        datetime created_at
        datetime updated_at
    }

    SCAN_AGGREGATE {
        int id PK "Auto-increment"
        date date "Aggregation date"
        string verdict "human|mixed|ai_generated"
        int scan_count "Total scans for day+verdict"
        float avg_ai_probability "Average AI probability"
        float min_ai_probability "Minimum AI probability"
        float max_ai_probability "Maximum AI probability"
        int total_tokens_used "Sum of tokens"
        int avg_scan_duration_ms "Average scan time"
    }

    DOMAIN_STATS {
        int id PK "Auto-increment"
        string domain UK "Normalized, www-stripped"
        int scan_count "Total scans"
        int ai_generated_count "AI verdict count"
        int mixed_count "Mixed verdict count"
        int human_count "Human verdict count"
        float avg_ai_probability "Average AI probability"
        datetime last_scanned "Most recent scan"
    }

    API_TOKEN {
        string id PK "UUID"
        string user_id FK "-> USER.id"
        string name "User-provided label"
        string token_hash UK "SHA-256 hex"
        string token_prefix "First 8 chars"
        boolean revoked "Soft delete"
        datetime last_used_at "Nullable"
        datetime created_at
    }

    USER ||--o{ SCAN : "performs"
    USER ||--o| SUBSCRIPTION : "has"
    USER ||--o{ API_TOKEN : "owns"
    SCAN }o--|| SCAN_AGGREGATE : "rolled up into"
    SCAN }o--|| DOMAIN_STATS : "aggregated into"
```

---

## Route Structure

```mermaid
graph LR
    subgraph Public["Public Routes"]
        LP["/"] -->|Landing| SSR["SSR - page.tsx"]
        PR["/pricing"] -->|Tiers| Client["Client component"]
        LG["/login"] -->|Auth| NextAuth
        TOS["/terms"] -->|Legal| SSR2["SSR"]
        PIV["/privacy"] -->|Legal| SSR3["SSR"]
    end

    subgraph Protected["Protected Routes (middleware)"]
        DB["/dashboard"] -->|Stats| Dashboard
        HI["/dashboard/history"] -->|Hunter+| History
        AN["/dashboard/analytics"] -->|Hunter+| Analytics
        SU["/dashboard/success"] -->|Post-checkout| Success
    end

    subgraph API["API Routes (Next.js)"]
        AUTH["/api/auth/*"] -->|NextAuth| Handlers
        BK["/api/backend/*"] -->|Proxy| FastAPI
    end

    subgraph Backend["FastAPI Endpoints"]
        ST["/api/v1/stats/*"] -->|Public| Stats
        SC["/api/v1/scanner/scan"] -->|Hunter+ JWT| Scanner
        BA["/api/v1/scanner/batch"] -->|Operator JWT/Token| BatchScan
        US["/api/v1/users/*"] -->|Auth / Internal| Users
        TK["/api/v1/users/tokens"] -->|Operator| Tokens
        WH["/api/v1/webhooks/stripe"] -->|Stripe signature| Webhooks
    end

    style Public fill:#0a0a0a,color:#e0e0e0,stroke:#333
    style Protected fill:#0a0a0a,color:#ff6600,stroke:#ff6600
    style API fill:#0a0a0a,color:#ffaa00,stroke:#ffaa00
    style Backend fill:#0a0a0a,color:#00cc66,stroke:#00cc66
```

---

## Middleware Stack

Middleware executes in reverse order of registration (last added = first executed):

```
Request → RequestLoggingMiddleware → IPRateLimitMiddleware → CORS → FastAPI Router → Response
```

| Middleware | Purpose |
|-----------|---------|
| `RequestLoggingMiddleware` | Logs method, path, status, duration; adds `X-Request-Duration-Ms` header |
| `IPRateLimitMiddleware` | Per-IP rate limiting (60 req/min) via Redis sliding window |
| `CORSMiddleware` | Cross-origin request handling |

---

## Security Stack

```mermaid
graph TB
    subgraph Perimeter["Perimeter"]
        NGINX["Nginx<br/>Rate limit 30r/s<br/>SSL termination"]
        CSP["CSP Headers<br/>X-Frame-Options<br/>HSTS"]
    end

    subgraph Auth["Authentication"]
        OAuth2["OAuth 2.0<br/>Google + GitHub"]
        JWE["JWE Tokens<br/>(NextAuth)"]
        HS256["HS256 JWT<br/>(Backend)"]
        ApiToken["API Tokens<br/>SHA-256 hashed<br/>(Operator tier)"]
        Internal["X-Internal-Secret<br/>(/users/sync, /stats/aggregate)"]
    end

    subgraph Validation["Validation"]
        SSRF["SSRF Protection<br/>IP blocklist + DNS check"]
        Prompt["Prompt Injection<br/>Content sanitization"]
        JSONVal["JSON Validation<br/>Clamp + fallback"]
        PathWL["Path Whitelist<br/>Proxy route"]
        PriceVal["Price ID Validation<br/>Stripe checkout"]
    end

    subgraph Secrets["Secret Management"]
        EnvVal["Startup Validation<br/>Crash on weak secrets"]
        NoDefault["No default values<br/>JWT_SECRET, INTERNAL_API_SECRET"]
        CompareDigest["secrets.compare_digest<br/>Timing-safe comparison"]
    end

    NGINX --> CSP
    CSP --> OAuth2
    OAuth2 --> JWE --> HS256
    HS256 --> ApiToken
    ApiToken --> Internal
    Internal --> SSRF
    SSRF --> Prompt --> JSONVal
    PathWL --> PriceVal
    EnvVal --> NoDefault --> CompareDigest

    style Perimeter fill:#1a1a1a,color:#ff6600,stroke:#ff6600
    style Auth fill:#1a1a1a,color:#00cc66,stroke:#00cc66
    style Validation fill:#1a1a1a,color:#ffaa00,stroke:#ffaa00
    style Secrets fill:#1a1a1a,color:#ff4444,stroke:#ff4444
```

---

## Frontend Components

```mermaid
graph TB
    subgraph Layout["Layout"]
        RootLayout["layout.tsx<br/>Providers wrapper"]
        Header["Header.tsx<br/>Nav + User menu + Tier badge"]
        Footer["Footer.tsx<br/>Links"]
        MobileNav["MobileNav.tsx<br/>Fixed bottom nav (mobile)"]
    end

    subgraph Dashboard["Dashboard Components"]
        Gauge["DeadIndexGauge<br/>SVG gauge + pulse glow<br/>Responsive + ARIA"]
        StatCard["StatCard<br/>Animated metric"]
        Timeline["TimelineChart<br/>Recharts area<br/>Projected dot markers"]
        Platform["PlatformBreakdown<br/>Horizontal bars"]
        LiveScan["LiveScanner<br/>URL input + Cmd+K<br/>Progress + ARIA"]
        Ticker["TickerTape<br/>Scrolling news<br/>role=marquee + sr-only"]
        Upgrade["UpgradeBanner<br/>CTA for Ghost users"]
    end

    subgraph Pages["Dashboard Pages"]
        DashPage["Dashboard<br/>Main stats view<br/>Refresh + skip-to-content"]
        HistoryPage["History<br/>Search + filter + sort<br/>useMemo filtering"]
        AnalyticsPage["Analytics<br/>Personal + global stats<br/>Domain rankings + charts"]
        SuccessPage["Success<br/>Post-checkout<br/>Countdown + animations"]
    end

    subgraph Landing["Landing Components"]
        HeroCounter["HeroCounter<br/>Animated count-up<br/>IntersectionObserver"]
        LivePulse["LivePulse<br/>Pulsing green dot"]
    end

    subgraph UI["UI System"]
        Toast["Toast<br/>Context-based notifications<br/>Auto-dismiss 4s"]
        Skeleton["Skeleton<br/>Loading placeholders<br/>Card, Gauge, Chart, Table"]
        ErrorBound["ErrorBoundary<br/>Catch render errors<br/>Retry button"]
    end

    subgraph Lib["Shared Libraries"]
        APIClient["api-client.ts<br/>Type-safe fetch wrapper<br/>Analytics + tokens + batch"]
        Verdict["verdict.ts<br/>Shared color/label helpers"]
        Constants["constants.ts<br/>Tier definitions + feature gates"]
    end

    RootLayout --> Header
    RootLayout --> Footer
    RootLayout --> MobileNav
    RootLayout --> Toast

    style Layout fill:#111,color:#e0e0e0,stroke:#333
    style Dashboard fill:#111,color:#ff6600,stroke:#ff6600
    style Pages fill:#111,color:#ff4444,stroke:#ff4444
    style Landing fill:#111,color:#00cc66,stroke:#00cc66
    style UI fill:#111,color:#ffaa00,stroke:#ffaa00
    style Lib fill:#111,color:#d4a574,stroke:#d4a574
```

---

## Environment Variables

```mermaid
graph LR
    subgraph Required["Required"]
        JWT["JWT_SECRET<br/>openssl rand -hex 32"]
        INTERNAL["INTERNAL_API_SECRET<br/>openssl rand -hex 32"]
        NEXTAUTH["NEXTAUTH_SECRET<br/>openssl rand -base64 32"]
        ANTHROPIC["ANTHROPIC_API_KEY"]
        STRIPE_SK["STRIPE_SECRET_KEY"]
        STRIPE_WH["STRIPE_WEBHOOK_SECRET"]
        STRIPE_PH["STRIPE_PRICE_HUNTER"]
        STRIPE_PO["STRIPE_PRICE_OPERATOR"]
        GOOGLE["GOOGLE_CLIENT_ID/SECRET"]
        GITHUB["GITHUB_CLIENT_ID/SECRET"]
    end

    subgraph Optional["Optional"]
        DB_URL["DATABASE_URL<br/>default: docker internal"]
        REDIS["REDIS_URL<br/>default: redis://redis:6379"]
        DEBUG["DEBUG<br/>default: false"]
        CORS["CORS_ORIGINS"]
        RATE["IP_RATE_LIMIT / IP_RATE_WINDOW"]
        CACHE["SCAN_CACHE_TTL / STATS_CACHE_TTL"]
    end

    JWT -->|Backend| FastAPI
    JWT -->|Frontend| Proxy["API Proxy route"]
    INTERNAL -->|Frontend| AuthTS["auth.ts"]
    INTERNAL -->|Backend| UsersSync["/users/sync<br/>/stats/aggregate"]

    style Required fill:#1a1a1a,color:#ff4444,stroke:#ff4444
    style Optional fill:#1a1a1a,color:#ffaa00,stroke:#ffaa00
```
