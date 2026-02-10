/**
 * Live URL Scanner - main premium feature.
 * Fetches URL, analyzes with Claude AI, shows result.
 * Displays scan usage and links to history.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { verdictColor, verdictLabel } from '@/lib/verdict'
import type { ScanResult, ScanUsage } from '@/types/api'

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function LiveScanner() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<ScanUsage | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load scan usage on mount
  useEffect(() => {
    api.getScanUsage()
      .then(setUsage)
      .catch(() => { /* usage not available for unauthenticated users */ })
  }, [])

  // Cmd+K / Ctrl+K shortcut to focus scanner input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleScan = async () => {
    const trimmed = url.trim()
    if (!trimmed) return

    if (!isValidUrl(trimmed)) {
      setError('Please enter a valid URL starting with http:// or https://')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await api.scanUrl(trimmed)
      setResult(data.result)
      if (data.usage) setUsage(data.usage)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Scan failed'
      setError(message)
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
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Paste any URL to analyze..."
              aria-label="URL to scan for AI-generated content"
              className="w-full bg-dead-bg border border-dead-border px-4 py-3 pr-16 font-mono text-sm text-dead-text placeholder:text-dead-muted focus:border-dead-accent focus:outline-none transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 font-mono text-[10px] text-dead-muted border border-dead-border px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </div>
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
          <div className="mt-4 bg-dead-bg border border-dead-border p-6 text-center" role="status" aria-live="polite">
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
          <div className="mt-4 bg-dead-danger/5 border border-dead-danger/30 p-4" role="alert">
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
            <div
              className="w-full bg-dead-border h-2"
              role="progressbar"
              aria-valuenow={Math.round(result.ai_probability * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`AI probability: ${Math.round(result.ai_probability * 100)}%`}
            >
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
