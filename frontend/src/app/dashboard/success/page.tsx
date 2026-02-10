/**
 * Post-checkout success page.
 * Shown after Stripe redirects back with ?upgraded=true.
 * Congratulates user and redirects to dashboard.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function SuccessPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Force session refresh to get updated tier
    update()

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <main className="min-h-screen bg-dead-bg flex items-center justify-center">
      <div className="text-center max-w-lg animate-fade-in">
        <div className="text-6xl mb-6 animate-scale-in">☠️</div>
        <p className="font-mono text-dead-safe text-sm tracking-widest uppercase mb-4">
          [ UPGRADE COMPLETE ]
        </p>
        <h1 className="font-mono text-3xl font-bold mb-4">
          WELCOME TO THE <span className="text-dead-accent">INNER CIRCLE</span>
        </h1>
        <p className="font-mono text-dead-dim mb-2">
          Your scanner is now active. Start analyzing URLs for AI content.
        </p>
        <p className="font-mono text-dead-muted text-sm mb-4" aria-live="polite">
          Redirecting to dashboard in {countdown}s...
        </p>

        <div
          className="w-full bg-dead-border h-1 overflow-hidden mb-6"
          role="progressbar"
          aria-valuenow={(5 - countdown) * 20}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-dead-accent transition-all duration-1000"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        </div>

        <Link
          href="/dashboard"
          className="font-mono text-sm text-dead-dim hover:text-dead-accent transition-colors"
        >
          Skip → go to dashboard now
        </Link>
      </div>
    </main>
  )
}
