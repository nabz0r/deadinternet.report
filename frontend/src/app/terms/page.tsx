/**
 * Terms of Service - Required by Stripe and app stores.
 * Static page, SSR, no auth needed.
 */

import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for deadinternet.report',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-dead-bg">
      <header className="border-b border-dead-border px-6 py-4">
        <Link href="/" className="font-mono font-bold text-dead-text">
          deadinternet<span className="text-dead-accent">.report</span>
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 font-mono text-sm text-dead-dim space-y-6">
        <h1 className="text-2xl font-bold text-dead-text mb-8">Terms of Service</h1>
        <p className="text-dead-muted text-xs">Last updated: February 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">1. Acceptance of Terms</h2>
          <p>By accessing or using deadinternet.report (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">2. Description of Service</h2>
          <p>deadinternet.report provides a data dashboard aggregating published research about AI-generated content and bot traffic, and an AI-powered URL content analysis tool (&ldquo;Scanner&rdquo;). The data presented is sourced from third-party research organizations and is provided for informational purposes only.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">3. User Accounts</h2>
          <p>You may create an account using Google or GitHub OAuth. You are responsible for maintaining the security of your account. You must provide accurate information during registration.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">4. Subscriptions & Payments</h2>
          <p>Premium tiers (Hunter, Operator) are billed monthly through Stripe. Prices are in USD. You may cancel at any time through the billing portal; access continues until the end of the billing period. No refunds for partial months.</p>
          <p>We reserve the right to change pricing with 30 days&apos; notice to active subscribers.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-none space-y-1 pl-4">
            <li>▸ Use the Scanner to harass, defame, or target individuals</li>
            <li>▸ Reverse-engineer or scrape the Service beyond API access</li>
            <li>▸ Exceed your tier&apos;s rate limits through any means</li>
            <li>▸ Resell access to the Service without authorization</li>
            <li>▸ Use the Service for any illegal purpose</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">6. Scanner Disclaimer</h2>
          <p>The AI URL Scanner provides probabilistic estimates of AI-generated content. Results are not definitive and should not be used as the sole basis for editorial, legal, or employment decisions. The Service makes no guarantee of accuracy.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">7. Data Sources</h2>
          <p>Dashboard statistics are sourced from published research by third parties including Europol, Imperva/Thales, Ahrefs, Cloudflare, Graphite, and others. We cite sources but do not guarantee their accuracy. We update data as new research is published.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">8. Intellectual Property</h2>
          <p>The Service, its design, code, and branding are open source under the MIT License. Third-party data sources retain their own copyrights and terms.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">9. Limitation of Liability</h2>
          <p>The Service is provided &ldquo;as is&rdquo; without warranty. We are not liable for any damages arising from the use of the Service, including but not limited to decisions made based on Scanner results or dashboard data.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">10. Termination</h2>
          <p>We may suspend or terminate your account for violation of these Terms. You may delete your account at any time by contacting support.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">11. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use after changes constitutes acceptance. Material changes will be communicated via email to registered users.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-dead-text">12. Contact</h2>
          <p>Questions about these Terms? Open an issue on our <a href="https://github.com/nabz0r/deadinternet.report" className="text-dead-accent hover:underline">GitHub repository</a>.</p>
        </section>
      </article>
    </main>
  )
}
