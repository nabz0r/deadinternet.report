'use client'

import { useState, useCallback } from 'react'

/* ─── Types ─────────────────────────────────────────────────────── */

interface Step {
  id: string
  title: string
  subtitle: string
  icon: string
}

const STEPS: Step[] = [
  { id: 'prerequisites', title: 'PREREQUISITES', subtitle: 'VPS & System Requirements', icon: '01' },
  { id: 'dns', title: 'DNS SETUP', subtitle: 'Point Domain to Server', icon: '02' },
  { id: 'server', title: 'SERVER SETUP', subtitle: 'Install Docker & Dependencies', icon: '03' },
  { id: 'configure', title: 'CONFIGURE', subtitle: 'Environment & Secrets', icon: '04' },
  { id: 'launch', title: 'LAUNCH', subtitle: 'Start All Services', icon: '05' },
  { id: 'ssl', title: 'SSL SETUP', subtitle: 'HTTPS with Let\'s Encrypt', icon: '06' },
  { id: 'verify', title: 'VERIFY', subtitle: 'Post-Deploy Checklist', icon: '07' },
]

/* ─── Helper: Copy to Clipboard ─────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 font-mono text-[10px] px-2 py-1 border border-dead-border text-dead-muted hover:text-dead-accent hover:border-dead-accent transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? '[ COPIED ]' : '[ COPY ]'}
    </button>
  )
}

/* ─── Helper: Terminal Code Block ────────────────────────────────── */

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <div className="relative bg-dead-bg border border-dead-border my-3 group">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-dead-border">
        <span className="w-1.5 h-1.5 rounded-full bg-dead-danger" />
        <span className="w-1.5 h-1.5 rounded-full bg-dead-ai" />
        <span className="w-1.5 h-1.5 rounded-full bg-dead-safe" />
        <span className="font-mono text-dead-muted text-[10px] ml-1">{language}</span>
      </div>
      <CopyButton text={code} />
      <pre className="p-3 overflow-x-auto text-sm font-mono text-dead-dim leading-relaxed whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  )
}

/* ─── Helper: Secret Generator ───────────────────────────────────── */

