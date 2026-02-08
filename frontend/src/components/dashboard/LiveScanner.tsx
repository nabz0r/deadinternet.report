/**
 * Live Scanner - URL AI content analyzer.
 * Premium feature (Hunter+). Sends URL to backend -> Claude API.
 * Uses Next.js API proxy for auth (no token handling client-side).
 */

'use client'

import { useState } from 'react'
import { api } from '@/lib/api-client'
import { getVerdictColor, getVerdictLabel } from '@/lib/utils'

export default function LiveScanner() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleScan = async () => {
    if (!url || scanning) return
    setScanning(true)
    setError('')
    setResult(null)

    try {
      const data = await api.scanUrl(url)
      setResult(data.result)
    } catch (err: any) {
      setError(err.message || 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="bg-dead-surface border border-dead-border p-6">
      <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-4">
        [ Live URL Scanner ] &mdash; Powered by Claude AI
      </p>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="flex-1 bg-dead-bg border border-dead-border px-4 py-3 font-mono text-sm text-dead-text placeholder:text-dead-muted focus:border-dead-accent focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        />
        <button
          onClick={handleScan}
          disabled={scanning || !url}
          className="bg-dead-accent text-black font-mono font-bold px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dead-accent/90 transition-colors"
        >
          {scanning ? 'SCANNING...' : 'SCAN'}
        </button>
      </div>

      {/* Scanning animation */}
      {scanning && (
        <div className="font-mono text-dead-accent text-sm animate-pulse">
          &#9608; Fetching content... analyzing with Claude AI...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="font-mono text-dead-danger text-sm">
          Error: {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="border border-dead-border bg-dead-bg p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-lg font-bold" style={{ color: getVerdictColor(result.ai_probability) }}>
              {(result.ai_probability * 100).toFixed(0)}% AI Probability
            </span>
            <span
              className="font-mono text-sm px-3 py-1 border"
              style={{
                color: getVerdictColor(result.ai_probability),
                borderColor: getVerdictColor(result.ai_probability),
              }}
            >
              {getVerdictLabel(result.verdict)}
            </span>
          </div>

          {/* Probability bar */}
          <div className="h-3 bg-dead-surface rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${result.ai_probability * 100}%`,
                background: 'linear-gradient(90deg, #00cc66, #ffaa00, #ff4444)',
              }}
            />
          </div>

          {result.analysis && (
            <p className="font-mono text-dead-dim text-sm">
              {result.analysis}
            </p>
          )}

          <p className="font-mono text-dead-muted text-xs mt-3">
            Model: {result.model_used} &bull; {result.scan_duration_ms}ms
          </p>
        </div>
      )}
    </div>
  )
}
