/**
 * Live pulse indicator — shows this is real-time data.
 * Small pulsing dot with "LIVE" label.
 */

'use client'

export default function LivePulse() {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-dead-safe">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dead-safe opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-dead-safe" />
      </span>
      LIVE
    </span>
  )
}
