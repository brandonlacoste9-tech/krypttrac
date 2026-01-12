import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const endpoint = searchParams.get('endpoint') || 'markets'
    const limit = searchParams.get('limit') || '100'
    const vsCurrency = searchParams.get('vs_currency') || 'usd'

    let url = ''
    
    switch (endpoint) {
      case 'markets':
        url = `${COINGECKO_API}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
        break
      case 'trending':
        url = `${COINGECKO_API}/search/trending`
        break
      case 'global':
        url = `${COINGECKO_API}/global`
        break
      case 'gainers':
        url = `${COINGECKO_API}/coins/markets?vs_currency=${vsCurrency}&order=price_change_percentage_24h_desc&per_page=20&page=1&sparkline=true`
        break
      case 'losers':
        url = `${COINGECKO_API}/coins/markets?vs_currency=${vsCurrency}&order=price_change_percentage_24h_asc&per_page=20&page=1&sparkline=true`
        break
      case 'stablecoins':
        url = `${COINGECKO_API}/coins/markets?vs_currency=${vsCurrency}&category=stablecoins&order=market_cap_desc&per_page=20&page=1`
        break
      default:
        url = `${COINGECKO_API}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${limit}&page=1`
    }

    const response = await fetch(url, {
      next: { revalidate: 30 }, // Cache for 30 seconds
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Crypto API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch crypto data',
      },
      { status: 500 }
    )
  }
}
