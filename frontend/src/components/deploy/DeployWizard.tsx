'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

/* ─── Types ─────────────────────────────────────────────────────── */

interface Step {
  id: string
  title: string
  subtitle: string
  icon: string
  minutes: number
}

const STEPS: Step[] = [
  { id: 'prerequisites', title: 'PREREQUISITES', subtitle: 'VPS & System Requirements', icon: '01', minutes: 5 },
  { id: 'dns', title: 'DNS SETUP', subtitle: 'Point Domain to Server', icon: '02', minutes: 10 },
  { id: 'server', title: 'SERVER SETUP', subtitle: 'Install Docker & Dependencies', icon: '03', minutes: 10 },
  { id: 'configure', title: 'CONFIGURE', subtitle: 'Environment & Secrets', icon: '04', minutes: 15 },
  { id: 'launch', title: 'LAUNCH', subtitle: 'Start All Services', icon: '05', minutes: 5 },
  { id: 'ssl', title: 'SSL SETUP', subtitle: 'HTTPS with Let\'s Encrypt', icon: '06', minutes: 10 },
  { id: 'verify', title: 'VERIFY', subtitle: 'Post-Deploy Checklist', icon: '07', minutes: 5 },
]

const STORAGE_KEY = 'dir_deploy_state'

/* ─── Persistence ────────────────────────────────────────────────── */

interface PersistedState {
  completedSteps: number[]
  domain: string
  vpsIp: string
}

function loadState(): PersistedState {
  if (typeof window === 'undefined') return { completedSteps: [], domain: '', vpsIp: '' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistedState
  } catch { /* ignore */ }
  return { completedSteps: [], domain: '', vpsIp: '' }
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

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
      className="absolute top-2 right-2 font-mono text-[10px] px-2 py-1 border border-dead-border text-dead-muted hover:text-dead-accent hover:border-dead-accent transition-colors z-10"
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
      <pre className="p-3 pr-20 overflow-x-auto text-sm font-mono text-dead-dim leading-relaxed whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  )
}

/* ─── Helper: Callout Boxes ──────────────────────────────────────── */

function Callout({ type, children }: { type: 'warning' | 'tip' | 'info'; children: React.ReactNode }) {
  const styles = {
    warning: { border: 'border-dead-danger/40', bg: 'bg-dead-danger/5', icon: '▲', color: 'text-dead-danger' },
    tip:     { border: 'border-dead-safe/40', bg: 'bg-dead-safe/5', icon: '▸', color: 'text-dead-safe' },
    info:    { border: 'border-dead-accent/40', bg: 'bg-dead-accent/5', icon: '◈', color: 'text-dead-accent' },
  }
  const s = styles[type]

  return (
    <div className={`border ${s.border} ${s.bg} p-3 my-3`}>
      <div className="flex items-start gap-2">
        <span className={`${s.color} text-xs shrink-0 mt-0.5`}>{s.icon}</span>
        <div className={`font-mono text-xs ${s.color}`}>{children}</div>
      </div>
    </div>
  )
}

/* ─── Helper: Collapsible Section ────────────────────────────────── */

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-dead-border my-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-dead-accent/5 transition-colors"
      >
        <span className="font-mono text-dead-text text-xs font-bold">{title}</span>
        <span className="font-mono text-dead-muted text-xs">{open ? '[ − ]' : '[ + ]'}</span>
      </button>
      {open && (
        <div className="border-t border-dead-border px-4 py-3">
          {children}
        </div>
      )}
    </div>
  )
}

/* ─── Helper: Secret Generator ───────────────────────────────────── */

interface SecretGeneratorProps {
  label: string
  type: 'base64' | 'hex'
  value: string
  onChange: (val: string) => void
}

