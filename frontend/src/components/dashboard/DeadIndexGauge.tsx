/**
 * Dead Internet Index - the big central score.
 * Animated SVG gauge from 0-100% with color gradient and glow.
 * This is the hero element of the dashboard.
 */

'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface Props {
  value: number // 0.0 - 1.0
}

export default function DeadIndexGauge({ value }: Props) {
  const displayValue = useCountUp(value * 100, 2500)
  const pct = Math.round(displayValue)

  const getColor = (v: number) => {
    if (v < 30) return '#00cc66'
    if (v < 60) return '#ffaa00'
    return '#ff4444'
  }

  const getLabel = (v: number) => {
    if (v > 70) return 'CRITICAL'
    if (v > 50) return 'SEVERE'
    if (v > 30) return 'WARNING'
    return 'MODERATE'
  }

  const color = getColor(pct)
  const circumference = 2 * Math.PI * 70
  const offset = circumference - (displayValue / 100) * circumference

  return (
    <div className="bg-dead-surface border border-dead-border p-6 flex flex-col items-center justify-center h-full animate-fade-in">
      <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-4">
        Dead Internet Index
      </p>

      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="8"
          />
          {/* Glow filter */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Progress arc */}
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter="url(#glow)"
            style={{ transition: 'stroke-dashoffset 0.1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl font-bold" style={{ color }}>
            {pct}%
          </span>
        </div>
      </div>

      <p className="font-mono text-xs mt-4 font-bold tracking-widest" style={{ color }}>
        {getLabel(pct)}
      </p>
    </div>
  )
}
