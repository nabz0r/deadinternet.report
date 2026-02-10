/**
 * Scan History page - shows past scans for premium users.
 * Paginated, filterable by verdict, searchable by URL.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { verdictColor, verdictLabel } from '@/lib/verdict'
import Header from '@/components/layout/Header'

interface Scan {
  id: string
  url: string
  ai_probability: number
  verdict: string
  analysis: string
  created_at: string
}

interface HistoryResponse {
  scans: Scan[]
  total: number
}

type SortField = 'created_at' | 'ai_probability'
type SortDir = 'asc' | 'desc'
type VerdictFilter = 'all' | 'human' | 'mixed' | 'ai_generated'

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const [scans, setScans] = useState<Scan[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const limit = 20

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    api.getScanHistory(limit, offset)
      .then((data: HistoryResponse) => {
        setScans(data.scans || [])
        setTotal(data.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status, offset])

  // Client-side filter + sort on the current page of results
  const filteredScans = useMemo(() => {
    let result = [...scans]

    // Filter by verdict
    if (verdictFilter !== 'all') {
      result = result.filter(s => s.verdict === verdictFilter)
    }

    // Filter by search term (URL match)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s => s.url.toLowerCase().includes(q))
    }

    // Sort
    result.sort((a, b) => {
      const valA = sortField === 'created_at' ? new Date(a.created_at).getTime() : a.ai_probability
      const valB = sortField === 'created_at' ? new Date(b.created_at).getTime() : b.ai_probability
      return sortDir === 'desc' ? valB - valA : valA - valB
    })

    return result
  }, [scans, verdictFilter, search, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

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

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL..."
            aria-label="Search scans by URL"
            className="flex-1 bg-dead-bg border border-dead-border px-3 py-2 font-mono text-sm text-dead-text placeholder:text-dead-muted focus:border-dead-accent focus:outline-none transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value as VerdictFilter)}
              aria-label="Filter by verdict"
              className="bg-dead-bg border border-dead-border px-3 py-2 font-mono text-xs text-dead-text focus:border-dead-accent focus:outline-none"
            >
              <option value="all">All Verdicts</option>
              <option value="human">Human</option>
              <option value="mixed">Mixed</option>
              <option value="ai_generated">AI Generated</option>
            </select>
            <button
              onClick={() => toggleSort('created_at')}
              className={`border border-dead-border px-3 py-2 font-mono text-xs transition-colors ${sortField === 'created_at' ? 'text-dead-accent border-dead-accent/50' : 'text-dead-dim hover:text-dead-accent'}`}
            >
              Date {sortField === 'created_at' && (sortDir === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => toggleSort('ai_probability')}
              className={`border border-dead-border px-3 py-2 font-mono text-xs transition-colors ${sortField === 'ai_probability' ? 'text-dead-accent border-dead-accent/50' : 'text-dead-dim hover:text-dead-accent'}`}
            >
              AI % {sortField === 'ai_probability' && (sortDir === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-dead-surface border border-dead-border p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="bg-dead-surface border border-dead-border p-8 text-center">
            <p className="font-mono text-dead-dim mb-2">
              {scans.length === 0 ? 'No scans yet' : 'No scans match your filters'}
            </p>
            {scans.length === 0 ? (
              <Link href="/dashboard" className="font-mono text-sm text-dead-accent hover:underline">
                Go scan a URL →
              </Link>
            ) : (
              <button
                onClick={() => { setSearch(''); setVerdictFilter('all') }}
                className="font-mono text-sm text-dead-accent hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {filteredScans.map((scan) => (
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