function SecretGenerator({ label, type }: { label: string; type: 'base64' | 'hex' }) {
  const [value, setValue] = useState('')

  const generate = useCallback(() => {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    if (type === 'hex') {
      setValue(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
    } else {
      setValue(btoa(String.fromCharCode.apply(null, Array.from(bytes))))
    }
  }, [type])

  const copy = useCallback(() => {
    if (value) navigator.clipboard.writeText(value)
  }, [value])

  return (
    <div className="flex items-center gap-2 my-2">
      <span className="font-mono text-dead-dim text-xs w-44 shrink-0">{label}:</span>
      <div className="flex-1 bg-dead-bg border border-dead-border px-3 py-2 font-mono text-xs text-dead-safe min-h-[34px] truncate">
        {value || <span className="text-dead-muted">Click generate →</span>}
      </div>
      <button
        onClick={generate}
        className="font-mono text-[10px] px-3 py-2 border border-dead-accent text-dead-accent hover:bg-dead-accent/10 transition-colors shrink-0"
      >
        GENERATE
      </button>
      {value && (
        <button
          onClick={copy}
          className="font-mono text-[10px] px-3 py-2 border border-dead-border text-dead-muted hover:text-dead-accent hover:border-dead-accent transition-colors shrink-0"
        >
          COPY
        </button>
      )}
    </div>
  )
}

/* ─── Helper: Checklist Item ──────────────────────────────────────── */

function CheckItem({
  children,
  checked,
  onToggle,
}: {
  children: React.ReactNode
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 w-full text-left py-2 px-3 border border-dead-border hover:border-dead-accent/30 transition-colors ${
        checked ? 'opacity-60' : ''
      }`}
    >
      <span
        className={`w-4 h-4 border shrink-0 flex items-center justify-center text-[10px] ${
          checked
            ? 'border-dead-safe bg-dead-safe/10 text-dead-safe'
            : 'border-dead-border text-transparent'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
      <span className={`font-mono text-xs ${checked ? 'text-dead-muted line-through' : 'text-dead-dim'}`}>
        {children}
      </span>
    </button>
  )
}

/* ─── Step Content Renderers ──────────────────────────────────────── */

function StepPrerequisites() {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-3">Choose a VPS Provider</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'Hetzner', plan: 'CX22 (4GB / 2 vCPU)', price: '~€8/mo', tag: 'BEST VALUE' },
            { name: 'DigitalOcean', plan: 'Basic (2GB / 1 vCPU)', price: '~$12/mo', tag: '' },
            { name: 'Contabo', plan: 'VPS S (4GB / 4 vCPU)', price: '~€6/mo', tag: 'BUDGET' },
            { name: 'OVH', plan: 'Starter (2GB / 1 vCPU)', price: '~€4/mo', tag: '' },
          ].map(p => (
            <div
              key={p.name}
              className="border border-dead-border p-4 hover:border-dead-accent/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-dead-text text-sm font-bold">{p.name}</span>
                {p.tag && (
                  <span className="font-mono text-[10px] text-dead-accent border border-dead-accent/30 px-1.5 py-0.5">
                    {p.tag}
                  </span>
                )}
              </div>
              <p className="font-mono text-dead-dim text-xs">{p.plan}</p>
              <p className="font-mono text-dead-safe text-xs mt-1">{p.price}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">Minimum Requirements</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'RAM', value: '2 GB' },
            { label: 'CPU', value: '1 vCPU' },
            { label: 'Disk', value: '20 GB' },
            { label: 'OS', value: 'Ubuntu 24.04' },
          ].map(r => (
            <div key={r.label} className="border border-dead-border p-3 text-center">
              <p className="font-mono text-dead-muted text-[10px] uppercase tracking-wider">{r.label}</p>
              <p className="font-mono text-dead-text text-sm font-bold">{r.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepDNS() {
  return (
    <div className="space-y-4">
      <p className="font-mono text-dead-dim text-xs">
        In your DNS provider&apos;s management panel, add these records pointing to your VPS IP:
      </p>

      <div className="border border-dead-border overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-dead-border text-dead-muted">
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Value</th>
              <th className="text-left px-4 py-2">TTL</th>
            </tr>
          </thead>
          <tbody className="text-dead-dim">
            <tr className="border-b border-dead-border">
              <td className="px-4 py-2 text-dead-accent">A</td>
              <td className="px-4 py-2">@</td>
              <td className="px-4 py-2 text-dead-safe">YOUR_VPS_IP</td>
              <td className="px-4 py-2">600</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-dead-accent">A</td>
              <td className="px-4 py-2">www</td>
              <td className="px-4 py-2 text-dead-safe">YOUR_VPS_IP</td>
              <td className="px-4 py-2">600</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="font-mono text-dead-dim text-xs">
        Wait 5-30 minutes for propagation, then verify:
      </p>

      <CodeBlock code="dig deadinternet.report +short
# Should return your VPS IP" />
    </div>
  )
}

function StepServer() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">1. Connect to your VPS</h4>
        <CodeBlock code="ssh root@YOUR_VPS_IP" />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">2. Update system & install Docker</h4>
        <CodeBlock code={`# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose v2
apt install -y docker-compose-v2`} />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Create deploy user (recommended)</h4>
        <CodeBlock code={`adduser deploy
usermod -aG docker deploy
su - deploy`} />
      </div>
    </div>
  )
}

function StepConfigure() {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">1. Clone repository</h4>
        <CodeBlock code={`git clone https://github.com/nabz0r/deadinternet.report.git
cd deadinternet.report
cp .env.example .env`} />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-3">2. Generate secrets</h4>
        <p className="font-mono text-dead-danger text-xs mb-3">
          ▸ These are MANDATORY — the application will refuse to start without them.
        </p>
        <div className="bg-dead-surface border border-dead-border p-4 space-y-1">
          <SecretGenerator label="NEXTAUTH_SECRET" type="base64" />
          <SecretGenerator label="JWT_SECRET" type="hex" />
          <SecretGenerator label="INTERNAL_API_SECRET" type="hex" />
          <SecretGenerator label="POSTGRES_PASSWORD" type="hex" />
          <SecretGenerator label="REDIS_PASSWORD" type="hex" />
        </div>
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Edit .env file</h4>
        <p className="font-mono text-dead-dim text-xs mb-2">
          Paste your generated secrets and configure production settings:
        </p>
        <CodeBlock language="env" code={`# ─── Secrets (REQUIRED) ───
NEXTAUTH_SECRET=<paste-from-above>
JWT_SECRET=<paste-from-above>
INTERNAL_API_SECRET=<paste-from-above>

# ─── Production URLs ───
NEXTAUTH_URL=https://deadinternet.report
NEXT_PUBLIC_API_URL=https://deadinternet.report

# ─── Database ───
POSTGRES_PASSWORD=<paste-from-above>

# ─── Redis ───
REDIS_PASSWORD=<paste-from-above>

# ─── Security ───
DEBUG=false

# ─── OAuth (from provider dashboards) ───
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# ─── Stripe ───
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_HUNTER=price_...
STRIPE_PRICE_OPERATOR=price_...

# ─── Anthropic ───
ANTHROPIC_API_KEY=sk-ant-...`} />
      </div>
    </div>
  )
}

function StepLaunch() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">1. Start all services</h4>
        <CodeBlock code="docker compose up -d" />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">2. Verify all 5 services are running</h4>
        <CodeBlock code="docker compose ps" />
        <div className="bg-dead-bg border border-dead-border p-3 font-mono text-xs text-dead-dim">
          <p className="text-dead-muted mb-2">Expected output:</p>
          <p>NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS</p>
          <p>backend &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up (healthy)</p>
          <p>db &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up (healthy) &nbsp;&nbsp;&nbsp;5432/tcp</p>
          <p>frontend &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3000/tcp</p>
          <p>nginx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.0.0.0:80→80, 0.0.0.0:443→443</p>
          <p>redis &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up (healthy) &nbsp;&nbsp;&nbsp;6379/tcp</p>
        </div>
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Run database migrations</h4>
        <CodeBlock code="docker compose exec backend alembic upgrade head" />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">4. Check logs</h4>
        <CodeBlock code="docker compose logs -f" />
      </div>
    </div>
  )
}

function StepSSL() {
  const [method, setMethod] = useState<'certbot' | 'caddy'>('certbot')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMethod('certbot')}
          className={`font-mono text-xs px-4 py-2 border transition-colors ${
            method === 'certbot'
              ? 'border-dead-accent text-dead-accent bg-dead-accent/10'
              : 'border-dead-border text-dead-muted hover:text-dead-accent'
          }`}
        >
          CERTBOT (Manual)
        </button>
        <button
          onClick={() => setMethod('caddy')}
          className={`font-mono text-xs px-4 py-2 border transition-colors ${
            method === 'caddy'
              ? 'border-dead-accent text-dead-accent bg-dead-accent/10'
              : 'border-dead-border text-dead-muted hover:text-dead-accent'
          }`}
        >
          CADDY (Auto-SSL)
        </button>
      </div>

      {method === 'certbot' ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">1. Get certificate</h4>
            <CodeBlock code={`# Stop nginx temporarily
docker compose stop nginx

# Install certbot
apt install -y certbot

# Get certificate
certbot certonly --standalone \\
  -d deadinternet.report \\
  -d www.deadinternet.report

# Copy certificates
mkdir -p nginx/certs
cp /etc/letsencrypt/live/deadinternet.report/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/deadinternet.report/privkey.pem nginx/certs/`} />
          </div>

          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">2. Restart nginx with SSL</h4>
            <CodeBlock code="docker compose up -d --build nginx" />
          </div>

          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Auto-renewal (cron)</h4>
            <CodeBlock code={`crontab -e
# Add this line:
0 3 * * 1 certbot renew --quiet && cp /etc/letsencrypt/live/deadinternet.report/*.pem /path/to/deadinternet.report/nginx/certs/ && docker compose restart nginx`} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-mono text-dead-dim text-xs">
            Caddy handles SSL automatically via Let&apos;s Encrypt. Replace the nginx service with Caddy in your docker-compose.yml:
          </p>

          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">1. Replace nginx service in docker-compose.yml</h4>
            <CodeBlock language="yaml" code={`caddy:
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
    - deadnet`} />
          </div>

          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">2. Create Caddyfile</h4>
            <CodeBlock language="caddyfile" code={`deadinternet.report {
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
}`} />
          </div>

          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Restart</h4>
            <CodeBlock code="docker compose up -d" />
          </div>

          <div className="border border-dead-safe/30 bg-dead-safe/5 p-3">
            <p className="font-mono text-dead-safe text-xs">
              ▸ Caddy automatically provisions and renews SSL certificates. No cron job needed.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function StepVerify() {
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const items = [
    { key: 'health', label: 'Health check returns {"status":"healthy","database":"ok","redis":"ok"}' },
    { key: 'landing', label: 'Landing page loads with stats and ticker tape' },
    { key: 'google', label: 'Google OAuth login works' },
    { key: 'github', label: 'GitHub OAuth login works' },
    { key: 'dashboard', label: 'Dashboard loads with Dead Internet Index gauge' },
    { key: 'scanner', label: 'Scanner works for Hunter tier (scan a URL)' },
    { key: 'history', label: 'Scan history page loads with search/filter' },
    { key: 'analytics', label: 'Analytics page loads with personal metrics' },
    { key: 'stripe', label: 'Stripe checkout redirects correctly' },
    { key: 'webhook', label: 'Stripe webhook endpoint configured and verified' },
    { key: 'ssl', label: 'SSL certificate valid (check browser padlock)' },
    { key: 'dns', label: 'DNS propagated for both @ and www' },
    { key: 'debug', label: 'DEBUG=false in production .env' },
    { key: 'passwords', label: 'Strong passwords set for Postgres and Redis' },
    { key: 'migrations', label: 'Database migrations applied (alembic upgrade head)' },
    { key: 'tokens', label: 'API tokens work for Operator tier' },
    { key: 'batch', label: 'Batch scanning endpoint works: POST /api/v1/scanner/batch' },
  ]

  const completed = Object.values(checks).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-mono text-dead-text text-sm font-bold">Post-Deploy Checklist</h4>
        <span className="font-mono text-xs text-dead-muted">
          {completed}/{items.length} completed
        </span>
      </div>

      <div className="w-full bg-dead-border h-1.5 mb-4">
        <div
          className="h-full bg-dead-safe transition-all duration-300"
          style={{ width: `${(completed / items.length) * 100}%` }}
        />
      </div>

      <div className="space-y-1">
        {items.map(item => (
          <CheckItem key={item.key} checked={!!checks[item.key]} onToggle={() => toggle(item.key)}>
            {item.label}
          </CheckItem>
        ))}
      </div>

      <div className="mt-4">
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">Quick Health Check</h4>
        <CodeBlock code='curl https://deadinternet.report/health' />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">Configure Stripe Webhooks</h4>
        <p className="font-mono text-dead-dim text-xs mb-2">
          In the Stripe Dashboard → Webhooks → Add endpoint:
        </p>
        <div className="border border-dead-border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="font-mono text-dead-accent text-xs shrink-0">URL:</span>
            <span className="font-mono text-dead-dim text-xs">https://deadinternet.report/api/v1/webhooks/stripe</span>
          </div>
          <div>
            <span className="font-mono text-dead-accent text-xs">Events:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {[
                'checkout.session.completed',
                'customer.subscription.updated',
                'customer.subscription.deleted',
              ].map(e => (
                <span key={e} className="font-mono text-[10px] bg-dead-bg border border-dead-border px-2 py-1 text-dead-dim">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">Setup Data Aggregation (cron)</h4>
        <CodeBlock code={`crontab -e
# Run aggregation every hour:
0 * * * * curl -s -X POST http://localhost:8000/api/v1/stats/aggregate \\
  -H "X-Internal-Secret: YOUR_INTERNAL_API_SECRET" > /dev/null`} />
      </div>

      {completed === items.length && (
        <div className="border border-dead-safe bg-dead-safe/5 p-4 text-center mt-6">
          <p className="font-mono text-dead-safe text-sm font-bold">
            ▸ ALL CHECKS PASSED — DEPLOYMENT COMPLETE
          </p>
          <p className="font-mono text-dead-dim text-xs mt-1">
            Your instance of deadinternet.report is live and ready.
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Main Wizard Component ───────────────────────────────────────── */

const STEP_COMPONENTS: Record<string, () => JSX.Element> = {
  prerequisites: StepPrerequisites,
  dns: StepDNS,
  server: StepServer,
  configure: StepConfigure,
  launch: StepLaunch,
  ssl: StepSSL,
  verify: StepVerify,
}

export default function DeployWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const markComplete = useCallback(() => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(currentStep)
      return next
    })
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep])

  const StepContent = STEP_COMPONENTS[STEPS[currentStep].id]

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="border border-dead-border bg-dead-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-dead-muted text-[10px] uppercase tracking-widest">
            DEPLOYMENT PROGRESS
          </span>
          <span className="font-mono text-dead-dim text-xs">
            {completedSteps.size}/{STEPS.length} STEPS
          </span>
        </div>
        <div className="w-full bg-dead-border h-1.5 mb-4">
          <div
            className="h-full bg-dead-accent transition-all duration-500"
            style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Navigation */}
        <div className="hidden md:grid grid-cols-7 gap-1">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep
            const isDone = completedSteps.has(i)

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                className={`text-left p-2 border transition-colors ${
                  isActive
                    ? 'border-dead-accent bg-dead-accent/5'
                    : isDone
                    ? 'border-dead-safe/30 bg-dead-safe/5'
                    : 'border-dead-border hover:border-dead-accent/30'
                }`}
              >
                <span
                  className={`font-mono text-[10px] block ${
                    isActive ? 'text-dead-accent' : isDone ? 'text-dead-safe' : 'text-dead-muted'
                  }`}
                >
                  {isDone ? '✓' : step.icon}
                </span>
                <span
                  className={`font-mono text-[10px] block leading-tight ${
                    isActive ? 'text-dead-text' : 'text-dead-dim'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>

        {/* Mobile step selector */}
        <div className="md:hidden">
          <select
            value={currentStep}
            onChange={(e) => setCurrentStep(Number(e.target.value))}
            className="w-full bg-dead-bg border border-dead-border font-mono text-xs text-dead-text p-2"
          >
            {STEPS.map((step, i) => (
              <option key={step.id} value={i}>
                {completedSteps.has(i) ? '✓' : step.icon} — {step.title}: {step.subtitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step Content */}
      <div className="border border-dead-border bg-dead-surface">
        <div className="border-b border-dead-border px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-dead-accent text-xs">[{STEPS[currentStep].icon}]</span>
              <h3 className="font-mono text-dead-text text-sm font-bold">
                {STEPS[currentStep].title}
              </h3>
              {completedSteps.has(currentStep) && (
                <span className="font-mono text-dead-safe text-[10px] border border-dead-safe/30 px-1.5 py-0.5">
                  DONE
                </span>
              )}
            </div>
            <p className="font-mono text-dead-dim text-xs mt-0.5">{STEPS[currentStep].subtitle}</p>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <StepContent />
        </div>

        {/* Step Navigation Buttons */}
        <div className="border-t border-dead-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`font-mono text-xs px-4 py-2 border transition-colors ${
              currentStep === 0
                ? 'border-dead-border text-dead-muted cursor-not-allowed'
                : 'border-dead-border text-dead-dim hover:text-dead-accent hover:border-dead-accent'
            }`}
          >
            ← PREVIOUS
          </button>

          <div className="flex gap-2">
            {!completedSteps.has(currentStep) && (
              <button
                onClick={markComplete}
                className="font-mono text-xs px-4 py-2 border border-dead-safe text-dead-safe hover:bg-dead-safe/10 transition-colors"
              >
                MARK COMPLETE ✓
              </button>
            )}

            {currentStep < STEPS.length - 1 && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="font-mono text-xs px-4 py-2 bg-dead-accent text-black hover:bg-dead-accent/90 transition-colors"
              >
                NEXT STEP →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
