/**
 * Dashboard page - main authenticated view.
 * Shows Dead Internet Index, platform stats, timeline, scanner.
 * Fetches data from backend API. Shows upgrade CTA for ghost tier.
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { hasFeature } from '@/lib/constants'
import DeadIndexGauge from '@/components/dashboard/DeadIndexGauge'
import PlatformBreakdown from '@/components/dashboard/PlatformBreakdown'
import TimelineChart from '@/components/dashboard/TimelineChart'
import TickerTape from '@/components/dashboard/TickerTape'
import LiveScanner from '@/components/dashboard/LiveScanner'
import StatCard from '@/components/dashboard/StatCard'
import UpgradeBanner from '@/components/dashboard/UpgradeBanner'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeToast, setShowUpgradeToast] = useState(false)

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Show success toast after Stripe redirect
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShowUpgradeToast(true)
      window.history.replaceState({}, '', '/dashboard')
      setTimeout(() => setShowUpgradeToast(false), 5000)
    }
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dead-bg flex items-center justify-center">
        <div className="font-mono text-dead-accent animate-pulse text-lg">
          [ AUTHENTICATING... ]
        </div>
      </div>
    )
  }

  const userTier = session?.user?.tier || 'ghost'

  if (loading) {
    return (
      <div className="min-h-screen bg-dead-bg">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-dead-accent border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-mono text-dead-accent text-sm animate-pulse">
              [ LOADING DEAD INTERNET DATA... ]
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dead-bg flex flex-col">
      <Header />

      {/* Upgrade success toast */}
      {showUpgradeToast && (
        <div className="bg-dead-safe/10 border-b border-dead-safe px-6 py-3 text-center">
          <p className="font-mono text-dead-safe text-sm">
            ✓ Upgrade successful! Your scanner is now active.
          </p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 flex-1 w-full">
        {/* Row 1: Dead Index + Key Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <DeadIndexGauge value={stats?.dead_internet_index || 0} />
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Bot Traffic"
              value={stats?.global?.bot_traffic_pct || 0}
              unit="%"
              source="Imperva/Thales"
              color="#ff4444"
            />
            <StatCard
              label="AI New Pages"
              value={stats?.global?.ai_content_new_pages_pct || 0}
              unit="%"
              source="Ahrefs"
              color="#ffaa00"
            />
            <StatCard
              label="AI Articles"
              value={stats?.global?.ai_articles_pct || 0}
              unit="%"
              source="Graphite"
              color="#ff6600"
            />
          </div>
        </div>

        {/* Row 2: Timeline + Platform Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TimelineChart data={stats?.timeline || []} />
          </div>
          <div className="lg:col-span-1">
            <PlatformBreakdown platforms={stats?.platforms || {}} />
          </div>
        </div>

        {/* Row 3: Scanner (premium) or Upgrade CTA */}
        {hasFeature(userTier, 'hunter') ? (
          <LiveScanner />
        ) : (
          <UpgradeBanner />
        )}

        {/* Quick links for premium users */}
        {hasFeature(userTier, 'hunter') && (
          <div className="flex items-center justify-between bg-dead-surface border border-dead-border px-4 py-3">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/history"
                className="font-mono text-xs text-dead-dim hover:text-dead-accent transition-colors"
              >
                📋 Scan History
              </Link>
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-dead-dim hover:text-dead-accent transition-colors"
              >
                📖 API Docs
              </a>
            </div>
            <span className="font-mono text-dead-muted text-xs">
              Last updated: {stats?.last_updated || 'loading'}
            </span>
          </div>
        )}
      </main>

      <TickerTape facts={stats?.ticker_facts || []} />
      <Footer />
    </div>
  )
}
