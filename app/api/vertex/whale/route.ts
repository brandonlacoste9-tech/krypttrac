import { NextRequest, NextResponse } from 'next/server'
import { analyzeWhaleTransaction } from '@/lib/vertexAI'

/**
 * Vertex AI Whale Transaction Analysis API
 * Predicts price impact based on whale movements
 */
export async function POST(request: NextRequest) {
  try {
    const { coin, amount, direction, exchange, historicalData } = await request.json()

    if (!coin || !amount || !direction) {
      return NextResponse.json(
        { error: 'Coin, amount, and direction are required' },
        { status: 400 }
      )
    }

    const result = await analyzeWhaleTransaction(
      coin,
      amount,
      direction,
      exchange || 'unknown',
      historicalData
    )

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Vertex AI whale analysis API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze whale transaction',
      },
      { status: 500 }
    )
  }
}
