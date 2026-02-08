/**
 * Global error boundary - catches runtime errors.
 * Maintains terminal aesthetic, offers retry.
 */

'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-dead-bg flex items-center justify-center">
      <div className="text-center max-w-lg">
        <p className="font-mono text-dead-accent text-sm tracking-widest uppercase mb-4">
          [ SYSTEM ERROR ]
        </p>
        <h1 className="font-mono text-4xl font-bold text-dead-danger mb-4">
          SOMETHING BROKE
        </h1>
        <p className="font-mono text-dead-dim mb-2">
          The dead internet has claimed another victim.
        </p>
        <p className="font-mono text-dead-muted text-xs mb-8">
          {error.digest && `Error ID: ${error.digest}`}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="font-mono text-sm bg-dead-accent text-black px-6 py-3 hover:bg-dead-accent/90 transition-colors"
          >
            TRY AGAIN
          </button>
          <a
            href="/"
            className="font-mono text-sm border border-dead-border text-dead-dim px-6 py-3 hover:border-dead-accent hover:text-dead-accent transition-colors"
          >
            GO HOME
          </a>
        </div>
      </div>
    </main>
  )
}
