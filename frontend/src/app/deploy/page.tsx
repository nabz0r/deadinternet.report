/**
 * Deploy page - Interactive step-by-step deployment wizard.
 * Guides users through VPS setup, configuration, and verification.
 * Bloomberg terminal aesthetic with copy-to-clipboard and secret generation.
 */

import Link from 'next/link'
import { Metadata } from 'next'
import Footer from '@/components/layout/Footer'
import DeployWizard from '@/components/deploy/DeployWizard'

export const metadata: Metadata = {
  title: 'Deploy | deadinternet.report',
  description: 'Step-by-step deployment guide for self-hosting deadinternet.report on your own VPS with Docker, SSL, and all services.',
}

export default function DeployPage() {
  return (
    <main className="min-h-screen bg-dead-bg flex flex-col">
      <header className="border-b border-dead-border px-4 md:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-dead-text">
          deadinternet<span className="text-dead-accent">.report</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/pricing" className="font-mono text-sm text-dead-dim hover:text-dead-text transition-colors">
            Pricing
          </Link>
          <Link
            href="/login"
            className="font-mono text-sm border border-dead-accent text-dead-accent px-3 md:px-4 py-2 hover:bg-dead-accent/10 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 flex-1 w-full">
        <div className="text-center mb-8 md:mb-10">
          <p className="font-mono text-dead-accent text-xs md:text-sm tracking-widest uppercase mb-4">
            [ SELF-HOSTED DEPLOYMENT ]
          </p>
          <h2 className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            DEPLOY YOUR <span className="text-dead-accent">OWN INSTANCE</span>
          </h2>
          <p className="font-mono text-dead-dim text-xs md:text-sm max-w-2xl mx-auto mb-6">
            Follow these steps to deploy deadinternet.report on your VPS.
            Docker Compose handles the full stack — 5 services, one command.
          </p>
          <div className="flex items-center justify-center gap-4 font-mono text-[10px]">
            <span className="text-dead-muted">
              <span className="text-dead-safe">~60 min</span> total setup
            </span>
            <span className="text-dead-border">|</span>
            <span className="text-dead-muted">
              <span className="text-dead-safe">7</span> steps
            </span>
            <span className="text-dead-border">|</span>
            <span className="text-dead-muted">
              <span className="text-dead-safe">MIT</span> Licensed
            </span>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="border border-dead-border bg-dead-surface p-4 md:p-6 mb-6">
          <h3 className="font-mono text-dead-muted text-[10px] uppercase tracking-widest mb-4">
            ARCHITECTURE
          </h3>

          {/* Request flow */}
          <div className="hidden md:block mb-4">
            <div className="flex items-center justify-center gap-0 font-mono text-[10px] text-dead-dim">
              <span className="border border-dead-border px-3 py-1.5 bg-dead-bg text-dead-text">Browser</span>
              <span className="text-dead-accent px-2">→ HTTPS →</span>
              <span className="border border-dead-accent px-3 py-1.5 bg-dead-accent/5 text-dead-accent">Nginx :80/443</span>
              <span className="text-dead-muted px-2">→</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-dead-muted">/</span>
                  <span className="text-dead-accent">→</span>
                  <span className="border border-dead-border px-3 py-1.5 bg-dead-bg text-dead-safe">Next.js :3000</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-dead-muted">/api</span>
                  <span className="text-dead-accent">→</span>
                  <span className="border border-dead-border px-3 py-1.5 bg-dead-bg text-dead-ai">FastAPI :8000</span>
                </div>
              </div>
              <span className="text-dead-muted px-2">→</span>
              <div className="flex flex-col gap-1">
                <span className="border border-dead-border px-3 py-1.5 bg-dead-bg text-dead-dim">PostgreSQL :5432</span>
                <span className="border border-dead-border px-3 py-1.5 bg-dead-bg text-dead-dim">Redis :6379</span>
              </div>
            </div>
          </div>

          {/* Mobile: simple grid */}
          <div className="md:hidden grid grid-cols-2 gap-2 mb-4">
            {[
              { name: 'Nginx', port: ':80/443', color: 'text-dead-accent', desc: 'Reverse Proxy' },
              { name: 'Next.js 14', port: ':3000', color: 'text-dead-safe', desc: 'Frontend' },
              { name: 'FastAPI', port: ':8000', color: 'text-dead-ai', desc: 'Backend API' },
              { name: 'PostgreSQL', port: ':5432', color: 'text-dead-dim', desc: 'Database' },
              { name: 'Redis', port: ':6379', color: 'text-dead-dim', desc: 'Cache' },
              { name: 'Claude AI', port: 'API', color: 'text-dead-danger', desc: 'Scanner' },
            ].map(s => (
              <div key={s.name} className="border border-dead-border p-2 text-center">
                <p className={`font-mono ${s.color} text-xs font-bold`}>{s.name}</p>
                <p className="font-mono text-dead-muted text-[9px]">{s.desc} {s.port}</p>
              </div>
            ))}
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'Docker Compose',
              'SSL/TLS',
              'OAuth 2.0',
              'Stripe Billing',
              'AI Scanner',
              'Rate Limiting',
              'Alembic Migrations',
              'Redis Caching',
            ].map(f => (
              <span key={f} className="font-mono text-[10px] text-dead-dim border border-dead-border px-2 py-1">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div className="border border-dead-accent/30 bg-dead-accent/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-dead-accent text-xs font-bold">QUICK START</span>
            <span className="font-mono text-dead-muted text-[10px]">— for experienced users</span>
          </div>
          <pre className="font-mono text-xs text-dead-dim leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
{`git clone https://github.com/nabz0r/deadinternet.report.git
cd deadinternet.report
cp .env.example .env    # Edit with your secrets
docker compose up -d
docker compose exec backend alembic upgrade head`}
          </pre>
          <p className="font-mono text-dead-muted text-[10px] mt-2">
            Need more detail? Follow the step-by-step wizard below.
          </p>
        </div>

        <DeployWizard />
      </section>

      <Footer />
    </main>
  )
}
