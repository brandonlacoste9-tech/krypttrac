/**
 * Stripe Price IDs for Krypto Trac Modular Pricing
 */

export const STRIPE_PRICES = {
  CORE: process.env.NEXT_PUBLIC_STRIPE_CORE_PRICE_ID || 'price_1SosoMCzqBvMqSYFVV3lCc3q',
  DEFI: process.env.NEXT_PUBLIC_STRIPE_DEFI_PRICE_ID || 'price_1SosoSCzqBvMqSYF14JyKIhx',
  WHALE: process.env.NEXT_PUBLIC_STRIPE_WHALE_PRICE_ID || 'price_1SosoYCzqBvMqSYFs8uIc3vZ',
  MAGNUM: process.env.NEXT_PUBLIC_STRIPE_MAGNUM_PRICE_ID || 'price_1SosofCzqBvMqSYFUqAE9Plr',
} as const

export const FEATURE_NAMES = {
  core: 'Core Tracker',
  defi: 'DeFi Add-on',
  whale: 'Whale Watcher',
  magnum: 'Magnum Pro',
} as const

export const FEATURE_DESCRIPTIONS = {
  core: 'Access to all core tracking features',
  defi: 'DeFi execution and high-yield staking with Magnum Opus',
  whale: 'Real-time whale transaction alerts and analysis',
  magnum: 'Advanced Magnum Opus integration with 700%+ APY opportunities',
} as const

export const FEATURE_PRICES = {
  core: 10,
  defi: 10,
  whale: 5,
  magnum: 10,
} as const

export type FeatureType = 'core' | 'defi' | 'whale' | 'magnum'

export function getPriceId(feature: FeatureType): string {
  switch (feature) {
    case 'core':
      return STRIPE_PRICES.CORE
    case 'defi':
      return STRIPE_PRICES.DEFI
    case 'whale':
      return STRIPE_PRICES.WHALE
    case 'magnum':
      return STRIPE_PRICES.MAGNUM
    default:
      throw new Error(`Unknown feature: ${feature}`)
  }
}

export function getFeaturePrice(feature: FeatureType): number {
  return FEATURE_PRICES[feature]
}
