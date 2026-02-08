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

## 2. DNS Setup (GoDaddy)

In your GoDaddy DNS management:

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

### Critical .env values for production

```env
# Generate a real secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Production URLs
NEXTAUTH_URL=https://deadinternet.report
NEXT_PUBLIC_API_URL=https://deadinternet.report

# Strong DB password
POSTGRES_PASSWORD=USE_A_STRONG_PASSWORD_HERE

# Disable debug in prod
DEBUG=false

# Fill in all API keys...
```

### Launch

```bash
docker compose up -d

# Check all services are running
docker compose ps

# Check logs
docker compose logs -f
```

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

# Copy certs
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

## 6. Post-Deploy Checklist

- [ ] `curl https://deadinternet.report/health` returns `{"status":"alive"}`
- [ ] Landing page loads with stats
- [ ] Google/GitHub login works
- [ ] Dashboard loads after login
- [ ] Scanner works (Hunter tier)
- [ ] Stripe checkout redirects correctly
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] SSL certificate valid (check with browser)
- [ ] DNS propagated (both @ and www)

---

## 7. Maintenance

### Update to latest version

```bash
cd deadinternet.report
git pull
docker compose build
docker compose up -d
```

### Backup database

```bash
docker compose exec db pg_dump -U deadinet deadinternet > backup_$(date +%Y%m%d).sql
```

### Restore database

```bash
cat backup_20260208.sql | docker compose exec -T db psql -U deadinet deadinternet
```

### Monitor resources

```bash
docker stats
docker compose logs --tail=100 backend
```

---

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend can't reach backend | Check `API_URL=http://backend:8000` in docker-compose |
| Auth callback fails | Verify `NEXTAUTH_URL` matches your domain exactly |
| Scanner returns 502 | Check `ANTHROPIC_API_KEY` is set and valid |
| Stripe webhook fails | Verify `STRIPE_WEBHOOK_SECRET` and endpoint URL |
| DB tables not created | Check logs: `docker compose logs backend` |
| CSS broken / unstyled | Rebuild frontend: `docker compose build frontend` |
| Redis connection refused | Check Redis is healthy: `docker compose ps redis` |
