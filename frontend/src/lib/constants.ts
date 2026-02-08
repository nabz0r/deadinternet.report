/**
 * App-wide constants.
 * Tier definitions, feature gates, and config.
 */

export const TIERS = {
  ghost: {
    name: 'Ghost',
    price: 0,
    features: ['Public dashboard', 'Global stats', 'Historical timeline'],
    scanLimit: 0,
    color: '#666666',
  },
  hunter: {
    name: 'Hunter',
    price: 9,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_HUNTER || '',
    features: [
      'Everything in Ghost',
      'Live URL scanner (10/day)',
      'Platform alerts',
      'PDF export',
      'Human Verified badge',
    ],
    scanLimit: 10,
    color: '#ff6600',
  },
  operator: {
    name: 'Operator',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_OPERATOR || '',
    features: [
      'Everything in Hunter',
      'Unlimited scanner',
      'API access (token)',
      'Bulk URL analysis',
      'Webhooks',
      'Priority support',
    ],
    scanLimit: 1000,
    color: '#ff2222',
  },
} as const

export type TierName = keyof typeof TIERS

/**
 * Check if a user tier has access to a feature.
 */
export function hasFeature(userTier: string, requiredTier: TierName): boolean {
  const levels: Record<string, number> = { ghost: 0, hunter: 1, operator: 2 }
  return (levels[userTier] || 0) >= (levels[requiredTier] || 0)
}
