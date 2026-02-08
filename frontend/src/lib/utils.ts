/**
 * Utility functions.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number with commas: 1234567 -> 1,234,567 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/** Format percentage: 0.742 -> 74.2% */
export function formatPct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`
}

/** Get a verdict color based on AI probability */
export function getVerdictColor(probability: number): string {
  if (probability < 0.3) return '#00cc66' // Human/safe green
  if (probability < 0.6) return '#ffaa00' // Mixed/amber
  return '#ff4444' // AI/red
}

/** Get verdict label */
export function getVerdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    human: 'Human Written',
    mixed: 'Mixed / Assisted',
    ai_generated: 'AI Generated',
  }
  return labels[verdict] || verdict
}
