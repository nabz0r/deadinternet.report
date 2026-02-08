/**
 * Dynamic favicon - renders the ☠️ skull + orange accent.
 * Next.js 14 serves this as /icon (favicon).
 */

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          border: '2px solid #ff6600',
        }}
      >
        <span style={{ fontSize: 20 }}>☠️</span>
      </div>
    ),
    { ...size }
  )
}
