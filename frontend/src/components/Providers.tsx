/**
 * Client-side providers wrapper.
 * SessionProvider for NextAuth + ToastProvider for notifications.
 */

'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/ui/Toast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
