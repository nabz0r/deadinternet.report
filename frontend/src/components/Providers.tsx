/**
 * Client-side providers wrapper.
 * NextAuth SessionProvider must be a client component.
 */

'use client'

import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
