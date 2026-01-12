import { NextRequest, NextResponse } from 'next/server'
import { generateAIReasoning } from '@/lib/vertexAI'

/**
 * Vertex AI Reasoning API
 * Explains why the AI thinks a coin is bullish/bearish
 */
export async function POST(request: NextRequest) {
  try {
    const { coin, currentPrice, marketData, newsItems } = await request.json()

    if (!coin || !currentPrice) {
      return NextResponse.json(
        { error: 'Coin and currentPrice are required' },
        { status: 400 }
      )
    }

    const reasoning = await generateAIReasoning(
      coin,
      currentPrice,
      marketData || {},
      newsItems || []
    )

    return NextResponse.json({
      success: true,
      reasoning,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Vertex AI reasoning API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate reasoning',
      },
      { status: 500 }
    )
  }
}
