/**
 * Hook: real-time extrapolation counter.
 * Given a rate per second, calculates a live increasing value
 * for "pages generated since you arrived" type counters.
 *
 * Example: ~1.5M new AI pages per day = ~17.4 per second
 */

import { useState, useEffect, useRef } from 'react'

export function useExtrapolation(ratePerSecond: number): number {
  const [count, setCount] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      setCount(Math.floor(elapsed * ratePerSecond))
    }, 100)

    return () => clearInterval(interval)
  }, [ratePerSecond])

  return count
}
