/**
 * Pricing page - tier comparison.
 * Ghost (free) / Hunter ($9) / Operator ($29)
 */

import Link from 'next/link'
import { TIERS } from '@/lib/constants'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-dead-bg">
      <header className="border-b border-dead-border px-6 py-4">
        <Link href="/" className="font-mono font-bold text-dead-text">
          deadinternet<span className="text-dead-accent">.report</span>
        </Link>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-mono text-3xl font-bold mb-4">
            CHOOSE YOUR <span className="text-dead-accent">ACCESS LEVEL</span>
          </h2>
          <p className="font-mono text-dead-dim">
            The dashboard is free. The scanner is premium.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TIERS).map(([key, tier]) => (
            <div
              key={key}
              className={`bg-dead-surface border p-6 flex flex-col ${
                key === 'hunter'
                  ? 'border-dead-accent'
                  : 'border-dead-border'
              }`}
            >
              {key === 'hunter' && (
                <div className="bg-dead-accent text-black font-mono text-xs font-bold px-2 py-1 -mt-6 -mx-6 mb-6 text-center">
                  MOST POPULAR
                </div>
              )}
              <h3 className="font-mono text-xl font-bold mb-1" style={{ color: tier.color }}>
                {tier.name}
              </h3>
              <p className="font-mono text-3xl font-bold mb-4">
                ${tier.price}
                {tier.price > 0 && <span className="text-dead-dim text-sm">/mo</span>}
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="font-mono text-sm text-dead-dim flex items-start gap-2">
                    <span className="text-dead-accent">+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`block text-center font-mono text-sm py-3 border transition-colors ${
                  key === 'hunter'
                    ? 'bg-dead-accent text-black border-dead-accent hover:bg-dead-accent/90'
                    : 'border-dead-border hover:border-dead-accent hover:text-dead-accent'
                }`}
              >
                {tier.price === 0 ? 'GET STARTED' : 'UPGRADE'}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
