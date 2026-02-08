/**
 * Ticker Tape - scrolling facts bar at the bottom.
 * Bloomberg terminal style breaking news feed.
 */

interface Props {
  facts: string[]
}

export default function TickerTape({ facts }: Props) {
  if (!facts.length) return null

  const content = facts.join('  \u2022  ')

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-dead-border bg-dead-surface/95 backdrop-blur-sm overflow-hidden z-40">
      <div className="animate-ticker whitespace-nowrap py-2 font-mono text-sm text-dead-dim">
        <span className="text-dead-accent">\u2588</span>
        &nbsp;&nbsp;{content}&nbsp;&nbsp;
        <span className="text-dead-accent">\u2588</span>
        &nbsp;&nbsp;{content}
      </div>
    </div>
  )
}
