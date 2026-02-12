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
          <p className="font-mono text-dead-dim text-xs md:text-sm max-w-2xl mx-auto">
            Follow these steps to deploy deadinternet.report on your VPS.
            Docker Compose handles the full stack — Next.js, FastAPI, PostgreSQL, Redis, and nginx.
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="border border-dead-border bg-dead-surface p-4 mb-6">
          <h3 className="font-mono text-dead-muted text-[10px] uppercase tracking-widest mb-3">
            STACK OVERVIEW
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { name: 'Next.js 14', role: 'Frontend', port: ':3000' },
              { name: 'FastAPI', role: 'Backend', port: ':8000' },
              { name: 'PostgreSQL', role: 'Database', port: ':5432' },
              { name: 'Redis', role: 'Cache', port: ':6379' },
              { name: 'Nginx', role: 'Reverse Proxy', port: ':80/443' },
            ].map(s => (
              <div key={s.name} className="border border-dead-border p-3 text-center">
                <p className="font-mono text-dead-accent text-xs font-bold">{s.name}</p>
                <p className="font-mono text-dead-dim text-[10px]">{s.role}</p>
                <p className="font-mono text-dead-muted text-[10px]">{s.port}</p>
              </div>
            ))}
          </div>
        </div>

        <DeployWizard />
      </section>

      <Footer />
    </main>
  )
}
