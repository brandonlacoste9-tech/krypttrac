import { NextRequest, NextResponse } from 'next/server'
import { analyzeSentimentWithVertexAI } from '@/lib/vertexAI'

/**
 * Vertex AI Sentiment Analysis API
 * Replaces keyword-based analysis with Gemini 1.5 Flash
 */
export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const result = await analyzeSentimentWithVertexAI(title, description || '')

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Vertex AI sentiment API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze sentiment',
      },
      { status: 500 }
    )
  }
}
