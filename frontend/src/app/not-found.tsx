/**
 * Custom 404 page - maintains the terminal aesthetic.
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-dead-bg flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-dead-accent text-sm tracking-widest uppercase mb-4">
          [ ERROR 404 ]
        </p>
        <h1 className="font-mono text-6xl font-bold text-dead-danger mb-4">
          PAGE NOT FOUND
        </h1>
        <p className="font-mono text-dead-dim mb-8">
          This page doesn&apos;t exist. Or maybe it was AI-generated and disappeared.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="font-mono text-sm border border-dead-accent text-dead-accent px-6 py-3 hover:bg-dead-accent/10 transition-colors"
          >
            BACK TO DASHBOARD
          </Link>
          <Link
            href="/pricing"
            className="font-mono text-sm border border-dead-border text-dead-dim px-6 py-3 hover:border-dead-accent hover:text-dead-accent transition-colors"
          >
            VIEW PRICING
          </Link>
        </div>
      </div>
    </main>
  )
}
