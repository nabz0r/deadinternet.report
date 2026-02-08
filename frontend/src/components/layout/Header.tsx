/**
 * Dashboard header with navigation and user menu.
 */

'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()
  const tier = (session?.user as any)?.tier || 'ghost'

  const tierColors: Record<string, string> = {
    ghost: '#666666',
    hunter: '#ff6600',
    operator: '#ff2222',
  }

  return (
    <header className="border-b border-dead-border px-6 py-3 flex items-center justify-between bg-dead-surface/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-mono font-bold text-dead-text">
          deadinternet<span className="text-dead-accent">.report</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 font-mono text-sm">
          <Link href="/dashboard" className="text-dead-accent">
            Dashboard
          </Link>
          <Link href="/pricing" className="text-dead-dim hover:text-dead-text transition-colors">
            Pricing
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <span
          className="font-mono text-xs px-2 py-1 border uppercase"
          style={{
            color: tierColors[tier],
            borderColor: tierColors[tier],
          }}
        >
          {tier}
        </span>

        {session?.user ? (
          <div className="flex items-center gap-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-7 h-7 rounded-full border border-dead-border"
              />
            )}
            <button
              onClick={() => signOut()}
              className="font-mono text-dead-dim text-xs hover:text-dead-text transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="font-mono text-sm text-dead-accent border border-dead-accent px-3 py-1 hover:bg-dead-accent/10 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
