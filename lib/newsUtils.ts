/**
 * News utility functions for sentiment analysis and coin extraction
 */

export interface CoinMention {
  coin: string
  count: number
  isPrimary: boolean
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'bullish' | 'bearish'
  confidence: number
  keywords: string[]
}

/**
 * Weighted coin extraction - counts frequency of mentions
 */
export function extractCoinsWeighted(text: string): CoinMention[] {
  const lowerText = text.toLowerCase()
  const coinMap: { [key: string]: string[] } = {
    'bitcoin': ['bitcoin', 'btc'],
    'ethereum': ['ethereum', 'eth'],
    'solana': ['solana', 'sol'],
    'cardano': ['cardano', 'ada'],
    'ripple': ['ripple', 'xrp'],
    'polkadot': ['polkadot', 'dot'],
    'chainlink': ['chainlink', 'link'],
    'litecoin': ['litecoin', 'ltc'],
    'dogecoin': ['dogecoin', 'doge'],
    'avalanche': ['avalanche', 'avax'],
    'polygon': ['polygon', 'matic'],
    'uniswap': ['uniswap', 'uni'],
    'cosmos': ['cosmos', 'atom'],
    'algorand': ['algorand', 'algo'],
    'binancecoin': ['binance coin', 'bnb', 'binance'],
    'tether': ['tether', 'usdt'],
    'usd-coin': ['usd coin', 'usdc'],
    'stellar': ['stellar', 'xlm'],
    'vechain': ['vechain', 'vet'],
    'filecoin': ['filecoin', 'fil'],
    'the-graph': ['the graph', 'grt'],
    'aave': ['aave'],
    'compound': ['compound', 'comp'],
    'maker': ['maker', 'mkr'],
    'curve-dao-token': ['curve', 'crv'],
  }

  const mentions: { [coin: string]: number } = {}

  // Count mentions for each coin
  for (const [coin, keywords] of Object.entries(coinMap)) {
    let count = 0
    for (const keyword of keywords) {
      // Count occurrences of keyword in text
      const regex = new RegExp(keyword, 'gi')
      const matches = lowerText.match(regex)
      if (matches) {
        count += matches.length
      }
    }
    if (count > 0) {
      mentions[coin] = count
    }
  }

  // Convert to array and sort by count
  const coinMentions: CoinMention[] = Object.entries(mentions)
    .map(([coin, count]) => ({ coin, count, isPrimary: false }))
    .sort((a, b) => b.count - a.count)

  // Mark the highest count as primary
  if (coinMentions.length > 0) {
    coinMentions[0].isPrimary = true
  }

  return coinMentions
}

/**
 * Advanced sentiment analysis with bullish/bearish terminology
 */
export function analyzeSentimentAdvanced(text: string): SentimentResult {
  const lowerText = text.toLowerCase()
  
  // Extended positive/bullish keywords
  const positiveWords = [
    'surge', 'rise', 'gain', 'up', 'bullish', 'rally', 'growth', 'adoption',
    'breakthrough', 'success', 'milestone', 'record', 'high', 'moon', 'pump',
    'approval', 'launch', 'partnership', 'expansion', 'profit', 'win',
    'breakout', 'resistance', 'support', 'momentum', 'uptrend', 'bull run',
    'etf approval', 'institutional', 'adoption', 'integration', 'upgrade',
    'all-time high', 'ath', 'soaring', 'climbing', 'gaining', 'strengthening'
  ]
  
  // Extended negative/bearish keywords
  const negativeWords = [
    'crash', 'drop', 'fall', 'down', 'bearish', 'decline', 'loss', 'hack',
    'scam', 'fraud', 'ban', 'regulation', 'warning', 'risk', 'volatility',
    'concern', 'fear', 'sell', 'dump', 'rekt', 'failure', 'liquidated',
    'liquidation', 'support broken', 'resistance', 'downtrend', 'bear market',
    'correction', 'plunge', 'tumble', 'slump', 'weakening', 'fading'
  ]
  
  // Count matches
  const positiveMatches = positiveWords.filter(word => lowerText.includes(word))
  const negativeMatches = negativeWords.filter(word => lowerText.includes(word))
  
  const positiveCount = positiveMatches.length
  const negativeCount = negativeMatches.length
  
  // Determine sentiment
  let sentiment: 'positive' | 'negative' | 'neutral' | 'bullish' | 'bearish'
  let confidence = 0
  
  if (positiveCount > negativeCount * 1.5) {
    // Strong positive - use "bullish" if trading terms present
    const hasTradingTerms = positiveMatches.some(word => 
      ['breakout', 'resistance', 'uptrend', 'bull run', 'momentum'].includes(word)
    )
    sentiment = hasTradingTerms ? 'bullish' : 'positive'
    confidence = Math.min(positiveCount / 10, 1)
  } else if (negativeCount > positiveCount * 1.5) {
    // Strong negative - use "bearish" if trading terms present
    const hasTradingTerms = negativeMatches.some(word => 
      ['liquidated', 'liquidation', 'downtrend', 'bear market', 'support broken'].includes(word)
    )
    sentiment = hasTradingTerms ? 'bearish' : 'negative'
    confidence = Math.min(negativeCount / 10, 1)
  } else {
    sentiment = 'neutral'
    confidence = 0.5
  }
  
  return {
    sentiment,
    confidence,
    keywords: [...positiveMatches, ...negativeMatches].slice(0, 5),
  }
}

/**
 * Get source authority rank
 */
export function getSourceRank(source: string): {
  rank: number
  isVerified: boolean
  tier: 'tier1' | 'tier2' | 'tier3'
} {
  const lowerSource = source.toLowerCase()
  
  // Tier 1: Major news outlets
  const tier1Sources = [
    'reuters', 'bloomberg', 'coindesk', 'cointelegraph', 'the block',
    'forbes', 'wsj', 'wall street journal', 'financial times', 'ft'
  ]
  
  // Tier 2: Established crypto media
  const tier2Sources = [
    'decrypt', 'cryptonews', 'cryptoslate', 'u today', 'beincrypto',
    'bitcoin magazine', 'defi pulse', 'messari', 'crypto compare'
  ]
  
  // Tier 3: Others
  const isTier1 = tier1Sources.some(t => lowerSource.includes(t))
  const isTier2 = tier2Sources.some(t => lowerSource.includes(t))
  
  if (isTier1) {
    return { rank: 1, isVerified: true, tier: 'tier1' }
  } else if (isTier2) {
    return { rank: 2, isVerified: true, tier: 'tier2' }
  } else {
    return { rank: 3, isVerified: false, tier: 'tier3' }
  }
}
