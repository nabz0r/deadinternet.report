/**
 * Privacy Policy - Required by Google/GitHub OAuth and GDPR.
 * Static page, SSR, no auth needed.
 */

import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for deadinternet.report - how we handle your data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-dead-bg">
      <header className="border-b border-dead-border px-6 py-4">
        <Link href="/" className="font-mono font-bold text-dead-text">
          deadinternet<span className="text-dead-accent">.report</span>
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 font-mono text-sm text-dead-dim space-y-6">
        <h1 className="text-2xl font-bold text-dead-text mb-8">Privacy Policy</h1>
        <p className="text-dead-muted text-xs">Last updated: February 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">1. What We Collect</h2>
          <p>When you sign in via Google or GitHub OAuth, we receive and store:</p>
          <ul className="list-none space-y-1 pl-4">
            <li>▸ <strong className="text-dead-text">Email address</strong> — Account identification</li>
            <li>▸ <strong className="text-dead-text">Display name</strong> — Shown in the UI</li>
            <li>▸ <strong className="text-dead-text">Profile picture URL</strong> — Avatar display</li>
          </ul>
          <p>We do not access your contacts, files, repositories, or any other data from your Google or GitHub accounts.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">2. Scanner Data</h2>
          <p>When you use the URL Scanner, we store:</p>
          <ul className="list-none space-y-1 pl-4">
            <li>▸ The URL you submitted</li>
            <li>▸ The analysis result (AI probability, verdict)</li>
            <li>▸ A short content snippet (first ~200 characters)</li>
            <li>▸ Timestamp and scan duration</li>
          </ul>
          <p>Scanned content is processed through Anthropic&apos;s Claude API. Anthropic&apos;s <a href="https://www.anthropic.com/privacy" className="text-dead-accent hover:underline">privacy policy</a> applies to that processing. We do not store the full content of scanned pages.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">3. Payment Data</h2>
          <p>Payments are processed entirely by Stripe. We never see, store, or handle your credit card details. We store only your Stripe customer ID and subscription status. See <a href="https://stripe.com/privacy" className="text-dead-accent hover:underline">Stripe&apos;s privacy policy</a>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">4. How We Use Your Data</h2>
          <ul className="list-none space-y-1 pl-4">
            <li>▸ Provide and maintain the Service</li>
            <li>▸ Manage your subscription and tier access</li>
            <li>▸ Enforce rate limits</li>
            <li>▸ Show your scan history</li>
          </ul>
          <p>We do not sell, rent, or share your personal data with third parties for marketing. We do not run ads. We do not track you across the web.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">5. Cookies & Sessions</h2>
          <p>We use a single encrypted session cookie for authentication (NextAuth.js). We do not use analytics cookies, tracking pixels, or third-party advertising scripts. No cookie consent banner is needed because we only use strictly necessary cookies.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">6. Data Storage & Security</h2>
          <p>Your data is stored in a PostgreSQL database. Sessions are cached in Redis. All data is encrypted in transit (TLS). Database access is restricted to the application backend only.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">7. Your Rights (GDPR)</h2>
          <p>If you are in the EU/EEA, you have the right to:</p>
          <ul className="list-none space-y-1 pl-4">
            <li>▸ <strong className="text-dead-text">Access</strong> your personal data</li>
            <li>▸ <strong className="text-dead-text">Rectify</strong> inaccurate data</li>
            <li>▸ <strong className="text-dead-text">Delete</strong> your account and all associated data</li>
            <li>▸ <strong className="text-dead-text">Export</strong> your scan history</li>
            <li>▸ <strong className="text-dead-text">Object</strong> to data processing</li>
          </ul>
          <p>To exercise these rights, open an issue on our GitHub or contact us directly.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">8. Data Retention</h2>
          <p>Account data is retained while your account is active. Scan history is retained for 12 months. When you delete your account, all data is permanently removed within 30 days.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">9. Third-Party Services</h2>
          <ul className="list-none space-y-1 pl-4">
            <li>▸ <strong className="text-dead-text">Stripe</strong> — Payment processing (<a href="https://stripe.com/privacy" className="text-dead-accent hover:underline">privacy policy</a>)</li>
            <li>▸ <strong className="text-dead-text">Anthropic (Claude)</strong> — Content analysis (<a href="https://www.anthropic.com/privacy" className="text-dead-accent hover:underline">privacy policy</a>)</li>
            <li>▸ <strong className="text-dead-text">Google OAuth</strong> — Authentication (<a href="https://policies.google.com/privacy" className="text-dead-accent hover:underline">privacy policy</a>)</li>
            <li>▸ <strong className="text-dead-text">GitHub OAuth</strong> — Authentication (<a href="https://docs.github.com/en/site-policy/privacy-policies" className="text-dead-accent hover:underline">privacy policy</a>)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">10. Changes</h2>
          <p>We may update this Privacy Policy. Changes will be posted on this page with an updated date. Material changes will be communicated via email.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">11. Contact</h2>
          <p>Questions? Open an issue on our <a href="https://github.com/nabz0r/deadinternet.report" className="text-dead-accent hover:underline">GitHub repository</a>.</p>
        </section>
      </article>
    </main>
  )
}
