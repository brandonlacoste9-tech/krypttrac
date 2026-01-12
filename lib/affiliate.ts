/**
 * Affiliate URL mapping utility
 * Maps coin symbols to exchange affiliate URLs for revenue generation
 */

interface AffiliateConfig {
  baseUrl: string
  refCode: string
  defaultExchange: string
}

const AFFILIATE_CONFIG: AffiliateConfig = {
  baseUrl: 'https://exchange.com', // Replace with your actual exchange affiliate URL
  refCode: 'KRYPTOTRAC',
  defaultExchange: 'binance', // or 'coinbase', 'kraken', etc.
}

// Map coin names to exchange-specific symbols if needed
const COIN_SYMBOL_MAP: { [key: string]: string } = {
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'solana': 'SOL',
  'cardano': 'ADA',
  'ripple': 'XRP',
  'polkadot': 'DOT',
  'chainlink': 'LINK',
  'litecoin': 'LTC',
  'dogecoin': 'DOGE',
  'avalanche': 'AVAX',
  'polygon': 'MATIC',
  'uniswap': 'UNI',
  'cosmos': 'ATOM',
  'algorand': 'ALGO',
  'binancecoin': 'BNB',
  'tether': 'USDT',
  'usd-coin': 'USDC',
}

/**
 * Generate affiliate URL for a coin
 * @param coinName - The coin name (e.g., 'bitcoin', 'solana')
 * @returns Affiliate URL string
 */
export function getAffiliateUrl(coinName: string): string {
  const symbol = COIN_SYMBOL_MAP[coinName.toLowerCase()] || coinName.toUpperCase()
  
  // Build affiliate URL
  // Format: https://exchange.com/register?ref=KRYPTOTRAC&coin=BTC
  const params = new URLSearchParams({
    ref: AFFILIATE_CONFIG.refCode,
    coin: symbol,
    source: 'kryptotrac',
  })
  
  return `${AFFILIATE_CONFIG.baseUrl}/register?${params.toString()}`
}

/**
 * Get coin symbol from coin name
 */
export function getCoinSymbol(coinName: string): string {
  return COIN_SYMBOL_MAP[coinName.toLowerCase()] || coinName.toUpperCase()
}

/**
 * Check if affiliate tracking is enabled
 */
export function isAffiliateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_AFFILIATES === 'true' || true // Default to true for demo
}
