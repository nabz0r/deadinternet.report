/**
 * Stat Card - reusable metric display.
 * Shows a number with animated count-up, label, and source.
 */

'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface Props {
  label: string
  value: number
  unit?: string
  source?: string
  color?: string
}

export default function StatCard({ label, value, unit = '', source, color = '#ff6600' }: Props) {
  const displayValue = useCountUp(value, 2000)

  return (
    <div className="bg-dead-surface border border-dead-border p-6 glow-hover">
      <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-2">
        {label}
      </p>
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
