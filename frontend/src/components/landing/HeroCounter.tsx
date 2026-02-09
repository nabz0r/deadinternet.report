/**
 * Animated counter for hero stats.
 * Counts up from 0 to target value on mount.
 * Client component for landing page.
 */

'use client'

import { useState, useEffect, useRef } from 'react'

interface HeroCounterProps {
  target: number
  suffix?: string
  duration?: number
  color?: string
  decimals?: number
}

export default function HeroCounter({
  target,
  suffix = '%',
  duration = 2000,
  color = '#ff6600',
  decimals = 1,
}: HeroCounterProps) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setValue(target)
      }
    }
    requestAnimationFrame(animate)
  }, [started, target, duration])

  return (
    <span ref={ref} className="font-mono font-bold" style={{ color }}>
      {value.toFixed(decimals)}{suffix}
    </span>
  )
}