function SecretGenerator({ label, type, value, onChange }: SecretGeneratorProps) {
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    if (type === 'hex') {
      onChange(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
    } else {
      onChange(btoa(String.fromCharCode.apply(null, Array.from(bytes))))
    }
  }, [type, onChange])

  const copy = useCallback(() => {
    if (value) {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [value])

  return (
    <div className="flex items-center gap-2 my-2 flex-wrap sm:flex-nowrap">
      <span className="font-mono text-dead-dim text-xs w-full sm:w-44 shrink-0">{label}:</span>
      <div className="flex-1 min-w-0 bg-dead-bg border border-dead-border px-3 py-2 font-mono text-xs text-dead-safe min-h-[34px] truncate w-full">
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
          {copied ? 'COPIED' : 'COPY'}
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
        className={`w-4 h-4 border shrink-0 flex items-center justify-center text-[10px] transition-colors ${
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

/* ─── Domain replacement helper ───────────────────────────────────── */

function useDomain(domain: string, vpsIp: string) {
  const d = domain || 'deadinternet.report'
  const ip = vpsIp || 'YOUR_VPS_IP'
  return { d, ip }
}

/* ─── Step Content Renderers ──────────────────────────────────────── */

function StepPrerequisites({ vpsIp, onVpsIpChange }: { vpsIp: string; onVpsIpChange: (v: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-3">Choose a VPS Provider</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'Hetzner', plan: 'CX22 (4GB / 2 vCPU)', price: '~€8/mo', tag: 'BEST VALUE', color: 'text-dead-safe' },
            { name: 'DigitalOcean', plan: 'Basic (2GB / 1 vCPU)', price: '~$12/mo', tag: '', color: '' },
            { name: 'Contabo', plan: 'VPS S (4GB / 4 vCPU)', price: '~€6/mo', tag: 'BUDGET', color: 'text-dead-ai' },
            { name: 'OVH', plan: 'Starter (2GB / 1 vCPU)', price: '~€4/mo', tag: '', color: '' },
          ].map(p => (
            <div
              key={p.name}
              className="border border-dead-border p-4 hover:border-dead-accent/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-dead-text text-sm font-bold">{p.name}</span>
                {p.tag && (
                  <span className={`font-mono text-[10px] ${p.color || 'text-dead-accent'} border border-current/30 px-1.5 py-0.5`}>
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
            { label: 'RAM', value: '2 GB', note: '4 GB recommended' },
            { label: 'CPU', value: '1 vCPU', note: '2 vCPU recommended' },
            { label: 'Disk', value: '20 GB', note: 'SSD preferred' },
            { label: 'OS', value: 'Ubuntu 24.04', note: 'LTS' },
          ].map(r => (
            <div key={r.label} className="border border-dead-border p-3 text-center">
              <p className="font-mono text-dead-muted text-[10px] uppercase tracking-wider">{r.label}</p>
              <p className="font-mono text-dead-text text-sm font-bold">{r.value}</p>
              <p className="font-mono text-dead-muted text-[9px] mt-0.5">{r.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">Your VPS IP Address</h4>
        <p className="font-mono text-dead-dim text-xs mb-2">
          Enter your VPS IP to auto-fill it into all commands below:
        </p>
        <input
          type="text"
          value={vpsIp}
          onChange={(e) => onVpsIpChange(e.target.value)}
          placeholder="e.g. 203.0.113.42"
          className="w-full sm:w-64 bg-dead-bg border border-dead-border px-3 py-2 font-mono text-sm text-dead-text placeholder:text-dead-muted focus:border-dead-accent focus:outline-none transition-colors"
        />
      </div>

      <Callout type="info">
        After provisioning your VPS, make sure you can SSH in as root before proceeding.
      </Callout>
    </div>
  )
}

function StepDNS({ domain, onDomainChange, vpsIp }: { domain: string; onDomainChange: (v: string) => void; vpsIp: string }) {
  const { d, ip } = useDomain(domain, vpsIp)

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">Your Domain</h4>
        <p className="font-mono text-dead-dim text-xs mb-2">
          Enter your domain to auto-fill all commands and URLs:
        </p>
        <input
          type="text"
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          placeholder="e.g. deadinternet.report"
          className="w-full sm:w-80 bg-dead-bg border border-dead-border px-3 py-2 font-mono text-sm text-dead-text placeholder:text-dead-muted focus:border-dead-accent focus:outline-none transition-colors"
        />
      </div>

      <p className="font-mono text-dead-dim text-xs">
        In your DNS provider&apos;s management panel, add these records:
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
              <td className="px-4 py-2 text-dead-safe">{ip}</td>
              <td className="px-4 py-2">600</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-dead-accent">A</td>
              <td className="px-4 py-2">www</td>
              <td className="px-4 py-2 text-dead-safe">{ip}</td>
              <td className="px-4 py-2">600</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="font-mono text-dead-dim text-xs">
        Wait 5-30 minutes for propagation, then verify:
      </p>

      <CodeBlock code={`dig ${d} +short\n# Should return: ${ip}`} />

      <Callout type="tip">
        Use a lower TTL (300-600) during initial setup so DNS changes propagate faster.
        You can increase it to 3600+ after everything is stable.
      </Callout>

      <Collapsible title="Troubleshooting DNS">
        <div className="space-y-2 font-mono text-xs text-dead-dim">
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">dig returns old IP:</strong> Wait longer, or flush local DNS cache with <code className="text-dead-safe">sudo dscacheutil -flushcache</code> (macOS) or <code className="text-dead-safe">sudo resolvectl flush-caches</code> (Linux).</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">dig returns nothing:</strong> Check that records are saved correctly in your DNS provider panel. Some providers need a trailing dot for the root domain.</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Using Cloudflare?</strong> Set proxy status to &quot;DNS only&quot; (gray cloud) during setup. You can enable the proxy later.</p>
        </div>
      </Collapsible>
    </div>
  )
}

function StepServer({ vpsIp }: { vpsIp: string }) {
  const { ip } = useDomain('', vpsIp)

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">1. Connect to your VPS</h4>
        <CodeBlock code={`ssh root@${ip}`} />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">2. Update system &amp; install Docker</h4>
        <CodeBlock code={`# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose v2
apt install -y docker-compose-v2

# Verify installation
docker --version && docker compose version`} />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Create deploy user (recommended)</h4>
        <CodeBlock code={`adduser deploy
usermod -aG docker deploy
su - deploy`} />
        <Callout type="tip">
          Running as a non-root user is a security best practice. The deploy user has Docker access but limited system privileges.
        </Callout>
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">4. Configure firewall</h4>
        <CodeBlock code={`# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable`} />
      </div>

      <Collapsible title="Troubleshooting Server Setup">
        <div className="space-y-2 font-mono text-xs text-dead-dim">
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Docker install fails:</strong> Check you&apos;re on a supported OS (Ubuntu 22.04/24.04, Debian 12). Try <code className="text-dead-safe">apt install docker.io</code> as a fallback.</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Permission denied on docker:</strong> Log out and back in after adding user to docker group, or run <code className="text-dead-safe">newgrp docker</code>.</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">SSH connection timeout:</strong> Check your VPS provider&apos;s firewall/security group allows port 22.</p>
        </div>
      </Collapsible>
    </div>
  )
}

function StepConfigure({ domain, secrets, onSecretChange }: {
  domain: string
  secrets: Record<string, string>
  onSecretChange: (key: string, val: string) => void
}) {
  const d = domain || 'deadinternet.report'

  const generateAll = useCallback(() => {
    const gen = (type: 'base64' | 'hex') => {
      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      if (type === 'hex') return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      return btoa(String.fromCharCode.apply(null, Array.from(bytes)))
    }
    onSecretChange('NEXTAUTH_SECRET', gen('base64'))
    onSecretChange('JWT_SECRET', gen('hex'))
    onSecretChange('INTERNAL_API_SECRET', gen('hex'))
    onSecretChange('POSTGRES_PASSWORD', gen('hex'))
    onSecretChange('REDIS_PASSWORD', gen('hex'))
  }, [onSecretChange])

  const downloadEnv = useCallback(() => {
    const content = `# ─── Secrets (REQUIRED) ───
NEXTAUTH_SECRET=${secrets.NEXTAUTH_SECRET || '<generate-above>'}
JWT_SECRET=${secrets.JWT_SECRET || '<generate-above>'}
INTERNAL_API_SECRET=${secrets.INTERNAL_API_SECRET || '<generate-above>'}

# ─── Production URLs ───
NEXTAUTH_URL=https://${d}
NEXT_PUBLIC_API_URL=https://${d}

# ─── Database ───
POSTGRES_PASSWORD=${secrets.POSTGRES_PASSWORD || '<generate-above>'}

# ─── Redis ───
REDIS_PASSWORD=${secrets.REDIS_PASSWORD || '<generate-above>'}

# ─── Security ───
DEBUG=false

# ─── OAuth (from provider dashboards) ───
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ─── Stripe ───
STRIPE_SECRET_KEY=sk_live_
STRIPE_WEBHOOK_SECRET=whsec_
STRIPE_PRICE_HUNTER=price_
STRIPE_PRICE_OPERATOR=price_

# ─── Anthropic ───
ANTHROPIC_API_KEY=sk-ant-
`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env'
    a.click()
    URL.revokeObjectURL(url)
  }, [secrets, d])

  const allGenerated = !!(secrets.NEXTAUTH_SECRET && secrets.JWT_SECRET && secrets.INTERNAL_API_SECRET && secrets.POSTGRES_PASSWORD && secrets.REDIS_PASSWORD)

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">1. Clone repository</h4>
        <CodeBlock code={`git clone https://github.com/nabz0r/deadinternet.report.git
cd deadinternet.report
cp .env.example .env`} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-mono text-dead-text text-sm font-bold">2. Generate secrets</h4>
          <button
            onClick={generateAll}
            className="font-mono text-[10px] px-4 py-2 bg-dead-accent text-black hover:bg-dead-accent/90 transition-colors"
          >
            GENERATE ALL
          </button>
        </div>
        <Callout type="warning">
          These are MANDATORY — the application will refuse to start without them.
        </Callout>
        <div className="bg-dead-surface border border-dead-border p-4 space-y-1">
          <SecretGenerator label="NEXTAUTH_SECRET" type="base64" value={secrets.NEXTAUTH_SECRET || ''} onChange={(v) => onSecretChange('NEXTAUTH_SECRET', v)} />
          <SecretGenerator label="JWT_SECRET" type="hex" value={secrets.JWT_SECRET || ''} onChange={(v) => onSecretChange('JWT_SECRET', v)} />
          <SecretGenerator label="INTERNAL_API_SECRET" type="hex" value={secrets.INTERNAL_API_SECRET || ''} onChange={(v) => onSecretChange('INTERNAL_API_SECRET', v)} />
          <SecretGenerator label="POSTGRES_PASSWORD" type="hex" value={secrets.POSTGRES_PASSWORD || ''} onChange={(v) => onSecretChange('POSTGRES_PASSWORD', v)} />
          <SecretGenerator label="REDIS_PASSWORD" type="hex" value={secrets.REDIS_PASSWORD || ''} onChange={(v) => onSecretChange('REDIS_PASSWORD', v)} />
        </div>

        {allGenerated && (
          <button
            onClick={downloadEnv}
            className="mt-3 font-mono text-xs px-4 py-2 border border-dead-safe text-dead-safe hover:bg-dead-safe/10 transition-colors w-full sm:w-auto"
          >
            DOWNLOAD .env FILE
          </button>
        )}
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Edit .env file</h4>
        <p className="font-mono text-dead-dim text-xs mb-2">
          {allGenerated
            ? 'Upload the downloaded .env file to your server, or paste each secret manually:'
            : 'Paste your generated secrets and configure production settings:'
          }
        </p>
        <CodeBlock language="env" code={`# ─── Secrets (REQUIRED) ───
NEXTAUTH_SECRET=${secrets.NEXTAUTH_SECRET || '<paste-from-above>'}
JWT_SECRET=${secrets.JWT_SECRET || '<paste-from-above>'}
INTERNAL_API_SECRET=${secrets.INTERNAL_API_SECRET || '<paste-from-above>'}

# ─── Production URLs ───
NEXTAUTH_URL=https://${d}
NEXT_PUBLIC_API_URL=https://${d}

# ─── Database ───
POSTGRES_PASSWORD=${secrets.POSTGRES_PASSWORD || '<paste-from-above>'}

# ─── Redis ───
REDIS_PASSWORD=${secrets.REDIS_PASSWORD || '<paste-from-above>'}

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

      <Collapsible title="OAuth Callback URLs">
        <div className="space-y-3 font-mono text-xs">
          <div>
            <p className="text-dead-text font-bold mb-1">Google Cloud Console:</p>
            <div className="bg-dead-bg border border-dead-border px-3 py-2 text-dead-safe">
              https://{d}/api/auth/callback/google
            </div>
          </div>
          <div>
            <p className="text-dead-text font-bold mb-1">GitHub Developer Settings:</p>
            <div className="bg-dead-bg border border-dead-border px-3 py-2 text-dead-safe">
              https://{d}/api/auth/callback/github
            </div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Optional Tuning">
        <CodeBlock language="env" code={`# IP rate limiting (on top of nginx 30r/s)
IP_RATE_LIMIT=60           # max requests per window
IP_RATE_WINDOW=60          # window in seconds

# Cache TTLs
STATS_CACHE_TTL=3600       # dashboard stats (1 hour)
SCAN_CACHE_TTL=86400       # scan results (24 hours)

# Scan rate limits per tier (per day)
SCAN_RATE_FREE=0
SCAN_RATE_HUNTER=10
SCAN_RATE_OPERATOR=1000`} />
      </Collapsible>
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

        <div className="bg-dead-bg border border-dead-border p-3 font-mono text-xs text-dead-dim overflow-x-auto">
          <p className="text-dead-muted mb-2">Expected output:</p>
          <table className="w-full">
            <thead>
              <tr className="text-dead-muted">
                <td className="pr-4 pb-1">NAME</td>
                <td className="pr-4 pb-1">STATUS</td>
                <td className="pb-1">PORTS</td>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'backend', status: 'Up (healthy)', ports: '', statusColor: 'text-dead-safe' },
                { name: 'db', status: 'Up (healthy)', ports: '5432/tcp', statusColor: 'text-dead-safe' },
                { name: 'frontend', status: 'Up', ports: '3000/tcp', statusColor: 'text-dead-dim' },
                { name: 'nginx', status: 'Up', ports: '0.0.0.0:80→80, 0.0.0.0:443→443', statusColor: 'text-dead-dim' },
                { name: 'redis', status: 'Up (healthy)', ports: '6379/tcp', statusColor: 'text-dead-safe' },
              ].map(s => (
                <tr key={s.name}>
                  <td className="pr-4 py-0.5 text-dead-text">{s.name}</td>
                  <td className={`pr-4 py-0.5 ${s.statusColor}`}>{s.status}</td>
                  <td className="py-0.5">{s.ports}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Run database migrations</h4>
        <CodeBlock code="docker compose exec backend alembic upgrade head" />
        <Callout type="info">
          Migrations create all tables, indexes, and constraints. Safe to run multiple times — Alembic tracks applied migrations.
        </Callout>
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">4. Check logs</h4>
        <CodeBlock code={`# Follow all logs
docker compose logs -f

# Check specific service
docker compose logs -f backend`} />
      </div>

      <Collapsible title="Troubleshooting Launch">
        <div className="space-y-2 font-mono text-xs text-dead-dim">
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Backend crashes immediately:</strong> Check <code className="text-dead-safe">JWT_SECRET</code> and <code className="text-dead-safe">INTERNAL_API_SECRET</code> are set and not weak values like &quot;change-me&quot;.</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Frontend can&apos;t reach backend:</strong> Verify <code className="text-dead-safe">API_URL=http://backend:8000</code> in docker-compose (internal Docker network).</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Database connection refused:</strong> Wait 10-15 seconds for PostgreSQL to initialize, then retry.</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Redis auth error:</strong> Verify <code className="text-dead-safe">REDIS_PASSWORD</code> in .env matches the docker-compose default.</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Port 80 already in use:</strong> Stop Apache/Nginx if running natively: <code className="text-dead-safe">systemctl stop apache2 nginx</code></p>
        </div>
      </Collapsible>
    </div>
  )
}

function StepSSL({ domain }: { domain: string }) {
  const [method, setMethod] = useState<'certbot' | 'caddy'>('certbot')
  const d = domain || 'deadinternet.report'

  return (
    <div className="space-y-4">
      <p className="font-mono text-dead-dim text-xs">Choose your SSL method:</p>
      <div className="flex gap-2">
        <button
          onClick={() => setMethod('certbot')}
          className={`font-mono text-xs px-4 py-2 border transition-colors ${
            method === 'certbot'
              ? 'border-dead-accent text-dead-accent bg-dead-accent/10'
              : 'border-dead-border text-dead-muted hover:text-dead-accent'
          }`}
        >
          CERTBOT + NGINX
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

      <div className="flex gap-3 text-[10px] font-mono">
        <span className="text-dead-muted">
          {method === 'certbot'
            ? '▸ More control, manual renewal via cron'
            : '▸ Zero-config SSL, automatic renewal, simpler setup'
          }
        </span>
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
  -d ${d} \\
  -d www.${d}

# Copy certificates
mkdir -p nginx/certs
cp /etc/letsencrypt/live/${d}/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/${d}/privkey.pem nginx/certs/`} />
          </div>

          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">2. Restart nginx with SSL</h4>
            <CodeBlock code="docker compose up -d --build nginx" />
          </div>

          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">3. Auto-renewal (cron)</h4>
            <CodeBlock code={`crontab -e
# Add this line:
0 3 * * 1 certbot renew --quiet && cp /etc/letsencrypt/live/${d}/*.pem /path/to/deadinternet.report/nginx/certs/ && docker compose restart nginx`} />
          </div>

          <Callout type="warning">
            Port 80 must be open and not used by another service when certbot runs. The cron job renews weekly at 3 AM.
          </Callout>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="font-mono text-dead-text text-sm font-bold mb-2">1. Replace nginx service in docker-compose.yml</h4>
            <p className="font-mono text-dead-dim text-xs mb-2">
              Remove the nginx service and add Caddy instead:
            </p>
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
            <CodeBlock language="caddyfile" code={`${d} {
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

          <Callout type="tip">
            Caddy automatically provisions and renews SSL certificates via Let&apos;s Encrypt. No cron job, no manual renewal.
          </Callout>
        </div>
      )}

      <Collapsible title="Troubleshooting SSL">
        <div className="space-y-2 font-mono text-xs text-dead-dim">
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Certbot &quot;connection refused&quot;:</strong> Make sure port 80 is open (<code className="text-dead-safe">ufw allow 80</code>) and no other service is using it.</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Caddy &quot;too many redirects&quot;:</strong> If using Cloudflare proxy, set SSL/TLS mode to &quot;Full (strict)&quot;.</p>
          <p><span className="text-dead-accent">▸</span> <strong className="text-dead-text">Certificate not trusted:</strong> Ensure DNS is pointing to your server (not still at the old host).</p>
        </div>
      </Collapsible>
    </div>
  )
}

function StepVerify({ domain }: { domain: string }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const d = domain || 'deadinternet.report'

  const toggle = (key: string) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const categories = [
    {
      title: 'Core Infrastructure',
      items: [
        { key: 'health', label: `Health check returns ok: curl https://${d}/health` },
        { key: 'ssl', label: 'SSL certificate valid (browser padlock shows secure)' },
        { key: 'dns', label: 'DNS propagated for both @ and www records' },
        { key: 'debug', label: 'DEBUG=false in production .env' },
        { key: 'passwords', label: 'Strong passwords set for Postgres and Redis' },
        { key: 'migrations', label: 'Database migrations applied (alembic upgrade head)' },
      ],
    },
    {
      title: 'Authentication & Payments',
      items: [
        { key: 'google', label: 'Google OAuth login works' },
        { key: 'github', label: 'GitHub OAuth login works' },
        { key: 'stripe', label: 'Stripe checkout redirects correctly' },
        { key: 'webhook', label: 'Stripe webhook endpoint configured and verified' },
      ],
    },
    {
      title: 'Application Features',
      items: [
        { key: 'landing', label: 'Landing page loads with stats and ticker tape' },
        { key: 'dashboard', label: 'Dashboard loads with Dead Internet Index gauge' },
        { key: 'scanner', label: 'Scanner works for Hunter tier (scan a URL)' },
        { key: 'history', label: 'Scan history page loads with search/filter' },
        { key: 'analytics', label: 'Analytics page loads with personal metrics' },
        { key: 'tokens', label: 'API tokens work for Operator tier (create, list, revoke)' },
        { key: 'batch', label: 'Batch scanning works: POST /api/v1/scanner/batch' },
      ],
    },
  ]

  const allItems = categories.flatMap(c => c.items)
  const completed = Object.values(checks).filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-dead-text text-sm font-bold">Post-Deploy Checklist</h4>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs ${completed === allItems.length ? 'text-dead-safe' : 'text-dead-muted'}`}>
            {completed}/{allItems.length}
          </span>
          {completed > 0 && completed < allItems.length && (
            <button
              onClick={() => setChecks({})}
              className="font-mono text-[10px] text-dead-muted hover:text-dead-accent transition-colors"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      <div className="w-full bg-dead-border h-2">
        <div
          className={`h-full transition-all duration-500 ${
            completed === allItems.length ? 'bg-dead-safe' : 'bg-dead-accent'
          }`}
          style={{ width: `${(completed / allItems.length) * 100}%` }}
        />
      </div>

      {categories.map(cat => (
        <div key={cat.title}>
          <h5 className="font-mono text-dead-muted text-[10px] uppercase tracking-widest mb-2">
            {cat.title}
          </h5>
          <div className="space-y-1">
            {cat.items.map(item => (
              <CheckItem key={item.key} checked={!!checks[item.key]} onToggle={() => toggle(item.key)}>
                {item.label}
              </CheckItem>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4">
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">Quick Health Check</h4>
        <CodeBlock code={`curl -s https://${d}/health | python3 -m json.tool`} />
      </div>

      <div>
        <h4 className="font-mono text-dead-text text-sm font-bold mb-2">Configure Stripe Webhooks</h4>
        <p className="font-mono text-dead-dim text-xs mb-2">
          In the Stripe Dashboard → Webhooks → Add endpoint:
        </p>
        <div className="border border-dead-border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="font-mono text-dead-accent text-xs shrink-0">URL:</span>
            <code className="font-mono text-dead-safe text-xs">https://{d}/api/v1/webhooks/stripe</code>
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

      {completed === allItems.length && (
        <div className="border-2 border-dead-safe bg-dead-safe/5 p-6 text-center animate-fade-in">
          <p className="font-mono text-dead-safe text-lg font-bold mb-1">
            ALL CHECKS PASSED
          </p>
          <p className="font-mono text-dead-safe text-sm mb-2">
            DEPLOYMENT COMPLETE
          </p>
          <p className="font-mono text-dead-dim text-xs">
            Your instance of deadinternet.report is live at https://{d}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Main Wizard Component ───────────────────────────────────────── */

export default function DeployWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [domain, setDomain] = useState('')
  const [vpsIp, setVpsIp] = useState('')
  const [secrets, setSecrets] = useState<Record<string, string>>({})
  const [transitioning, setTransitioning] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Load persisted state on mount
  useEffect(() => {
    const saved = loadState()
    setCompletedSteps(new Set(saved.completedSteps))
    setDomain(saved.domain)
    setVpsIp(saved.vpsIp)
  }, [])

  // Persist state on change
  useEffect(() => {
    saveState({
      completedSteps: Array.from(completedSteps),
      domain,
      vpsIp,
    })
  }, [completedSteps, domain, vpsIp])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' && currentStep < STEPS.length - 1) {
        goToStep(currentStep + 1)
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        goToStep(currentStep - 1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const goToStep = useCallback((step: number) => {
    setTransitioning(true)
    setTimeout(() => {
      setCurrentStep(step)
      setTransitioning(false)
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }, [])

  const markComplete = useCallback(() => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(currentStep)
      return next
    })
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1)
    }
  }, [currentStep, goToStep])

  const resetProgress = useCallback(() => {
    setCompletedSteps(new Set())
    setSecrets({})
    setCurrentStep(0)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  const onSecretChange = useCallback((key: string, val: string) => {
    setSecrets(prev => ({ ...prev, [key]: val }))
  }, [])

  const totalMinutes = STEPS.reduce((sum, s) => sum + s.minutes, 0)

  // Render step content with props
  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'prerequisites':
        return <StepPrerequisites vpsIp={vpsIp} onVpsIpChange={setVpsIp} />
      case 'dns':
        return <StepDNS domain={domain} onDomainChange={setDomain} vpsIp={vpsIp} />
      case 'server':
        return <StepServer vpsIp={vpsIp} />
      case 'configure':
        return <StepConfigure domain={domain} secrets={secrets} onSecretChange={onSecretChange} />
      case 'launch':
        return <StepLaunch />
      case 'ssl':
        return <StepSSL domain={domain} />
      case 'verify':
        return <StepVerify domain={domain} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="border border-dead-border bg-dead-surface p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-dead-muted text-[10px] uppercase tracking-widest">
              DEPLOYMENT PROGRESS
            </span>
            <span className="font-mono text-dead-dim text-[10px]">
              ~{totalMinutes} min total
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-dead-dim text-xs">
              {completedSteps.size}/{STEPS.length} STEPS
            </span>
            {completedSteps.size > 0 && (
              <button
                onClick={resetProgress}
                className="font-mono text-[10px] text-dead-muted hover:text-dead-danger transition-colors"
              >
                RESET
              </button>
            )}
          </div>
        </div>
        <div className="w-full bg-dead-border h-1.5 mb-4">
          <div
            className={`h-full transition-all duration-500 ${
              completedSteps.size === STEPS.length ? 'bg-dead-safe' : 'bg-dead-accent'
            }`}
            style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Desktop Step Navigation */}
        <div className="hidden md:grid grid-cols-7 gap-1">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep
            const isDone = completedSteps.has(i)

            return (
              <button
                key={step.id}
                onClick={() => goToStep(i)}
                className={`text-left p-2 border transition-all duration-200 ${
                  isActive
                    ? 'border-dead-accent bg-dead-accent/5'
                    : isDone
                    ? 'border-dead-safe/30 bg-dead-safe/5'
                    : 'border-dead-border hover:border-dead-accent/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] ${
                      isActive ? 'text-dead-accent' : isDone ? 'text-dead-safe' : 'text-dead-muted'
                    }`}
                  >
                    {isDone ? '✓' : step.icon}
                  </span>
                  <span className="font-mono text-dead-muted text-[9px]">{step.minutes}m</span>
                </div>
                <span
                  className={`font-mono text-[10px] block leading-tight mt-0.5 ${
                    isActive ? 'text-dead-text' : 'text-dead-dim'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>

        {/* Mobile Step Selector */}
        <div className="md:hidden">
          <select
            value={currentStep}
            onChange={(e) => goToStep(Number(e.target.value))}
            className="w-full bg-dead-bg border border-dead-border font-mono text-xs text-dead-text p-2"
          >
            {STEPS.map((step, i) => (
              <option key={step.id} value={i}>
                {completedSteps.has(i) ? '✓' : step.icon} — {step.title}: {step.subtitle} ({step.minutes}m)
              </option>
            ))}
          </select>
        </div>

        {/* Keyboard hint */}
        <p className="hidden md:block font-mono text-dead-muted text-[9px] mt-2 text-right">
          Use ← → arrow keys to navigate
        </p>
      </div>

      {/* Step Content */}
      <div ref={contentRef} className="border border-dead-border bg-dead-surface scroll-mt-4">
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
            <p className="font-mono text-dead-dim text-xs mt-0.5">
              {STEPS[currentStep].subtitle}
              <span className="text-dead-muted ml-2">~{STEPS[currentStep].minutes} min</span>
            </p>
          </div>
        </div>

        <div
          className={`p-4 md:p-6 transition-opacity duration-150 ${
            transitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {renderStep()}
        </div>

        {/* Step Navigation Buttons */}
        <div className="border-t border-dead-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => goToStep(Math.max(0, currentStep - 1))}
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
            {!completedSteps.has(currentStep) ? (
              <button
                onClick={markComplete}
                className="font-mono text-xs px-4 py-2 border border-dead-safe text-dead-safe hover:bg-dead-safe/10 transition-colors"
              >
                MARK COMPLETE ✓
              </button>
            ) : currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => {
                  setCompletedSteps(prev => {
                    const next = new Set(prev)
                    next.delete(currentStep)
                    return next
                  })
                }}
                className="font-mono text-[10px] px-3 py-2 border border-dead-border text-dead-muted hover:text-dead-accent hover:border-dead-accent transition-colors"
              >
                UNDO
              </button>
            ) : null}

            {currentStep < STEPS.length - 1 && (
              <button
                onClick={() => goToStep(currentStep + 1)}
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
