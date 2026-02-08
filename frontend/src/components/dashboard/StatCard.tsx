/**
 * Stat Card - reusable metric display.
 * Shows a number with animated count-up, label, source, and trend indicator.
 */

'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface Props {
  label: string
  value: number
  unit?: string
  source?: string
  color?: string
  trend?: 'up' | 'down' | 'stable'
}

export default function StatCard({ label, value, unit = '', source, color = '#ff6600', trend = 'up' }: Props) {
  const displayValue = useCountUp(value, 2000)

  const trendIcon = trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192'
  const trendColor = trend === 'up' ? 'text-dead-danger' : trend === 'down' ? 'text-dead-safe' : 'text-dead-dim'

  return (
    <div className="bg-dead-surface border border-dead-border p-6 glow-hover animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-dead-dim text-xs uppercase tracking-wider">
          {label}
        </p>
        <span className={`font-mono text-xs ${trendColor}`}>
          {trendIcon}
        </span>
      </div>
      <p className="font-mono text-4xl font-bold" style={{ color }}>
        {displayValue.toFixed(1)}{unit}
      </p>
      {source && (
        <p className="font-mono text-dead-muted text-xs mt-2">
          Source: {source}
        </p>
      )}
    </div>
  )
}
