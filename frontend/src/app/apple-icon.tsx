/**
 * Apple Touch Icon (180x180).
 */

import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 32,
        }}
      >
        <span style={{ fontSize: 100 }}>☠️</span>
      </div>
    ),
    { ...size }
  )
}
