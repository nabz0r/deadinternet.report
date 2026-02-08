/**
 * Upgrade banner shown in dashboard for Ghost tier users.
 * Clear value prop + direct Stripe checkout button.
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { TIERS } from '@/lib/constants'
import { api } from '@/lib/api-client'

export default function UpgradeBanner() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!session) return
    setLoading(true)
    try {
      const { checkout_url } = await api.createCheckout(TIERS.hunter.priceId)
      window.location.href = checkout_url
    } catch (err: any) {
      alert(err.message || 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-dead-surface border border-dead-accent/30 p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-mono text-dead-accent text-sm tracking-widest uppercase mb-1">
            [ SCANNER LOCKED ]
          </p>
          <h3 className="font-mono text-lg font-bold mb-1">
            Unlock the <span className="text-dead-accent">AI URL Scanner</span>
          </h3>
          <p className="font-mono text-dead-dim text-sm">
            Paste any URL and Claude AI will analyze whether the content is AI-generated.
            10 scans/day with Hunter, unlimited with Operator.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-dead-accent text-black font-mono font-bold px-8 py-3 text-sm hover:bg-dead-accent/90 transition-colors whitespace-nowrap"
          >
            {loading ? '[ PROCESSING... ]' : 'UPGRADE — $9/mo'}
          </button>
          <a
            href="/pricing"
            className="font-mono text-dead-muted text-xs hover:text-dead-dim transition-colors"
          >
            Compare all plans
          </a>
        </div>
      </div>
    </div>
  )
}
