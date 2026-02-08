/**
 * Root layout - wraps all pages.
 * Provides auth session, global styles, and meta tags.
 */

import type { Metadata } from 'next'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'deadinternet.report | How Dead Is The Internet?',
  description: 'Real-time dashboard tracking AI-generated content and bot traffic across the internet. Data from Europol, Imperva, Ahrefs, and Cloudflare.',
  keywords: ['dead internet theory', 'AI content', 'bot traffic', 'AI detection', 'internet statistics'],
  openGraph: {
    title: 'deadinternet.report',
    description: 'Real-time dashboard: How much of the internet is AI-generated?',
    type: 'website',
    url: 'https://deadinternet.report',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'deadinternet.report',
    description: '51% of internet traffic is bots. 74% of new pages are AI. See the data.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dead-bg text-dead-text antialiased">
        <div className="scanlines fixed inset-0 z-50 pointer-events-none" />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
