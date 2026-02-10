/**
 * Toast notification system.
 * Stacks multiple toasts, auto-dismisses, terminal aesthetic.
 */

'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✗',
  info: '◈',
}

const COLORS: Record<ToastType, { border: string; text: string; bg: string }> = {
  success: { border: 'border-dead-safe', text: 'text-dead-safe', bg: 'bg-dead-safe/5' },
  error: { border: 'border-dead-danger', text: 'text-dead-danger', bg: 'bg-dead-danger/5' },
  info: { border: 'border-dead-accent', text: 'text-dead-accent', bg: 'bg-dead-accent/5' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
        {toasts.map((t) => {
          const c = COLORS[t.type]
          return (
            <div
              key={t.id}
              className={`${c.bg} ${c.border} border px-4 py-3 font-mono text-sm flex items-start gap-3 animate-slide-in-right shadow-lg cursor-pointer`}
              onClick={() => dismiss(t.id)}
            >
              <span className={`${c.text} text-base shrink-0`}>{ICONS[t.type]}</span>
              <span className="text-dead-text">{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
