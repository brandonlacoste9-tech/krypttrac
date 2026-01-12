import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

export async function GET(
  request: NextRequest,
  { params }: { params: { coinId: string } }
) {
  try {
    const { coinId } = params
    const searchParams = request.nextUrl.searchParams
    const days = searchParams.get('days') || '7'
    const vsCurrency = searchParams.get('vs_currency') || 'usd'

    // Fetch coin details and price history
    const [coinData, priceHistory] = await Promise.all([
      fetch(`${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`, {
        next: { revalidate: 60 },
      }),
      fetch(`${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`, {
        next: { revalidate: 60 },
      }),
    ])

    if (!coinData.ok || !priceHistory.ok) {
      throw new Error('Failed to fetch coin data')
    }

    const coin = await coinData.json()
    const history = await priceHistory.json()

    return NextResponse.json({
      success: true,
      data: {
        coin,
        priceHistory: history.prices,
        marketCapHistory: history.market_caps,
        volumeHistory: history.total_volumes,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Coin API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch coin data',
      },
      { status: 500 }
    )
  }
}
