/**
 * Platform Breakdown - horizontal bar chart showing
 * bot/AI percentages per platform with source tooltips.
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

function PlatformBar({ platform, delay }: { platform: Platform; delay: number }) {
  const width = useCountUp(platform.bot_pct, 2000)

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '\u2191'
    if (trend === 'down') return '\u2193'
    return '\u2192'
  }

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-dead-danger'
    if (trend === 'down') return 'text-dead-safe'
    return 'text-dead-dim'
  }

  return (
    <div className="mb-4" title={platform.source}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-sm text-dead-text">{platform.label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-xs ${getTrendColor(platform.trend)}`}>
            {getTrendIcon(platform.trend)}
          </span>
          <span className="font-mono text-sm font-bold text-dead-accent">
            {width.toFixed(0)}%
          </span>
        </div>
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
      <p className="font-mono text-dead-muted text-xs mt-0.5 truncate">
        {platform.source}
      </p>
    </div>
  )
}

export default function PlatformBreakdown({ platforms }: Props) {
  const sorted = Object.values(platforms).sort((a, b) => b.bot_pct - a.bot_pct)

  return (
    <div className="bg-dead-surface border border-dead-border p-6 h-full animate-fade-in">
      <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-4">
        Bot / AI Content by Platform
      </p>
      {sorted.map((p, i) => (
        <PlatformBar key={i} platform={p} delay={i * 100} />
      ))}
    </div>
  )
}
