/**
 * Mobile bottom navigation bar.
 * Shown on small screens only. Fixed to bottom.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { hasFeature } from '@/lib/constants'

export default function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const tier = session?.user?.tier || 'ghost'

  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: '◉' },
    ...(hasFeature(tier, 'hunter')
      ? [{ href: '/dashboard/history', label: 'History', icon: '◈' }]
      : []),
    { href: '/pricing', label: 'Pricing', icon: '▲' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dead-surface/95 backdrop-blur-sm border-t border-dead-border z-40 md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 font-mono text-xs transition-colors ${
                active
                  ? 'text-dead-accent'
                  : 'text-dead-dim hover:text-dead-text'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
