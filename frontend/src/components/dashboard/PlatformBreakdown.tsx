/**
 * Platform Breakdown - horizontal bar chart showing
 * bot/AI percentages per platform.
 */

'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface Platform {
  bot_pct: number
  label: string
  source: string
  trend: string
}

interface Props {
  platforms: Record<string, Platform>
}

function PlatformBar({ platform }: { platform: Platform }) {
  const width = useCountUp(platform.bot_pct, 2000)

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '\u2191'
    if (trend === 'down') return '\u2193'
    return '\u2192'
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-sm text-dead-text">{platform.label}</span>
        <span className="font-mono text-sm font-bold text-dead-accent">
          {width.toFixed(0)}% {getTrendIcon(platform.trend)}
        </span>
      </div>
      <div className="h-2 bg-dead-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, #ff6600, ${width > 50 ? '#ff2222' : '#ffaa00'})`,
          }}
        />
      </div>
    </div>
  )
}

export default function PlatformBreakdown({ platforms }: Props) {
  const sorted = Object.values(platforms).sort((a, b) => b.bot_pct - a.bot_pct)

  return (
    <div className="bg-dead-surface border border-dead-border p-6 h-full">
      <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-4">
        Bot / AI Content by Platform
      </p>
      {sorted.map((p, i) => (
        <PlatformBar key={i} platform={p} />
      ))}
    </div>
  )
}
