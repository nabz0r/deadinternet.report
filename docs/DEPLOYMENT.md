# Deployment Guide

Complete guide to deploy deadinternet.report on a VPS with SSL and custom domain.

---

## 1. Choose a VPS

| Provider | Recommended plan | Price | Notes |
|----------|-----------------|-------|-------|
| **Hetzner** | CX22 (4GB RAM, 2 vCPU) | ~€8/mo | Best value, EU datacenter |
| Contabo | VPS S (4GB RAM, 4 vCPU) | ~€6/mo | Budget option |
| DigitalOcean | Basic Droplet (2GB RAM) | ~$12/mo | Good UX |
| OVH | VPS Starter (2GB RAM) | ~€4/mo | EU, cheap |

**Minimum requirements:** 2GB RAM, 1 vCPU, 20GB disk, Ubuntu 24.04 LTS.

---

## 2. DNS Setup

In your DNS provider's management panel:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_VPS_IP` | 600 |
| A | www | `YOUR_VPS_IP` | 600 |

Wait for propagation (5-30 min):

```bash
dig deadinternet.report +short
# Should return your VPS IP
```

---

## 3. Server Setup

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose v2 (if not bundled)
apt install -y docker-compose-v2

# Create deploy user (optional but recommended)
adduser deploy
usermod -aG docker deploy
su - deploy
```

---

## 4. Deploy Application

```bash
# Clone repo
git clone https://github.com/nabz0r/deadinternet.report.git
cd deadinternet.report

# Create environment file
cp .env.example .env
nano .env
```

### Generate required secrets

These are **mandatory** — the application will refuse to start without them:

```bash
# Generate and paste into .env
openssl rand -base64 32   # → NEXTAUTH_SECRET
openssl rand -hex 32      # → JWT_SECRET
openssl rand -hex 32      # → INTERNAL_API_SECRET
```

### Critical .env values for production

```env
# ---- Secrets (REQUIRED - app crashes without these) ----
NEXTAUTH_SECRET=<paste-base64-output-here>
JWT_SECRET=<paste-hex-output-here>
INTERNAL_API_SECRET=<paste-hex-output-here>

# ---- Production URLs ----
NEXTAUTH_URL=https://deadinternet.report
NEXT_PUBLIC_API_URL=https://deadinternet.report

# ---- Database ----
POSTGRES_PASSWORD=<generate-a-strong-password>

# ---- Redis ----
REDIS_PASSWORD=<generate-a-strong-password>

# ---- Security ----
DEBUG=false

# ---- OAuth (get from provider dashboards) ----
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# ---- Stripe ----
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_HUNTER=price_...
STRIPE_PRICE_OPERATOR=price_...

# ---- Anthropic ----
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional tuning (defaults are sensible)

```env
# IP rate limiting (application layer, on top of nginx 30r/s)
IP_RATE_LIMIT=60           # max requests per window
IP_RATE_WINDOW=60          # window in seconds

# Cache TTLs
STATS_CACHE_TTL=3600       # dashboard stats cache (1 hour)
SCAN_CACHE_TTL=86400       # scan result cache (24 hours)

# Scan rate limits per tier (per day)
SCAN_RATE_FREE=0
SCAN_RATE_HUNTER=10
SCAN_RATE_OPERATOR=1000
```

### Launch

```bash
docker compose up -d

# Check all 5 services are running
docker compose ps

# Expected output:
#  NAME          STATUS          PORTS
#  backend       Up (healthy)
#  db            Up (healthy)    5432/tcp
#  frontend      Up              3000/tcp
#  nginx         Up              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
#  redis         Up (healthy)    6379/tcp

# Check logs
docker compose logs -f
```

### Run database migrations

```bash
# Apply all Alembic migrations (creates tables, indexes, constraints)
docker compose exec backend alembic upgrade head
```

> **Note:** If `DEBUG=true`, tables are auto-created on startup via `Base.metadata.create_all()`. In production (`DEBUG=false`), use Alembic migrations for proper schema management.

