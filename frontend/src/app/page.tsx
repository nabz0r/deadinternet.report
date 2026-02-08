/**
 * Landing page - THE viral entry point.
 * Optimized for conversion: hook → stats → demo → social proof → CTA → pricing.
 * Fully SSR, no auth required.
 */

import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'deadinternet.report | The Internet is 67% Dead',
}

const HERO_STATS = {
  botTraffic: 51.0,
  aiContent: 74.2,
  aiArticles: 50.3,
  deadIndex: 67,
}

const SOURCES = [
  { name: 'Europol', year: '2024', finding: '90% synthetic content by 2026' },
  { name: 'Imperva/Thales', year: '2024', finding: '51% of internet traffic = bots' },
  { name: 'Ahrefs', year: '2025', finding: '74.2% of new pages contain AI content' },
  { name: 'Cloudflare', year: '2024', finding: 'GPT bots = 13% of web traffic' },
  { name: 'Graphite', year: '2025', finding: '50.3% of articles AI-written' },
  { name: 'Nature', year: '2024', finding: '59% of X/Twitter accounts are bots' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dead-bg">
      {/* Header */}
      <header className="border-b border-dead-border px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-mono font-bold text-dead-text">
            deadinternet<span className="text-dead-accent">.report</span>
          </h1>
        </div>
        <nav className="flex items-center gap-2 md:gap-4">
          <Link href="/pricing" className="text-dead-dim hover:text-dead-text font-mono text-sm transition-colors">
            Pricing
          </Link>
          <Link
            href="/login"
            className="bg-dead-accent/10 border border-dead-accent text-dead-accent px-3 md:px-4 py-2 font-mono text-sm hover:bg-dead-accent/20 transition-colors"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero - The Hook */}
      <section className="px-4 md:px-6 py-12 md:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-mono text-dead-accent text-xs md:text-sm mb-4 tracking-widest uppercase animate-pulse">
            [ LIVE DATA • UPDATED DAILY ]
          </p>
          <h2 className="font-mono text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
            THE INTERNET IS<br />
            <span className="text-dead-danger">{HERO_STATS.deadIndex}% DEAD</span>
          </h2>
          <p className="text-dead-dim font-mono text-sm md:text-lg max-w-2xl mx-auto mb-8">
            Not speculation. Published numbers from Europol, Imperva, Ahrefs, and Cloudflare.
            Half the traffic is bots. Three quarters of new pages are AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-block bg-dead-accent text-black font-mono font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg hover:bg-dead-accent/90 transition-colors"
            >
              OPEN DASHBOARD &rarr;
            </Link>
            <Link
              href="/pricing"
              className="inline-block border border-dead-border text-dead-dim font-mono px-6 md:px-8 py-3 md:py-4 text-base md:text-lg hover:border-dead-accent hover:text-dead-accent transition-colors"
            >
              VIEW PRICING
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-16">
          <div className="bg-dead-surface border border-dead-border p-4 md:p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">Bot Traffic (Global)</p>
            <p className="font-mono text-3xl md:text-4xl font-bold text-dead-bot">{HERO_STATS.botTraffic}%</p>
            <p className="font-mono text-dead-muted text-xs mt-2">Imperva/Thales Bad Bot Report 2024</p>
          </div>
          <div className="bg-dead-surface border border-dead-border p-4 md:p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">New Pages with AI Content</p>
            <p className="font-mono text-3xl md:text-4xl font-bold text-dead-ai">{HERO_STATS.aiContent}%</p>
            <p className="font-mono text-dead-muted text-xs mt-2">Ahrefs bot_or_not (900k pages)</p>
          </div>
          <div className="bg-dead-surface border border-dead-border p-4 md:p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">Articles Written by AI</p>
            <p className="font-mono text-3xl md:text-4xl font-bold text-dead-accent">{HERO_STATS.aiArticles}%</p>
            <p className="font-mono text-dead-muted text-xs mt-2">Graphite SEO study (65k URLs)</p>
          </div>
        </div>

        {/* Scanner Preview / Feature Highlight */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-dead-surface border border-dead-border">
            <div className="border-b border-dead-border px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-dead-danger" />
              <span className="w-2 h-2 rounded-full bg-dead-ai" />
              <span className="w-2 h-2 rounded-full bg-dead-safe" />
              <span className="font-mono text-dead-muted text-xs ml-2">AI URL SCANNER — Powered by Claude</span>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-dead-bg border border-dead-border px-4 py-3 font-mono text-sm text-dead-muted">
                  https://medium.com/ai-future-of-content...
                </div>
                <div className="bg-dead-accent text-black font-mono text-sm font-bold px-6 py-3">
                  SCAN
                </div>
              </div>
              <div className="bg-dead-bg border border-dead-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-dead-dim text-xs uppercase">AI Probability</span>
                  <span className="font-mono text-dead-danger text-2xl font-bold">87%</span>
                </div>
                <div className="w-full bg-dead-border h-2 mb-3">
                  <div className="h-full bg-gradient-to-r from-dead-ai to-dead-danger" style={{ width: '87%' }} />
                </div>
                <p className="font-mono text-dead-dim text-xs">
                  ▸ High AI probability. Generic transitional phrases, formulaic structure, no personal voice.
                  Typical LLM content optimization pattern detected.
                </p>
              </div>
            </div>
          </div>
          <p className="text-center font-mono text-dead-muted text-xs mt-3">
            ↑ Scanner preview — Available on Hunter ($9/mo) and Operator ($29/mo) tiers
          </p>
        </div>

        {/* Sources - Social Proof */}
        <div className="mb-16">
          <h3 className="font-mono text-center text-lg md:text-xl font-bold mb-8">
            DATA FROM <span className="text-dead-accent">PUBLISHED RESEARCH</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SOURCES.map((s) => (
              <div key={s.name} className="border border-dead-border px-4 py-3 hover:border-dead-accent/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-dead-text text-sm font-bold">{s.name}</span>
                  <span className="font-mono text-dead-muted text-xs">{s.year}</span>
                </div>
                <p className="font-mono text-dead-dim text-xs">{s.finding}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Pricing */}
        <div className="max-w-3xl mx-auto mb-16">
          <h3 className="font-mono text-center text-lg md:text-xl font-bold mb-8">
            SIMPLE <span className="text-dead-accent">PRICING</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-dead-surface border border-dead-border p-4 text-center">
              <p className="font-mono text-dead-dim text-xs uppercase mb-1">Ghost</p>
              <p className="font-mono text-2xl font-bold mb-1">$0</p>
              <p className="font-mono text-dead-muted text-xs">Dashboard + Stats</p>
            </div>
            <div className="bg-dead-surface border border-dead-accent p-4 text-center relative">
              <div className="absolute -top-px left-0 right-0 h-0.5 bg-dead-accent" />
              <p className="font-mono text-dead-accent text-xs uppercase mb-1">Hunter</p>
              <p className="font-mono text-2xl font-bold mb-1">$9<span className="text-dead-dim text-sm">/mo</span></p>
              <p className="font-mono text-dead-muted text-xs">10 scans/day + alerts</p>
            </div>
            <div className="bg-dead-surface border border-dead-border p-4 text-center">
              <p className="font-mono text-dead-danger text-xs uppercase mb-1">Operator</p>
              <p className="font-mono text-2xl font-bold mb-1">$29<span className="text-dead-dim text-sm">/mo</span></p>
              <p className="font-mono text-dead-muted text-xs">Unlimited + API</p>
            </div>
          </div>
          <div className="text-center mt-4">
            <Link
              href="/pricing"
              className="font-mono text-dead-accent text-sm hover:underline"
            >
              Compare all features →
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center py-8">
          <h3 className="font-mono text-2xl md:text-3xl font-bold mb-4">
            See the <span className="text-dead-danger">real numbers</span>
          </h3>
          <p className="font-mono text-dead-dim mb-6">
            Free dashboard. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-block bg-dead-accent text-black font-mono font-bold px-8 py-4 text-lg hover:bg-dead-accent/90 transition-colors"
          >
            GET STARTED FREE &rarr;
          </Link>
        </div>
      </section>

      {/* Ticker */}
      <div className="border-t border-dead-border overflow-hidden bg-dead-surface/50">
        <div className="animate-ticker whitespace-nowrap py-3 font-mono text-sm text-dead-dim">
          █ 75.85% of Super Bowl LVIII Twitter traffic was bots
          &nbsp;&nbsp;•&nbsp;&nbsp;
          OpenAI GPT bots = 13% of total web traffic
          &nbsp;&nbsp;•&nbsp;&nbsp;
          Europol: up to 90% synthetic content by 2026
          &nbsp;&nbsp;•&nbsp;&nbsp;
          74.2% of new web pages contain AI content
          &nbsp;&nbsp;•&nbsp;&nbsp;
          51% of all internet traffic is now bots
          &nbsp;&nbsp;•&nbsp;&nbsp;
          Dead Internet Theory: more real every day
          &nbsp;&nbsp;•&nbsp;&nbsp;
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dead-border px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-dead-dim text-xs">
              © {new Date().getFullYear()} deadinternet.report
            </span>
            <a
              href="https://github.com/nabz0r/deadinternet.report"
              className="font-mono text-dead-accent text-xs hover:underline"
            >
              GitHub
            </a>
          </div>
          <p className="font-mono text-dead-muted text-xs">
            All statistics sourced from published research. Open source. MIT Licensed.
          </p>
        </div>
      </footer>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'deadinternet.report',
            description: 'Real-time dashboard tracking AI-generated content and bot traffic across the internet.',
            url: 'https://deadinternet.report',
            applicationCategory: 'AnalyticsApplication',
            operatingSystem: 'Web',
            offers: [
              {
                '@type': 'Offer',
                name: 'Ghost (Free)',
                price: '0',
                priceCurrency: 'USD',
              },
              {
                '@type': 'Offer',
                name: 'Hunter',
                price: '9',
                priceCurrency: 'USD',
                priceValidUntil: '2027-12-31',
              },
              {
                '@type': 'Offer',
                name: 'Operator',
                price: '29',
                priceCurrency: 'USD',
                priceValidUntil: '2027-12-31',
              },
            ],
          }),
        }}
      />
    </main>
  )
}
