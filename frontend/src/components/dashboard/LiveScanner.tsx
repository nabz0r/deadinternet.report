/**
 * Live URL Scanner - main premium feature.
 * Fetches URL, analyzes with Claude AI, shows result.
 * Displays scan usage and links to history.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'

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
    case 'human': return 'LIKELY HUMAN'
    case 'mixed': return 'MIXED SIGNALS'
    case 'ai_generated': return 'AI GENERATED'
    default: return verdict?.toUpperCase() || 'UNKNOWN'
  }
}

export default function LiveScanner() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)

  // Load scan usage on mount
  useEffect(() => {
    api.getScanUsage()
      .then(setUsage)
      .catch(() => {})
  }, [])

  const handleScan = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await api.scanUrl(url.trim())
      setResult(data.result)
      if (data.usage) setUsage(data.usage)
    } catch (err: any) {
      setError(err.message || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-dead-surface border border-dead-border">
      {/* Title bar */}
      <div className="border-b border-dead-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-dead-danger" />
          <span className="w-2 h-2 rounded-full bg-dead-ai" />
          <span className="w-2 h-2 rounded-full bg-dead-safe" />
          <span className="font-mono text-dead-muted text-xs ml-2">AI URL SCANNER</span>
        </div>
        <div className="flex items-center gap-4">
          {usage && (
            <span className="font-mono text-xs text-dead-muted">
              {usage.remaining}/{usage.limit} scans left today
            </span>
          )}
          <Link
            href="/dashboard/history"
            className="font-mono text-xs text-dead-accent hover:underline"
          >
            View History →
          </Link>
        </div>
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="Paste any URL to analyze..."
            className="flex-1 bg-dead-bg border border-dead-border px-4 py-3 font-mono text-sm text-dead-text placeholder:text-dead-muted focus:border-dead-accent focus:outline-none transition-colors"
          />
          <button
            onClick={handleScan}
            disabled={loading || !url.trim() || (usage?.remaining === 0)}
            className="bg-dead-accent text-black font-mono text-sm font-bold px-6 py-3 hover:bg-dead-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'SCANNING...' : 'SCAN'}
          </button>
        </div>

        {/* Rate limit warning */}
        {usage?.remaining === 0 && (
          <p className="font-mono text-dead-danger text-xs mt-2">
            Daily scan limit reached. <Link href="/pricing" className="text-dead-accent hover:underline">Upgrade for more →</Link>
          </p>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-4 bg-dead-bg border border-dead-border p-6 text-center">
            <div className="inline-block w-6 h-6 border-2 border-dead-accent border-t-transparent rounded-full animate-spin mb-2" />
            <p className="font-mono text-dead-accent text-sm animate-pulse">
              Fetching and analyzing content...
            </p>
            <p className="font-mono text-dead-muted text-xs mt-1">
              This usually takes 3-5 seconds
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-dead-danger/5 border border-dead-danger/30 p-4">
            <p className="font-mono text-dead-danger text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-4 bg-dead-bg border border-dead-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-dead-dim text-xs uppercase">AI Probability</span>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-dead-text">
                  {Math.round(result.ai_probability * 100)}%
                </span>
                <span className={`font-mono text-xs font-bold ml-3 ${verdictColor(result.verdict)}`}>
                  {verdictLabel(result.verdict)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-dead-border h-2">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${result.ai_probability * 100}%`,
                  background: result.ai_probability > 0.6
                    ? 'linear-gradient(to right, #ffaa00, #ff2222)'
                    : result.ai_probability > 0.3
                    ? 'linear-gradient(to right, #00cc66, #ffaa00)'
                    : '#00cc66',
                }}
              />
            </div>

            {/* Analysis */}
            <p className="font-mono text-dead-dim text-xs leading-relaxed">
              {result.analysis}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between pt-2 border-t border-dead-border">
              <span className="font-mono text-dead-muted text-xs">
                Scanned in {result.scan_duration_ms}ms • {result.model_used}
              </span>
              <a
                href={result.url || url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-dead-accent text-xs hover:underline"
              >
                Open URL ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
