/**
 * Login page - SSO with Google/GitHub.
 * Terminal aesthetic. Handles callbackUrl from pricing/middleware.
 */

'use client'

import { Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  return (
    <div className="space-y-3">
      <button
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full bg-dead-bg border border-dead-border py-3 px-4 font-mono text-sm hover:border-dead-accent hover:text-dead-accent transition-colors flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <button
        onClick={() => signIn('github', { callbackUrl })}
        className="w-full bg-dead-bg border border-dead-border py-3 px-4 font-mono text-sm hover:border-dead-accent hover:text-dead-accent transition-colors flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        Continue with GitHub
      </button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-dead-bg flex items-center justify-center px-4">
      <div className="bg-dead-surface border border-dead-border p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="font-mono font-bold text-2xl mb-2 inline-block">
            deadinternet<span className="text-dead-accent">.report</span>
          </Link>
          <p className="font-mono text-dead-dim text-sm">
            Sign in to access the full dashboard
          </p>
        </div>

        <Suspense fallback={
          <div className="space-y-3">
            <div className="w-full bg-dead-bg border border-dead-border py-3 px-4 h-12 animate-pulse" />
            <div className="w-full bg-dead-bg border border-dead-border py-3 px-4 h-12 animate-pulse" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <div className="mt-6 pt-4 border-t border-dead-border">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-mono text-dead-dim text-lg font-bold">$0</p>
              <p className="font-mono text-dead-muted text-xs">Dashboard</p>
            </div>
            <div>
              <p className="font-mono text-dead-accent text-lg font-bold">$9</p>
              <p className="font-mono text-dead-muted text-xs">Scanner</p>
            </div>
            <div>
              <p className="font-mono text-dead-danger text-lg font-bold">$29</p>
              <p className="font-mono text-dead-muted text-xs">API + Bulk</p>
            </div>
          </div>
        </div>

        <p className="font-mono text-dead-muted text-xs text-center mt-4">
          Free tier gives you the full dashboard. No credit card needed.
        </p>
      </div>
    </main>
  )
}