---

## 5. SSL with Let's Encrypt

### Option A: Certbot standalone (simple)

```bash
# Stop nginx temporarily
docker compose stop nginx

# Install certbot
apt install -y certbot

# Get certificate
certbot certonly --standalone -d deadinternet.report -d www.deadinternet.report

# Create certs directory and copy
mkdir -p nginx/certs
cp /etc/letsencrypt/live/deadinternet.report/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/deadinternet.report/privkey.pem nginx/certs/
```

### Update nginx.conf for SSL

Replace `nginx/nginx.conf` with:

```nginx
events {
    worker_connections 1024;
}

http {
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    # HTTP → HTTPS redirect
    server {
        listen 80;
        server_name deadinternet.report www.deadinternet.report;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS
    server {
        listen 443 ssl;
        server_name deadinternet.report www.deadinternet.report;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # API routes → FastAPI
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            proxy_pass http://backend;
        }

        location /docs {
            proxy_pass http://backend;
        }

        # Everything else → Next.js
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### Restart with SSL

```bash
docker compose up -d --build nginx
```

### Auto-renewal (cron)

```bash
crontab -e
# Add:
0 3 * * 1 certbot renew --quiet && cp /etc/letsencrypt/live/deadinternet.report/*.pem /path/to/deadinternet.report/nginx/certs/ && docker compose restart nginx
```

### Option B: Caddy as reverse proxy (auto-SSL)

Replace the nginx service in `docker-compose.yml` with Caddy for automatic SSL:

```yaml
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - deadnet
```

Create `Caddyfile`:

```
deadinternet.report {
    handle /api/* {
        reverse_proxy backend:8000
    }
    handle /health {
        reverse_proxy backend:8000
    }
    handle /docs {
        reverse_proxy backend:8000
    }
    handle {
        reverse_proxy frontend:3000
    }
}
```

Caddy handles SSL automatically via Let's Encrypt.

---

## 6. Configure Stripe Webhooks

In the [Stripe Dashboard](https://dashboard.stripe.com/webhooks):

1. Click **Add endpoint**
2. Set URL: `https://deadinternet.report/api/v1/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret → paste as `STRIPE_WEBHOOK_SECRET` in `.env`
5. Restart: `docker compose restart backend`

### Test with Stripe CLI (local development)

```bash
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe
# Copy the webhook signing secret it shows
stripe trigger checkout.session.completed
```

---

## 7. Configure OAuth Callbacks

### Google

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- **Authorized redirect URIs:** `https://deadinternet.report/api/auth/callback/google`

### GitHub

In [GitHub Developer Settings](https://github.com/settings/developers):

- **Authorization callback URL:** `https://deadinternet.report/api/auth/callback/github`

---

## 8. Data Aggregation

The aggregation pipeline computes the Dead Internet Index, domain statistics, and dynamic ticker facts from scan data. Trigger it manually or set up a cron job:

### Manual trigger

```bash
curl -X POST https://deadinternet.report/api/v1/stats/aggregate \
  -H "X-Internal-Secret: YOUR_INTERNAL_API_SECRET"
```

### Automated (cron)

```bash
crontab -e
# Run aggregation every hour
0 * * * * curl -s -X POST http://localhost:8000/api/v1/stats/aggregate -H "X-Internal-Secret: $(grep INTERNAL_API_SECRET /path/to/deadinternet.report/.env | cut -d= -f2)" > /dev/null
```

The pipeline:
1. Computes daily scan aggregates → `scan_aggregates` table
2. Computes per-domain statistics → `domain_stats` table
3. Calculates the dynamic Dead Internet Index (research 70% + live scans 30%)
4. Generates dynamic ticker facts from scan data
5. Caches results in Redis (`stats:global`, `stats:live`)

---

## 9. Post-Deploy Checklist

- [ ] `curl https://deadinternet.report/health` returns `{"status":"healthy","database":"ok","redis":"ok"}`
- [ ] Landing page loads with stats and ticker tape
- [ ] Google login works (check callback URL in Google Console)
- [ ] GitHub login works (check callback URL in GitHub Settings)
- [ ] Dashboard loads after login with Dead Internet Index gauge
- [ ] Scanner works for Hunter tier (scan a URL, check results)
- [ ] Scan history page loads with search/filter/sort
- [ ] Analytics page loads with personal metrics
- [ ] Stripe checkout redirects correctly
- [ ] Stripe webhook endpoint configured and verified
- [ ] SSL certificate valid (check with browser padlock)
- [ ] DNS propagated (both `@` and `www`)
- [ ] `DEBUG=false` in production `.env`
- [ ] Strong passwords set for `POSTGRES_PASSWORD` and `REDIS_PASSWORD`
- [ ] Database migrations applied: `docker compose exec backend alembic upgrade head`

---

## 10. Maintenance

### Update to latest version

```bash
cd deadinternet.report
git pull
docker compose build
docker compose up -d

# Run any new migrations
docker compose exec backend alembic upgrade head
```

### Backup database

```bash
# Full dump
docker compose exec db pg_dump -U deadinet deadinternet > backup_$(date +%Y%m%d).sql

# Compressed
docker compose exec db pg_dump -U deadinet deadinternet | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore database

```bash
cat backup_20260208.sql | docker compose exec -T db psql -U deadinet deadinternet
```

### Monitor resources

```bash
# Container resource usage
docker stats

# Recent backend logs
docker compose logs --tail=100 backend

# Request logging output (method, path, status, duration)
docker compose logs --tail=50 backend | grep -E "(GET|POST|PUT|DELETE)"

# Check database pool health
docker compose exec backend python -c "from app.core.database import engine; print(engine.pool.status())"
```

### View structured request logs

The `RequestLoggingMiddleware` logs every request with method, path, status code, and duration. Responses also include an `X-Request-Duration-Ms` header. Health check requests (`/health`, `/favicon.ico`) are excluded to reduce noise.

```bash
# Example log output:
# INFO  GET /api/v1/stats/ 200 12ms
# WARN  GET /api/v1/users/me 401 2ms
# ERROR POST /api/v1/scanner/scan 502 15234ms
```

---

## 11. Troubleshooting

| Issue | Solution |
|-------|----------|
| App crashes on startup | Check `JWT_SECRET` and `INTERNAL_API_SECRET` are set and not weak values |
| Frontend can't reach backend | Check `API_URL=http://backend:8000` in docker-compose |
| Auth callback fails | Verify `NEXTAUTH_URL` matches your domain exactly (including https) |
| GitHub login broken | Ensure `.env` uses `GITHUB_CLIENT_ID` (not `GITHUB_ID`) |
| Scanner returns 502 | Check `ANTHROPIC_API_KEY` is set and valid |
| Stripe webhook fails | Verify `STRIPE_WEBHOOK_SECRET` and endpoint URL in Stripe Dashboard |
| DB tables not created | Run migrations: `docker compose exec backend alembic upgrade head` |
| CSS broken / unstyled | Rebuild frontend: `docker compose build frontend` |
| Redis connection refused | Check Redis is healthy: `docker compose ps redis` |
| Redis auth error | Verify `REDIS_PASSWORD` in `.env` matches docker-compose default |
| Rate limited unexpectedly | Check `IP_RATE_LIMIT` (default 60/min) and nginx zone (30r/s) |
| Stale dashboard stats | Trigger aggregation or check `STATS_CACHE_TTL` (default 1h) |
| Analytics page empty | Run the aggregation pipeline (see section 8) |
| Scan results not updating | Check `SCAN_CACHE_TTL` (default 24h) — same URL returns cached result |
| 503 on /health | Database or Redis is down — check: `docker compose ps` |

---

## 12. Architecture Reference

For detailed architecture diagrams, auth flow, data model, and component tree, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

For API endpoint documentation with request/response examples, see **[API.md](API.md)**.

For the security audit report and remediation status, see **[Security.md](Security.md)**.
