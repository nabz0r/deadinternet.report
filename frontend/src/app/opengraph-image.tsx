/**
 * Dynamic OG Image - renders as PNG at build/request time.
 * Next.js 14 automatically serves this at /opengraph-image
 * Shows the Dead Internet Index + key stats for viral sharing.
 */

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'deadinternet.report - The Internet is 67% Dead'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        {/* Scanlines overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: '#ff6600',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: '#888',
            marginBottom: 20,
          }}
        >
          deadinternet
          <span style={{ color: '#ff6600' }}>.report</span>
        </div>

        {/* Main number */}
        <div
          style={{
            display: 'flex',
            fontSize: 140,
            fontWeight: 700,
            color: '#ff2222',
            lineHeight: 1,
            marginBottom: 10,
          }}
        >
          67%
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#e0e0e0',
            letterSpacing: 6,
            textTransform: 'uppercase',
            marginBottom: 40,
          }}
        >
          OF THE INTERNET IS DEAD
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 60,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 42, fontWeight: 700, color: '#ff4444' }}>51%</span>
            <span style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Bot Traffic</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 42, fontWeight: 700, color: '#ffaa00' }}>74.2%</span>
            <span style={{ fontSize: 14, color: '#666', marginTop: 4 }}>AI Pages</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 42, fontWeight: 700, color: '#ff6600' }}>50.3%</span>
            <span style={{ fontSize: 14, color: '#666', marginTop: 4 }}>AI Articles</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            display: 'flex',
            fontSize: 14,
            color: '#444',
          }}
        >
          Data from Europol • Imperva • Ahrefs • Cloudflare • Graphite
        </div>
      </div>
    ),
    { ...size }
  )
}
