/**
 * Hook: animated counter from 0 to target value.
 * Used for the gauges and stat cards on load.
 */

import { useState, useEffect } from 'react'

export function useCountUp(target: number, duration: number = 2000): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target === 0) return

    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(startValue + (target - startValue) * eased)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setValue(target)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration])

  return value
}
