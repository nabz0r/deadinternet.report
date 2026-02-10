import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Choose your access level. Free dashboard forever. Premium tiers unlock the AI-powered URL scanner with Claude AI content detection.',
  openGraph: {
    title: 'Pricing — deadinternet.report',
    description:
      'Free dashboard. AI URL scanner from $9/mo. Detect AI-generated content with Claude AI.',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
