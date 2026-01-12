import { NextRequest, NextResponse } from 'next/server'
import { extractCoinsWeighted, analyzeSentimentAdvanced, getSourceRank } from '@/lib/newsUtils'
import { analyzeSentimentWithVertexAI } from '@/lib/vertexAI'

// CoinGecko News API
const COINGECKO_NEWS_API = 'https://api.coingecko.com/api/v3/news'

// Cache storage for stale-while-revalidate
let cachedNews: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const STALE_DURATION = 30 * 60 * 1000 // 30 minutes (serve stale data up to 30 min)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const now = Date.now()

    // Stale-while-revalidate: Serve cached data if available, even if stale
    const isCacheValid = cachedNews && (now - cacheTimestamp) < CACHE_DURATION
    const isCacheStale = cachedNews && (now - cacheTimestamp) < STALE_DURATION

    // Try to fetch fresh data (non-blocking if we have stale cache)
    let fetchPromise: Promise<any> | null = null
    
    if (!isCacheValid) {
      fetchPromise = fetch(COINGECKO_NEWS_API, {
        next: { revalidate: 300 },
        headers: {
          'Accept': 'application/json',
        },
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }
        return response.json()
      })
    }

    // If we have stale cache, return it immediately while fetching in background
    if (isCacheStale && cachedNews) {
      // Return stale data immediately
      if (fetchPromise) {
        // Fetch fresh data in background (fire and forget)
        fetchPromise
          .then(data => {
            processNewsData(data, limit).then(processed => {
              cachedNews = processed
              cacheTimestamp = Date.now()
            })
          })
          .catch(err => {
            console.error('Background fetch failed:', err)
            // Keep using stale cache
          })
      }
      
      return NextResponse.json({
        success: true,
        data: cachedNews,
        timestamp: new Date(cacheTimestamp).toISOString(),
        source: 'coingecko',
        cached: true,
        stale: !isCacheValid,
      })
    }

    // Wait for fresh data
    if (fetchPromise) {
      const data = await fetchPromise
      const processed = await processNewsData(data, limit)
      cachedNews = processed
      cacheTimestamp = Date.now()
      
      return NextResponse.json({
        success: true,
        data: processed,
        timestamp: new Date().toISOString(),
        source: 'coingecko',
        cached: false,
      })
    }

    // Fallback if no cache and no fetch
    return NextResponse.json({
      success: true,
      data: getFallbackNews(),
      timestamp: new Date().toISOString(),
      source: 'fallback',
    })
  } catch (error: any) {
    console.error('News API error:', error)
    
    // Return cached data if available, even if stale
    if (cachedNews) {
      return NextResponse.json({
        success: true,
        data: cachedNews,
        timestamp: new Date(cacheTimestamp).toISOString(),
        source: 'coingecko',
        cached: true,
        stale: true,
        error: error.message,
      })
    }
    
    // Last resort: fallback news
    return NextResponse.json({
      success: true,
      data: getFallbackNews(),
      timestamp: new Date().toISOString(),
      source: 'fallback',
      error: error.message,
    })
  }
}

async function processNewsData(data: any, limit: number) {
  const newsItems = (data.data || []).slice(0, limit)
  
  // Process news items with Vertex AI (or fallback to keyword-based)
  const processedItems = await Promise.all(
    newsItems.map(async (item: any, index: number) => {
      const fullText = item.title + ' ' + (item.description || '')
      
      // Try Vertex AI first, fallback to keyword-based
      let sentimentResult
      try {
        const vertexResult = await analyzeSentimentWithVertexAI(item.title, item.description || '')
        sentimentResult = {
          sentiment: vertexResult.sentiment,
          confidence: vertexResult.confidence,
          keywords: vertexResult.keywords,
          reasoning: vertexResult.reasoning,
        }
      } catch (error) {
        // Fallback to keyword-based analysis
        sentimentResult = analyzeSentimentAdvanced(fullText)
      }
      
      // Weighted coin extraction
      const coinMentions = extractCoinsWeighted(fullText)
      const primaryCoin = coinMentions.find(c => c.isPrimary)
      const allCoins = sentimentResult.coins?.length 
        ? sentimentResult.coins 
        : coinMentions.map(c => c.coin)
      
      // Source authority
      const sourceInfo = getSourceRank(item.source || 'CoinGecko')
      
      return {
        id: item.id || `news-${index}`,
        title: item.title || 'Crypto News',
        description: item.description || '',
        source: item.source || 'CoinGecko',
        sourceRank: sourceInfo.rank,
        isVerified: sourceInfo.isVerified,
        sourceTier: sourceInfo.tier,
        url: item.url || item.news_url || '#',
        imageUrl: item.thumb_2x || item.thumb || null,
        publishedAt: new Date(item.created_at || Date.now()),
        sentiment: sentimentResult.sentiment,
        sentimentConfidence: sentimentResult.confidence,
        sentimentKeywords: sentimentResult.keywords || [],
        sentimentReasoning: sentimentResult.reasoning || null,
        coins: allCoins,
        primaryCoin: primaryCoin?.coin || allCoins[0] || null,
        tags: item.tags || [],
      }
    })
  )
  
  return processedItems
}


// Fallback news when API fails
function getFallbackNews() {
  return [
    {
      id: 'fallback-1',
      title: 'Bitcoin Reaches New Heights as Institutional Adoption Grows',
      description: 'Major institutions continue to adopt Bitcoin as a store of value, driving prices higher.',
      source: 'CoinDesk',
      sourceRank: 1,
      isVerified: true,
      sourceTier: 'tier1' as const,
      url: 'https://www.coindesk.com',
      imageUrl: null,
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      sentiment: 'bullish' as const,
      sentimentConfidence: 0.8,
      sentimentKeywords: ['adoption', 'growth'],
      coins: ['bitcoin'],
      primaryCoin: 'bitcoin',
      tags: ['bitcoin', 'institutional'],
    },
    {
      id: 'fallback-2',
      title: 'Ethereum Layer 2 Solutions See Record Transaction Volume',
      description: 'Layer 2 scaling solutions on Ethereum are processing more transactions than ever before.',
      source: 'DeFi Pulse',
      sourceRank: 2,
      isVerified: true,
      sourceTier: 'tier2' as const,
      url: 'https://www.defipulse.com',
      imageUrl: null,
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      sentiment: 'positive' as const,
      sentimentConfidence: 0.7,
      sentimentKeywords: ['record', 'growth'],
      coins: ['ethereum'],
      primaryCoin: 'ethereum',
      tags: ['ethereum', 'defi'],
    },
    {
      id: 'fallback-3',
      title: 'Regulatory Clarity Improves Market Confidence',
      description: 'New regulations provide clearer framework for crypto adoption.',
      source: 'CoinDesk',
      sourceRank: 1,
      isVerified: true,
      sourceTier: 'tier1' as const,
      url: 'https://www.coindesk.com',
      imageUrl: null,
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      sentiment: 'neutral' as const,
      sentimentConfidence: 0.5,
      sentimentKeywords: [],
      coins: [],
      primaryCoin: null,
      tags: ['regulation'],
    },
  ]
}
