/**
 * Pricing page - tier comparison with functional Stripe checkout.
 * Ghost (free) / Hunter ($9) / Operator ($29)
 * Shows current tier if logged in, handles upgrade flow.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { TIERS, type TierName } from '@/lib/constants'
import { api } from '@/lib/api-client'
import Footer from '@/components/layout/Footer'

export default function PricingPage() {
  const { data: session } = useSession()
  const userTier = (session?.user?.tier as TierName) || 'ghost'
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (tierKey: string) => {
    const tier = TIERS[tierKey as keyof typeof TIERS]
    if (!('priceId' in tier) || !tier.priceId) return

    if (!session) {
      window.location.href = `/login?callbackUrl=/pricing`
      return
    }

    setLoading(tierKey)
    try {
      const { checkout_url } = await api.createCheckout(tier.priceId)
      window.location.href = checkout_url
    } catch (err: any) {
      alert(err.message || 'Failed to create checkout session')
    } finally {
      setLoading(null)
    }
  }

  const getButtonState = (tierKey: string) => {
    const levels: Record<string, number> = { ghost: 0, hunter: 1, operator: 2 }
    const current = levels[userTier] || 0
    const target = levels[tierKey] || 0

    if (tierKey === userTier) return { label: 'CURRENT PLAN', disabled: true, style: 'current' }
    if (tierKey === 'ghost') return { label: session ? 'FREE TIER' : 'GET STARTED', disabled: false, style: 'default' }
    if (target < current) return { label: 'DOWNGRADE', disabled: false, style: 'default' }
    return { label: 'UPGRADE NOW', disabled: false, style: tierKey === 'hunter' ? 'primary' : 'default' }
  }

  return (
    <main className="min-h-screen bg-dead-bg flex flex-col">
      <header className="border-b border-dead-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-dead-text">
          deadinternet<span className="text-dead-accent">.report</span>
        </Link>
        <div className="flex items-center gap-4">
          {session ? (
            <Link href="/dashboard" className="font-mono text-sm text-dead-accent hover:underline">
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="font-mono text-sm border border-dead-accent text-dead-accent px-4 py-2 hover:bg-dead-accent/10 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16 flex-1">
        <div className="text-center mb-12">
          <p className="font-mono text-dead-accent text-sm tracking-widest uppercase mb-4">
            [ ACCESS LEVELS ]
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-bold mb-4">
            CHOOSE YOUR <span className="text-dead-accent">ACCESS LEVEL</span>
          </h2>
          <p className="font-mono text-dead-dim max-w-lg mx-auto">
            The dashboard is free forever. Premium tiers unlock the AI-powered URL scanner
            and advanced features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TIERS).map(([key, tier]) => {
            const btn = getButtonState(key)
            const isPopular = key === 'hunter'
            const isCurrent = key === userTier

            return (
              <div
                key={key}
                className={`bg-dead-surface border p-6 flex flex-col relative ${
                  isCurrent
                    ? 'border-dead-safe ring-1 ring-dead-safe/20'
                    : isPopular
                    ? 'border-dead-accent'
                    : 'border-dead-border'
                }`}
              >
                {isPopular && !isCurrent && (
                  <div className="absolute -top-px left-0 right-0 bg-dead-accent text-black font-mono text-xs font-bold py-1 text-center">
                    MOST POPULAR
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-px left-0 right-0 bg-dead-safe text-black font-mono text-xs font-bold py-1 text-center">
                    YOUR CURRENT PLAN
                  </div>
                )}

                <div className={isPopular || isCurrent ? 'mt-4' : ''}>
                  <h3
                    className="font-mono text-xl font-bold mb-1"
                    style={{ color: tier.color }}
                  >
                    {tier.name}
                  </h3>
                  <p className="font-mono text-3xl font-bold mb-1">
                    ${tier.price}
                    {tier.price > 0 && (
                      <span className="text-dead-dim text-sm">/mo</span>
                    )}
                  </p>
                  {tier.price > 0 && (
                    <p className="font-mono text-dead-muted text-xs mb-4">
                      Cancel anytime • Billed monthly
                    </p>
                  )}
                  {tier.price === 0 && (
                    <p className="font-mono text-dead-muted text-xs mb-4">
                      Free forever • No credit card
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((f, i) => (
                    <li
                      key={i}
                      className="font-mono text-sm text-dead-dim flex items-start gap-2"
                    >
                      <span className="text-dead-accent mt-0.5">▸</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {key === 'ghost' ? (
                  <Link
                    href={session ? '/dashboard' : '/login'}
                    className="block text-center font-mono text-sm py-3 border border-dead-border hover:border-dead-accent hover:text-dead-accent transition-colors"
                  >
                    {session ? 'GO TO DASHBOARD' : 'GET STARTED'}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={btn.disabled || loading === key}
                    className={`w-full font-mono text-sm py-3 border transition-colors ${
                      btn.disabled
                        ? 'border-dead-muted text-dead-muted cursor-not-allowed'
                        : btn.style === 'primary'
                        ? 'bg-dead-accent text-black border-dead-accent hover:bg-dead-accent/90'
                        : 'border-dead-border hover:border-dead-accent hover:text-dead-accent'
                    }`}
                  >
                    {loading === key ? '[ PROCESSING... ]' : btn.label}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="font-mono text-xl font-bold text-center mb-8">
            FREQUENTLY ASKED <span className="text-dead-accent">QUESTIONS</span>
          </h3>
          <div className="space-y-6">
            <div className="border-b border-dead-border pb-4">
              <h4 className="font-mono text-sm text-dead-text mb-2">How does the URL scanner work?</h4>
              <p className="font-mono text-dead-dim text-xs">
                The scanner fetches the content of any URL, then analyzes it using Claude AI
                to estimate the probability that the content was AI-generated. It examines
                writing patterns, structure, vocabulary, and other linguistic markers.
              </p>
            </div>
            <div className="border-b border-dead-border pb-4">
              <h4 className="font-mono text-sm text-dead-text mb-2">Where does the dashboard data come from?</h4>
              <p className="font-mono text-dead-dim text-xs">
                Every statistic is sourced from published research by Europol, Imperva/Thales,
                Ahrefs, Cloudflare, Graphite, and other organizations. We never fabricate data.
                Sources are cited alongside every metric.
              </p>
            </div>
            <div className="border-b border-dead-border pb-4">
              <h4 className="font-mono text-sm text-dead-text mb-2">Can I cancel my subscription?</h4>
              <p className="font-mono text-dead-dim text-xs">
                Yes, you can cancel anytime from your billing portal. Your premium access
                continues until the end of your current billing period. No questions asked.
              </p>
            </div>
            <div className="border-b border-dead-border pb-4">
              <h4 className="font-mono text-sm text-dead-text mb-2">What is the API access (Operator tier)?</h4>
              <p className="font-mono text-dead-dim text-xs">
                Operator tier gives you direct API access via JWT token. Integrate
                the scanner into your own tools, CI/CD pipelines, or content moderation workflows.
                Full API docs at <a href="/docs" className="text-dead-accent hover:underline">/docs</a>.
              </p>
            </div>
            <div className="border-b border-dead-border pb-4">
              <h4 className="font-mono text-sm text-dead-text mb-2">Is my data private?</h4>
              <p className="font-mono text-dead-dim text-xs">
                Yes. We don&apos;t sell data, don&apos;t run ads, and don&apos;t track you.
                Scan URLs are stored for your history only. See our <Link href="/privacy" className="text-dead-accent hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
