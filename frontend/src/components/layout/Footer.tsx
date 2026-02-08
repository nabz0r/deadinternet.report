/**
 * Shared footer with legal links, GitHub, copyright.
 * Used across landing, pricing, terms, privacy.
 */

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-dead-border px-4 md:px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <span className="font-mono text-dead-dim text-xs">
            © {new Date().getFullYear()} deadinternet.report
          </span>
          <Link href="/terms" className="font-mono text-dead-muted text-xs hover:text-dead-accent transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="font-mono text-dead-muted text-xs hover:text-dead-accent transition-colors">
            Privacy
          </Link>
          <a
            href="https://github.com/nabz0r/deadinternet.report"
            className="font-mono text-dead-accent text-xs hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
        <p className="font-mono text-dead-muted text-xs text-center md:text-right">
          All statistics sourced from published research. Open source. MIT Licensed.
        </p>
      </div>
    </footer>
  )
}
