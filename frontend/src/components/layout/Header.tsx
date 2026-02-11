/**
 * Dashboard header with navigation, user menu, tier badge, billing, and history.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { hasFeature } from '@/lib/constants'
import { api } from '@/lib/api-client'

export default function Header() {
  const { data: session } = useSession()
  const tier = session?.user?.tier || 'ghost'
  const [menuOpen, setMenuOpen] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  const tierColors: Record<string, string> = {
    ghost: '#666666',
    hunter: '#ff6600',
    operator: '#ff2222',
  }

  const handleBilling = async () => {
    setBillingLoading(true)
    try {
      const { portal_url } = await api.createPortal()
      window.location.href = portal_url
    } catch {
      window.location.href = '/pricing'
    } finally {
      setBillingLoading(false)
    }
  }

  return (
    <header className="border-b border-dead-border px-4 md:px-6 py-3 flex items-center justify-between bg-dead-surface/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-4 md:gap-6">
        <Link href="/" className="font-mono font-bold text-dead-text text-sm md:text-base">
          deadinternet<span className="text-dead-accent">.report</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 font-mono text-sm">
          <Link href="/dashboard" className="text-dead-accent">
            Dashboard
          </Link>
          {hasFeature(tier, 'hunter') && (
            <>
              <Link href="/dashboard/history" className="text-dead-dim hover:text-dead-text transition-colors">
                History
              </Link>
              <Link href="/dashboard/analytics" className="text-dead-dim hover:text-dead-text transition-colors">
                Analytics
              </Link>
            </>
          )}
          <Link href="/pricing" className="text-dead-dim hover:text-dead-text transition-colors">
            Pricing
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Tier badge */}
        <span
          className="font-mono text-xs px-2 py-1 border uppercase hidden sm:inline-block"
          style={{ color: tierColors[tier], borderColor: tierColors[tier] }}
        >
          {tier}
        </span>

        {/* Upgrade button for free tier */}
        {tier === 'ghost' && (
          <Link
            href="/pricing"
            className="font-mono text-xs bg-dead-accent text-black px-3 py-1 hover:bg-dead-accent/90 transition-colors hidden sm:inline-block"
          >
            UPGRADE
          </Link>
        )}

        {session?.user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="User menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-7 h-7 rounded-full border border-dead-border"
                />
              )}
              <svg
                className={`w-3 h-3 text-dead-dim transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-dead-surface border border-dead-border z-50 shadow-lg">
                  <div className="px-4 py-3 border-b border-dead-border">
                    <p className="font-mono text-sm text-dead-text truncate">
                      {session.user.name || session.user.email}
                    </p>
                    <p className="font-mono text-xs text-dead-muted truncate">
                      {session.user.email}
                    </p>
                    <span
                      className="inline-block font-mono text-xs px-1.5 py-0.5 border uppercase mt-1"
                      style={{ color: tierColors[tier], borderColor: tierColors[tier], fontSize: 10 }}
                    >
                      {tier} tier
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 font-mono text-sm text-dead-dim hover:text-dead-accent hover:bg-dead-bg transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {hasFeature(tier, 'hunter') && (
                      <>
                        <Link
                          href="/dashboard/history"
                          className="block px-4 py-2 font-mono text-sm text-dead-dim hover:text-dead-accent hover:bg-dead-bg transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          Scan History
                        </Link>
                        <Link
                          href="/dashboard/analytics"
                          className="block px-4 py-2 font-mono text-sm text-dead-dim hover:text-dead-accent hover:bg-dead-bg transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          Analytics
                        </Link>
                      </>
                    )}
                    <Link
                      href="/pricing"
                      className="block px-4 py-2 font-mono text-sm text-dead-dim hover:text-dead-accent hover:bg-dead-bg transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    {hasFeature(tier, 'hunter') && (
                      <button
                        onClick={() => { setMenuOpen(false); handleBilling() }}
                        className="block w-full text-left px-4 py-2 font-mono text-sm text-dead-dim hover:text-dead-accent hover:bg-dead-bg transition-colors"
                      >
                        {billingLoading ? 'Loading...' : 'Manage Subscription'}
                      </button>
                    )}
                    {tier === 'ghost' && (
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 font-mono text-sm text-dead-accent hover:bg-dead-bg transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        ↑ Upgrade Plan
                      </Link>
                    )}
                    <div className="border-t border-dead-border mt-1 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="block w-full text-left px-4 py-2 font-mono text-sm text-dead-dim hover:text-dead-danger hover:bg-dead-bg transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
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
