/**
 * Root layout - wraps all pages.
 * Provides auth session, global styles, and comprehensive meta tags.
 */

import type { Metadata } from 'next'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://deadinternet.report'),
  title: {
    default: 'deadinternet.report | The Internet is 67% Dead',
    template: '%s | deadinternet.report',
  },
  description:
    'Real-time dashboard tracking AI-generated content and bot traffic. 51% of internet traffic is bots. 74% of new pages are AI. Data from Europol, Imperva, Ahrefs, Cloudflare.',
  keywords: [
    'dead internet theory',
    'AI content detection',
    'bot traffic statistics',
    'AI generated content',
    'internet statistics 2025',
    'synthetic content',
    'AI content scanner',
    'bot percentage internet',
  ],
  authors: [{ name: 'deadinternet.report' }],
  creator: 'deadinternet.report',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://deadinternet.report',
    siteName: 'deadinternet.report',
    title: 'The Internet is 67% Dead',
    description:
      '51% bot traffic. 74% AI content. Real-time data from Europol, Imperva, Ahrefs. Not speculation — published research.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Internet is 67% Dead',
    description:
      '51% bot traffic. 74% AI content. See the real data.',
    creator: '@deadinternetHQ',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://deadinternet.report',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="bg-dead-bg text-dead-text antialiased">
        <div className="scanlines fixed inset-0 z-50 pointer-events-none" />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
