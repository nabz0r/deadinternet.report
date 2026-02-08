/**
 * Ticker Tape - Bloomberg-style scrolling facts bar.
 * Fixed at bottom, seamless infinite scroll.
 * Duplicates content for gap-free looping.
 */

'use client'

interface Props {
  facts: string[]
}

export default function TickerTape({ facts }: Props) {
  if (!facts.length) return null

  const separator = '  \u2022  '
  const content = `\u2588 ${facts.join(separator)} ${separator}`

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-dead-border bg-dead-surface/95 backdrop-blur-sm overflow-hidden z-40">
      <div className="animate-ticker-seamless whitespace-nowrap py-2 font-mono text-sm text-dead-dim">
        {/* Two copies for seamless loop */}
        <span className="inline-block">
          <span className="text-dead-accent">\u2588</span>
          &nbsp;&nbsp;{facts.join(separator)}&nbsp;&nbsp;
        </span>
        <span className="inline-block">
          <span className="text-dead-accent">\u2588</span>
          &nbsp;&nbsp;{facts.join(separator)}&nbsp;&nbsp;
        </span>
      </div>
    </div>
  )
}
