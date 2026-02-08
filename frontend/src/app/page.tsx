/**
 * Landing page / Public dashboard.
 * Shows the Dead Internet Index and key stats.
 * No auth required - this is the viral entry point.
 */

import Link from 'next/link'

// Static data for SSR (no API call needed for landing)
const HERO_STATS = {
  botTraffic: 51.0,
  aiContent: 74.2,
  aiArticles: 50.3,
  deadIndex: 67,
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dead-bg">
      {/* Header */}
      <header className="border-b border-dead-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-dead-accent font-mono font-bold text-lg">&#9608;</span>
          <h1 className="font-mono font-bold text-dead-text">
            deadinternet<span className="text-dead-accent">.report</span>
          </h1>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/pricing" className="text-dead-dim hover:text-dead-text font-mono text-sm transition-colors">
            Pricing
          </Link>
          <Link
            href="/login"
            className="bg-dead-accent/10 border border-dead-accent text-dead-accent px-4 py-2 font-mono text-sm hover:bg-dead-accent/20 transition-colors"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-mono text-dead-accent text-sm mb-4 tracking-widest uppercase">
            [ SYSTEM STATUS ]
          </p>
          <h2 className="font-mono text-5xl md:text-7xl font-bold mb-6">
            THE INTERNET IS<br />
            <span className="text-dead-danger">{HERO_STATS.deadIndex}% DEAD</span>
          </h2>
          <p className="text-dead-dim font-mono text-lg max-w-2xl mx-auto">
            Real-time data from Europol, Imperva, Ahrefs, and Cloudflare.
            This is not speculation. These are published numbers.
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <div className="bg-dead-surface border border-dead-border p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">Bot Traffic (Global)</p>
            <p className="font-mono text-4xl font-bold text-dead-bot">{HERO_STATS.botTraffic}%</p>
            <p className="font-mono text-dead-dim text-xs mt-2">Source: Imperva/Thales 2024</p>
          </div>
          <div className="bg-dead-surface border border-dead-border p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">New Pages with AI Content</p>
            <p className="font-mono text-4xl font-bold text-dead-ai">{HERO_STATS.aiContent}%</p>
            <p className="font-mono text-dead-dim text-xs mt-2">Source: Ahrefs (900k pages)</p>
          </div>
          <div className="bg-dead-surface border border-dead-border p-6 glow-hover">
            <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">Articles Written by AI</p>
            <p className="font-mono text-4xl font-bold text-dead-accent">{HERO_STATS.aiArticles}%</p>
            <p className="font-mono text-dead-dim text-xs mt-2">Source: Graphite (65k URLs)</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-block bg-dead-accent text-black font-mono font-bold px-8 py-4 text-lg hover:bg-dead-accent/90 transition-colors"
          >
            SCAN A URL WITH AI &rarr;
          </Link>
          <p className="font-mono text-dead-dim text-sm mt-4">
            Free dashboard &bull; Premium scanner powered by Claude AI
          </p>
        </div>
      </section>

      {/* Ticker */}
      <div className="border-t border-dead-border overflow-hidden bg-dead-surface/50">
        <div className="animate-ticker whitespace-nowrap py-3 font-mono text-sm text-dead-dim">
          &#9608; 75.85% of Super Bowl LVIII Twitter traffic was bots
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          OpenAI GPT bots = 13% of total web traffic
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          Europol: up to 90% synthetic content by 2026
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          74.2% of new web pages contain AI content
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          51% of all internet traffic is now bots
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          Internet traffic grew 19% in 2025, mostly bots
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dead-border px-6 py-8 text-center">
        <p className="font-mono text-dead-dim text-xs">
          All data sourced from published research &bull;
          <a href="https://github.com/nabz0r/deadinternet.report" className="text-dead-accent hover:underline ml-1">
            Open Source on GitHub
          </a>
        </p>
      </footer>
    </main>
  )
}
