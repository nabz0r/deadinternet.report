/**
 * Timeline Chart - historical evolution of bot traffic and AI content.
 * Uses Recharts for the area/line chart.
 * Shows the dramatic hockey-stick curve post-ChatGPT.
 */

'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface DataPoint {
  year: number
  bot_pct: number
  ai_content_pct: number
  projected?: boolean
}

interface Props {
  data: DataPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null
  return (
    <div className="bg-dead-surface border border-dead-border p-3 font-mono text-xs">
      <p className="text-dead-text font-bold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(1)}%
        </p>
      ))}
    </div>
  )
}

export default function TimelineChart({ data }: Props) {
  return (
    <div className="bg-dead-surface border border-dead-border p-6 h-full">
      <p className="font-mono text-dead-dim text-xs uppercase tracking-wider mb-4">
        Historical Timeline &mdash; Bot Traffic vs AI Content
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="year"
            stroke="#333"
            tick={{ fill: '#666', fontSize: 11, fontFamily: 'monospace' }}
          />
          <YAxis
            stroke="#333"
            tick={{ fill: '#666', fontSize: 11, fontFamily: 'monospace' }}
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="bot_pct"
            name="Bot Traffic %"
            stroke="#ff4444"
            fill="#ff444422"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="ai_content_pct"
            name="AI Content %"
            stroke="#ffaa00"
            fill="#ffaa0022"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="font-mono text-dead-muted text-xs mt-2">
        Sources: Imperva (bot traffic), Ahrefs + Graphite (AI content). 2026 = projected.
      </p>
    </div>
  )
}
