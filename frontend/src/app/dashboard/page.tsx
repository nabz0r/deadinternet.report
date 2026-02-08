/**
 * Dashboard page - main authenticated view.
 * Shows Dead Internet Index, platform stats, timeline, and scanner.
 * Fetches data from the backend API on load.
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { api } from '@/lib/api-client'
import { hasFeature } from '@/lib/constants'
import DeadIndexGauge from '@/components/dashboard/DeadIndexGauge'
import PlatformBreakdown from '@/components/dashboard/PlatformBreakdown'
import TimelineChart from '@/components/dashboard/TimelineChart'
import TickerTape from '@/components/dashboard/TickerTape'
import LiveScanner from '@/components/dashboard/LiveScanner'
import StatCard from '@/components/dashboard/StatCard'
import Header from '@/components/layout/Header'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Auth loading state
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
      <div className="min-h-screen bg-dead-bg flex items-center justify-center">
        <div className="font-mono text-dead-accent animate-pulse text-lg">
          [ LOADING DEAD INTERNET DATA... ]
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dead-bg">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Row 1: Dead Index + Key Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <DeadIndexGauge value={stats?.dead_internet_index || 0} />
          </div>
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
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

        {/* Row 3: Scanner (premium) */}
        {hasFeature(userTier, 'hunter') ? (
          <LiveScanner />
        ) : (
          <div className="bg-dead-surface border border-dead-border p-8 text-center">
            <p className="font-mono text-dead-dim mb-2">
              [ SCANNER LOCKED ]
            </p>
            <p className="font-mono text-dead-accent">
              Upgrade to Hunter ($9/mo) to scan URLs with Claude AI
            </p>
          </div>
        )}
      </main>

      <TickerTape facts={stats?.ticker_facts || []} />
    </div>
  )
}
