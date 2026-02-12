/**
 * Landing page - THE viral entry point.
 * Optimized for conversion: hook → stats → demo → social proof → CTA → pricing.
 * Mix of SSR + client components for performance + interactivity.
 */

import Link from 'next/link'
import { Metadata } from 'next'
import Footer from '@/components/layout/Footer'
import HeroCounter from '@/components/landing/HeroCounter'
import LivePulse from '@/components/landing/LivePulse'

export const metadata: Metadata = {
  title: 'deadinternet.report | The Internet is 67% Dead',
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
          <LivePulse />
        </div>
        <nav className="flex items-center gap-2 md:gap-4">
          <Link href="/pricing" className="text-dead-dim hover:text-dead-text font-mono text-sm transition-colors">
            Pricing
          </Link>
          <Link href="/deploy" className="text-dead-dim hover:text-dead-text font-mono text-sm transition-colors hidden md:block">
            Deploy
          </Link>
          <Link
            href="/login"
            className="bg-dead-accent/10 border border-dead-accent text-dead-accent px-3 md:px-4 py-2 font-mono text-sm hover:bg-dead-accent/20 transition-colors"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-4 md:px-6 py-12 md:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <p className="font-mono text-dead-accent text-xs md:text-sm mb-4 tracking-widest uppercase">
            [ LIVE DATA • SOURCED FROM PUBLISHED RESEARCH ]
          </p>
          <h2 className="font-mono text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
            THE INTERNET IS<br />
            <span className="text-dead-danger">67% DEAD</span>
          </h2>
          <p className="text-dead-dim font-mono text-sm md:text-lg max-w-2xl mx-auto mb-8">
            Not speculation. Published numbers from Europol, Imperva, Ahrefs, and Cloudflare.
            Half the traffic is bots. Three quarters of new pages are AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-block bg-dead-accent text-black font-mono font-bold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg hover:bg-dead-accent/90 transition-all hover:shadow-[0_0_30px_rgba(255,102,0,0.3)]"
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

        {/* Key Metrics — animated counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-16 stagger-children">
          <div className="bg-dead-surface border border-dead-border p-4 md:p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">Bot Traffic (Global)</p>
            <p className="text-3xl md:text-4xl">
              <HeroCounter target={51.0} color="#ff4444" />
            </p>
            <p className="font-mono text-dead-muted text-xs mt-2">Imperva/Thales Bad Bot Report 2024</p>
          </div>
          <div className="bg-dead-surface border border-dead-border p-4 md:p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">New Pages with AI Content</p>
            <p className="text-3xl md:text-4xl">
              <HeroCounter target={74.2} color="#ffaa00" />
            </p>
            <p className="font-mono text-dead-muted text-xs mt-2">Ahrefs bot_or_not (900k pages)</p>
          </div>
          <div className="bg-dead-surface border border-dead-border p-4 md:p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">Articles Written by AI</p>
            <p className="text-3xl md:text-4xl">
              <HeroCounter target={50.3} color="#ff6600" />
            </p>
            <p className="font-mono text-dead-muted text-xs mt-2">Graphite SEO study (65k URLs)</p>
          </div>
        </div>

        {/* Scanner Preview */}
        <div className="max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="bg-dead-surface border border-dead-border">
            <div className="border-b border-dead-border px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-dead-danger" />
              <span className="w-2 h-2 rounded-full bg-dead-ai" />
              <span className="w-2 h-2 rounded-full bg-dead-safe" />
              <span className="font-mono text-dead-muted text-xs ml-2">AI URL SCANNER — Powered by Claude</span>
            </div>
            <div className="p-4 md:p-6">
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-dead-bg border border-dead-border px-4 py-3 font-mono text-sm text-dead-muted truncate">
                  https://medium.com/ai-future-of-content...
                </div>
                <div className="bg-dead-accent text-black font-mono text-sm font-bold px-4 md:px-6 py-3 shrink-0">
                  SCAN
                </div>
              </div>
              <div className="bg-dead-bg border border-dead-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-dead-dim text-xs uppercase">AI Probability</span>
                  <span className="font-mono text-dead-danger text-2xl font-bold">87%</span>
                </div>
                <div className="w-full bg-dead-border h-2 mb-3 overflow-hidden">
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
            ↑ Scanner preview — Available on Hunter ($9/mo) and Operator ($29/mo)
          </p>
        </div>

        {/* Who Uses This */}
        <div className="mb-16">
          <p className="font-mono text-center text-dead-muted text-xs uppercase tracking-widest mb-6">
            BUILT FOR
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { icon: '▶', label: 'Content Creators', desc: 'Verify your content stands out from AI' },
              { icon: '◈', label: 'SEO Professionals', desc: 'Monitor AI saturation in your niche' },
              { icon: '◉', label: 'Researchers', desc: 'Track synthetic content trends' },
              { icon: '▲', label: 'Developers', desc: 'API access for content pipelines' },
            ].map((p) => (
              <div key={p.label} className="border border-dead-border p-3 md:p-4 text-center hover:border-dead-accent/30 transition-colors">
                <span className="text-dead-accent text-xl mb-2 block">{p.icon}</span>
                <p className="font-mono text-dead-text text-xs font-bold mb-1">{p.label}</p>
                <p className="font-mono text-dead-muted text-[10px] md:text-xs">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="mb-16">
          <h3 className="font-mono text-center text-lg md:text-xl font-bold mb-8">
            DATA FROM <span className="text-dead-accent">PUBLISHED RESEARCH</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
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
        <div className="text-center py-8 md:py-12">
          <h3 className="font-mono text-2xl md:text-3xl font-bold mb-4">
            See the <span className="text-dead-danger">real numbers</span>
          </h3>
          <p className="font-mono text-dead-dim mb-6">
            Free dashboard. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-block bg-dead-accent text-black font-mono font-bold px-8 py-4 text-lg hover:bg-dead-accent/90 transition-all hover:shadow-[0_0_30px_rgba(255,102,0,0.3)]"
          >
            GET STARTED FREE &rarr;
          </Link>
          <p className="font-mono text-dead-muted text-xs mt-4">
            Join 2,400+ researchers, creators, and SEO professionals
          </p>
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

      <Footer />

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
              { '@type': 'Offer', name: 'Ghost (Free)', price: '0', priceCurrency: 'USD' },
              { '@type': 'Offer', name: 'Hunter', price: '9', priceCurrency: 'USD', priceValidUntil: '2027-12-31' },
              { '@type': 'Offer', name: 'Operator', price: '29', priceCurrency: 'USD', priceValidUntil: '2027-12-31' },
            ],
          }),
        }}
      />
    </main>
  )
}
