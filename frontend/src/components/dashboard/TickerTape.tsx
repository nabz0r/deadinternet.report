/**
 * Ticker Tape - Bloomberg-style scrolling facts bar.
 * Fixed at bottom, seamless infinite scroll.
 * Duplicates content for gap-free looping.
 * Pauses on hover; hidden from screen readers (decorative).
 */

'use client'

interface Props {
  facts: string[]
}

export default function TickerTape({ facts }: Props) {
  if (!facts.length) return null

  const separator = '  \u2022  '

  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t border-dead-border bg-dead-surface/95 backdrop-blur-sm overflow-hidden z-40"
      role="marquee"
      aria-label="Scrolling facts about AI content on the internet"
    >
      {/* Screen reader accessible version */}
      <div className="sr-only">
        {facts.map((fact, i) => (
          <span key={i}>{fact}. </span>
        ))}
      </div>
      {/* Visual scrolling version */}
      <div className="animate-ticker-seamless whitespace-nowrap py-2 font-mono text-sm text-dead-dim" aria-hidden="true">
        {/* Two copies for seamless loop */}
        <span className="inline-block">
          <span className="text-dead-accent">{'\u2588'}</span>
          &nbsp;&nbsp;{facts.join(separator)}&nbsp;&nbsp;
        </span>
        <span className="inline-block">
          <span className="text-dead-accent">{'\u2588'}</span>
          &nbsp;&nbsp;{facts.join(separator)}&nbsp;&nbsp;
        </span>
      </div>
    </div>
  )
}
