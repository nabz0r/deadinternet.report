/**
 * Analytics dashboard page.
 * Shows user's personal scan analytics: verdict breakdown,
 * top domains, recent activity trends, and key metrics.
 * Requires hunter tier or above.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import type { UserAnalytics, AnalyticsResponse } from '@/types/api'
import { hasFeature } from '@/lib/constants'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import { verdictColor, verdictLabel } from '@/lib/verdict'

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [globalAnalytics, setGlobalAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tier = session?.user?.tier || 'ghost'

  useEffect(() => {
    if (status !== 'authenticated') return

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [userData, globalData] = await Promise.allSettled([
          api.getUserAnalytics(),
          api.getAnalytics(),
        ])
        if (userData.status === 'fulfilled') setUserAnalytics(userData.value)
        if (globalData.status === 'fulfilled') setGlobalAnalytics(globalData.value)
        if (userData.status === 'rejected' && globalData.status === 'rejected') {
          setError('Failed to load analytics data')
        }
      } catch {
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [status])

  const verdictTotal = useMemo(() => {
    if (!userAnalytics?.verdict_breakdown) return 0
    const vb = userAnalytics.verdict_breakdown
    return vb.ai_generated + vb.mixed + vb.human
  }, [userAnalytics])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dead-bg flex items-center justify-center">
        <div className="font-mono text-dead-accent animate-pulse text-lg">
          [ AUTHENTICATING... ]
        </div>
      </div>
    )
  }

  if (!hasFeature(tier, 'hunter')) {
    return (
      <div className="min-h-screen bg-dead-bg flex flex-col">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="font-mono text-dead-dim text-lg">Analytics requires Hunter tier or above</p>
            <Link
              href="/pricing"
              className="inline-block font-mono text-sm bg-dead-accent text-black px-6 py-2 hover:bg-dead-accent/90 transition-colors"
            >
              UPGRADE NOW
            </Link>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dead-bg flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 flex-1 w-full pb-20 md:pb-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono text-dead-text text-lg">Scan Analytics</h1>
            <p className="font-mono text-dead-muted text-xs mt-1">
              Personal scan insights &amp; global trends
            </p>
          </div>
          <Link
            href="/dashboard"
            className="font-mono text-xs text-dead-dim hover:text-dead-accent transition-colors"
          >
            &larr; Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-dead-surface border border-dead-border p-6 animate-pulse">
                <div className="h-4 bg-dead-border rounded w-1/4 mb-4" />
                <div className="h-8 bg-dead-border rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-dead-surface border border-dead-danger/30 p-6 text-center">
            <p className="font-mono text-dead-danger text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* Row 1: Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total Scans"
                value={userAnalytics?.total_scans ?? 0}
              />
              <MetricCard
                label="This Month"
                value={userAnalytics?.scans_this_month ?? 0}
              />
              <MetricCard
                label="Avg AI Probability"
                value={`${((userAnalytics?.avg_ai_probability ?? 0) * 100).toFixed(1)}%`}
                color={
                  (userAnalytics?.avg_ai_probability ?? 0) > 0.6
                    ? '#ff4444'
                    : (userAnalytics?.avg_ai_probability ?? 0) > 0.3
                    ? '#ffaa00'
                    : '#44ff44'
                }
              />
              <MetricCard
                label="Global DII"
                value={globalAnalytics ? `${(globalAnalytics.dead_internet_index * 100).toFixed(0)}%` : 'N/A'}
                color="#ff6600"
              />
            </div>

            {/* Row 2: Verdict breakdown + top domains */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Verdict Breakdown */}
              <div className="bg-dead-surface border border-dead-border p-4">
                <h2 className="font-mono text-dead-dim text-xs uppercase mb-4">Verdict Breakdown</h2>
                {verdictTotal === 0 ? (
                  <p className="font-mono text-dead-muted text-sm text-center py-8">
                    No scans yet. Start scanning URLs to see analytics.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(['ai_generated', 'mixed', 'human'] as const).map((verdict) => {
                      const count = userAnalytics?.verdict_breakdown?.[verdict] ?? 0
                      const pct = verdictTotal > 0 ? (count / verdictTotal) * 100 : 0
                      return (
                        <div key={verdict}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-mono text-xs ${verdictColor(verdict)}`}>
                              {verdictLabel(verdict)}
                            </span>
                            <span className="font-mono text-xs text-dead-dim">
                              {count} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-dead-bg rounded overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                verdict === 'ai_generated'
                                  ? 'bg-dead-danger'
                                  : verdict === 'mixed'
                                  ? 'bg-dead-ai'
                                  : 'bg-dead-safe'
                              }`}
                              style={{ width: `${pct}%` }}
                              role="progressbar"
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${verdictLabel(verdict)}: ${pct.toFixed(1)}%`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Top Domains */}
              <div className="bg-dead-surface border border-dead-border p-4">
                <h2 className="font-mono text-dead-dim text-xs uppercase mb-4">Your Top Domains</h2>
                {!userAnalytics?.top_domains?.length ? (
                  <p className="font-mono text-dead-muted text-sm text-center py-8">
                    No domain data available yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userAnalytics.top_domains.map((domain) => (
                      <div
                        key={domain.domain}
                        className="flex items-center justify-between py-1.5 border-b border-dead-border/50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-xs text-dead-text truncate block">
                            {domain.domain}
                          </span>
                          <span className="font-mono text-dead-muted" style={{ fontSize: 10 }}>
                            {domain.scan_count} scan{domain.scan_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span
                            className="font-mono text-xs"
                            style={{
                              color: domain.ai_rate > 0.6 ? '#ff4444' : domain.ai_rate > 0.3 ? '#ffaa00' : '#44ff44',
                            }}
                          >
                            {(domain.ai_rate * 100).toFixed(0)}% AI
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Recent activity */}
            <div className="bg-dead-surface border border-dead-border p-4">
              <h2 className="font-mono text-dead-dim text-xs uppercase mb-4">Recent Activity (30 Days)</h2>
              {!userAnalytics?.recent_activity?.length ? (
                <p className="font-mono text-dead-muted text-sm text-center py-8">
                  No recent scan activity.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex gap-1 min-w-fit items-end" style={{ height: 120 }}>
                    {userAnalytics.recent_activity.map((day) => {
                      const maxTotal = Math.max(
                        ...userAnalytics.recent_activity.map((d) => d.total),
                        1
                      )
                      const height = (day.total / maxTotal) * 100
                      const aiPct = day.total > 0 ? (day.ai_generated / day.total) * 100 : 0
                      return (
                        <div
                          key={day.date}
                          className="flex flex-col items-center group relative"
                          style={{ minWidth: 12 }}
                        >
                          <div
                            className="w-2 rounded-t transition-all"
                            style={{
                              height: `${Math.max(height, 4)}%`,
                              background: `linear-gradient(to top, #ff4444 ${aiPct}%, #44ff44 ${aiPct}%)`,
                            }}
                            title={`${day.date}: ${day.total} scans (${day.ai_generated} AI, ${day.mixed} mixed, ${day.human} human)`}
                          />
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-dead-bg border border-dead-border px-2 py-1 z-10 whitespace-nowrap">
                            <span className="font-mono text-dead-text" style={{ fontSize: 10 }}>
                              {day.date}: {day.total} scans
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="font-mono text-dead-muted" style={{ fontSize: 10 }}>
                      {userAnalytics.recent_activity[0]?.date}
                    </span>
                    <span className="font-mono text-dead-muted" style={{ fontSize: 10 }}>
                      {userAnalytics.recent_activity[userAnalytics.recent_activity.length - 1]?.date}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Global scan stats (if available) */}
            {globalAnalytics?.scan_summary && (
              <div className="bg-dead-surface border border-dead-border p-4">
                <h2 className="font-mono text-dead-dim text-xs uppercase mb-4">Global Scan Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-mono text-dead-muted text-xs">Total Platform Scans</p>
                    <p className="font-mono text-dead-text text-lg">
                      {globalAnalytics.scan_summary.total_scans.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-dead-muted text-xs">Global Avg AI %</p>
                    <p className="font-mono text-dead-text text-lg">
                      {(globalAnalytics.scan_summary.avg_ai_probability * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-dead-muted text-xs">AI Detection Rate</p>
                    <p className="font-mono text-dead-danger text-lg">
                      {(globalAnalytics.scan_summary.verdict_rates.ai_generated * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-dead-muted text-xs">Avg Scan Time</p>
                    <p className="font-mono text-dead-text text-lg">
                      {globalAnalytics.scan_summary.avg_scan_duration_ms}ms
                    </p>
                  </div>
                </div>

                {/* Global top domains */}
                {globalAnalytics.top_domains?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dead-border">
                    <h3 className="font-mono text-dead-dim text-xs uppercase mb-3">Top Scanned Domains (Platform-wide)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {globalAnalytics.top_domains.slice(0, 6).map((domain) => (
                        <div
                          key={domain.domain}
                          className="flex items-center justify-between py-1 px-2 bg-dead-bg/50 rounded"
                        >
                          <span className="font-mono text-xs text-dead-text truncate">
                            {domain.domain}
                          </span>
                          <span
                            className="font-mono text-xs ml-2"
                            style={{
                              color: domain.ai_rate > 0.6 ? '#ff4444' : domain.ai_rate > 0.3 ? '#ffaa00' : '#44ff44',
                            }}
                          >
                            {(domain.ai_rate * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic ticker facts */}
            {globalAnalytics?.dynamic_ticker_facts && globalAnalytics.dynamic_ticker_facts.length > 0 && (
              <div className="bg-dead-surface border border-dead-border p-4">
                <h2 className="font-mono text-dead-dim text-xs uppercase mb-3">Live Insights</h2>
                <ul className="space-y-1">
                  {globalAnalytics.dynamic_ticker_facts.map((fact, i) => (
                    <li key={i} className="font-mono text-xs text-dead-text">
                      <span className="text-dead-accent mr-2">&gt;</span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="bg-dead-surface border border-dead-border p-4">
      <p className="font-mono text-dead-muted text-xs uppercase">{label}</p>
      <p
        className="font-mono text-xl mt-1"
        style={{ color: color || '#e0e0e0' }}
      >
        {value}
      </p>
    </div>
  )
}
