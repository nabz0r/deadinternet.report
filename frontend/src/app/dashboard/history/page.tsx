/**
 * Scan History page - shows past scans for premium users.
 * Paginated, sorted by date, with verdict color coding.
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import Header from '@/components/layout/Header'

interface Scan {
  id: string
  url: string
  ai_probability: number
  verdict: string
  analysis: string
  created_at: string
}

function verdictColor(verdict: string): string {
  switch (verdict) {
    case 'human': return 'text-dead-safe'
    case 'mixed': return 'text-dead-ai'
    case 'ai_generated': return 'text-dead-danger'
    default: return 'text-dead-dim'
  }
}

function verdictLabel(verdict: string): string {
  switch (verdict) {
    case 'human': return 'HUMAN'
    case 'mixed': return 'MIXED'
    case 'ai_generated': return 'AI GENERATED'
    default: return verdict.toUpperCase()
  }
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const [scans, setScans] = useState<Scan[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    api.getScanHistory(limit, offset)
      .then((data: any) => {
        setScans(data.scans || [])
        setTotal(data.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status, offset])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dead-bg flex items-center justify-center">
        <p className="font-mono text-dead-accent animate-pulse">[ AUTHENTICATING... ]</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dead-bg">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-mono text-xl font-bold">
              SCAN <span className="text-dead-accent">HISTORY</span>
            </h1>
            <p className="font-mono text-dead-muted text-xs mt-1">
              {total} total scan{total !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="font-mono text-sm text-dead-dim hover:text-dead-accent transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-dead-surface border border-dead-border p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="bg-dead-surface border border-dead-border p-8 text-center">
            <p className="font-mono text-dead-dim mb-2">No scans yet</p>
            <Link href="/dashboard" className="font-mono text-sm text-dead-accent hover:underline">
              Go scan a URL →
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-dead-surface border border-dead-border p-4 hover:border-dead-accent/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <a
                      href={scan.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-dead-text hover:text-dead-accent truncate max-w-lg transition-colors"
                    >
                      {scan.url}
                    </a>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-mono text-xs font-bold ${verdictColor(scan.verdict)}`}>
                        {verdictLabel(scan.verdict)}
                      </span>
                      <span className="font-mono text-lg font-bold text-dead-text">
                        {Math.round(scan.ai_probability * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-dead-muted text-xs truncate max-w-md">
                      {scan.analysis?.slice(0, 120)}...
                    </p>
                    <span className="font-mono text-dead-muted text-xs shrink-0 ml-4">
                      {new Date(scan.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="font-mono text-sm text-dead-dim hover:text-dead-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span className="font-mono text-dead-muted text-xs">
                  {offset + 1}–{Math.min(offset + limit, total)} of {total}
                </span>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="font-mono text-sm text-dead-dim hover:text-dead-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
