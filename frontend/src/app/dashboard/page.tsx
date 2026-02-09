/**
 * Dashboard page - main authenticated view.
 * Shows Dead Internet Index, platform stats, timeline, scanner.
 * Fetches data from backend API. Shows upgrade CTA for ghost tier.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
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
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import { SkeletonGauge, SkeletonCard, SkeletonChart } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

const LOADING_TIMEOUT_MS = 15000

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          toast('Dashboard data is taking longer than expected. Please refresh.', 'error')
        }
        return false
      })
    }, LOADING_TIMEOUT_MS)

    api.getStats()
      .then(setStats)
      .catch(() => toast('Failed to load dashboard data', 'error'))
      .finally(() => {
        setLoading(false)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      })

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Show success toast after Stripe redirect
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast('Upgrade successful! Your scanner is now active.', 'success')
      window.history.replaceState({}, '', '/dashboard')
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

  return (
    <div className="min-h-screen bg-dead-bg flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 flex-1 w-full pb-20 md:pb-6">
        <ErrorBoundary>
        {/* Row 1: Dead Index + Key Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 stagger-children">
          <div className="lg:col-span-1">
            {loading ? (
              <SkeletonGauge />
            ) : (
              <DeadIndexGauge value={stats?.dead_internet_index || 0} />
            )}
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Row 2: Timeline + Platform Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 animate-fade-in animate-fade-in-delay-3">
            {loading ? (
              <SkeletonChart />
            ) : (
              <TimelineChart data={stats?.timeline || []} />
            )}
          </div>
          <div className="lg:col-span-1 animate-fade-in animate-fade-in-delay-4">
            {loading ? (
              <SkeletonCard className="h-full" />
            ) : (
              <PlatformBreakdown platforms={stats?.platforms || {}} />
            )}
          </div>
        </div>

        {/* Row 3: Scanner (premium) or Upgrade CTA */}
        <div className="animate-fade-in animate-fade-in-delay-5">
          {hasFeature(userTier, 'hunter') ? (
            <LiveScanner />
          ) : (
            <UpgradeBanner />
          )}
        </div>

        {/* Quick links for premium users */}
        {hasFeature(userTier, 'hunter') && (
          <div className="flex items-center justify-between bg-dead-surface border border-dead-border px-4 py-3">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/history"
                className="font-mono text-xs text-dead-dim hover:text-dead-accent transition-colors"
              >
                ◈ Scan History
              </Link>
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-dead-dim hover:text-dead-accent transition-colors"
              >
                ◉ API Docs
              </a>
            </div>
            <span className="font-mono text-dead-muted text-xs hidden sm:inline">
              Last updated: {stats?.last_updated || 'loading'}
            </span>
          </div>
        )}
        </ErrorBoundary>
      </main>

      <TickerTape facts={stats?.ticker_facts || []} />
      <Footer />
      <MobileNav />
    </div>
  )
}
