/**
 * Vertex AI / Gemini Service for Advanced Sentiment Analysis and Reasoning
 * Uses Gemini 1.5 Flash for fast, accurate analysis
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const VERTEX_AI_API_KEY = process.env.GOOGLE_CLOUD_API_KEY || process.env.NEXT_PUBLIC_VERTEX_AI_KEY || ''

// Initialize Gemini AI client
const genAI = VERTEX_AI_API_KEY ? new GoogleGenerativeAI(VERTEX_AI_API_KEY) : null

interface SentimentResult {
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'positive' | 'negative'
  confidence: number // 0-100
  reasoning: string
  keywords: string[]
  coins: string[]
}

interface WhaleAnalysis {
  prediction: string
  confidence: number
  reasoning: string
  timeframe: string
  impact: 'high' | 'medium' | 'low'
}

/**
 * Advanced sentiment analysis using Gemini 1.5 Flash
 * Replaces keyword-based analysis with AI-powered understanding
 */
export async function analyzeSentimentWithVertexAI(
  title: string,
  description: string = ''
): Promise<SentimentResult> {
  if (!genAI || !VERTEX_AI_API_KEY) {
    // Fallback to keyword-based if no API key
    return analyzeSentimentFallback(title + ' ' + description)
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
        topP: 0.95,
        topK: 40,
      },
    })

    const prompt = `You are an expert cryptocurrency market analyst. Analyze the following news article and provide sentiment analysis.

Title: ${title}
Description: ${description}

Provide your analysis in this exact JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral" | "positive" | "negative",
  "confidence": 0-100,
  "reasoning": "Brief explanation (1-2 sentences)",
  "keywords": ["keyword1", "keyword2"],
  "coins": ["bitcoin", "ethereum", etc.]
}

Rules:
- Use "bullish" or "bearish" for trading/price movement sentiment
- Use "positive" or "negative" for general news sentiment
- Confidence should reflect how certain you are (higher = more certain)
- Extract all mentioned cryptocurrencies
- Focus on trading implications, not just general positivity/negativity

JSON response only:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from response (may include markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}'
    const parsed = JSON.parse(jsonStr)

    return {
      sentiment: parsed.sentiment || 'neutral',
      confidence: parsed.confidence || 50,
      reasoning: parsed.reasoning || 'AI analysis completed',
      keywords: parsed.keywords || [],
      coins: parsed.coins || [],
    }
  } catch (error) {
    console.error('Vertex AI sentiment analysis error:', error)
    // Fallback to keyword-based analysis
    return analyzeSentimentFallback(title + ' ' + description)
  }
}

/**
 * Analyze whale transaction patterns with Vertex AI
 * Predicts price impact based on historical patterns
 */
export async function analyzeWhaleTransaction(
  coin: string,
  amount: number,
  direction: 'buy' | 'sell',
  exchange: string,
  historicalData?: any[]
): Promise<WhaleAnalysis> {
  if (!genAI || !VERTEX_AI_API_KEY) {
    return {
      prediction: 'Unable to analyze - AI service unavailable',
      confidence: 0,
      reasoning: 'Vertex AI not configured',
      timeframe: 'Unknown',
      impact: 'low',
    }
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2, // Lower temperature for more consistent predictions
        maxOutputTokens: 300,
      },
    })

    const historyContext = historicalData
      ? `Historical patterns from last ${historicalData.length} similar transactions: ${JSON.stringify(historicalData.slice(0, 10))}`
      : 'No historical data available'

    const prompt = `You are an expert cryptocurrency analyst specializing in whale transaction impact prediction.

Whale Transaction:
- Coin: ${coin}
- Amount: $${amount.toLocaleString()}
- Direction: ${direction}
- Exchange: ${exchange}

${historyContext}

Based on historical whale transaction patterns, predict:
1. Likely price impact (percentage change)
2. Timeframe for impact (e.g., "within 4 hours", "next 24 hours")
3. Confidence level (0-100)
4. Reasoning for your prediction

Provide your analysis in this exact JSON format:
{
  "prediction": "SOL price likely to drop 2-4% within 4 hours",
  "confidence": 75,
  "reasoning": "Historical analysis shows 70% of large sell orders to Binance result in price drops within 4 hours",
  "timeframe": "4 hours",
  "impact": "high" | "medium" | "low"
}

JSON response only:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}'
    const parsed = JSON.parse(jsonStr)

    return {
      prediction: parsed.prediction || 'Unable to predict',
      confidence: parsed.confidence || 50,
      reasoning: parsed.reasoning || 'Analysis completed',
      timeframe: parsed.timeframe || 'Unknown',
      impact: parsed.impact || 'medium',
    }
  } catch (error) {
    console.error('Vertex AI whale analysis error:', error)
    return {
      prediction: 'Analysis unavailable',
      confidence: 0,
      reasoning: 'AI service error',
      timeframe: 'Unknown',
      impact: 'low',
    }
  }
}

/**
 * Generate AI reasoning explanation for coin analysis
 * Explains why the AI thinks a coin is bullish/bearish
 */
export async function generateAIReasoning(
  coin: string,
  currentPrice: number,
  marketData: any,
  newsItems: any[]
): Promise<string> {
  if (!genAI || !VERTEX_AI_API_KEY) {
    return 'AI reasoning unavailable - service not configured'
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 200,
      },
    })

    const newsSummary = newsItems
      .slice(0, 5)
      .map(item => `- ${item.title} (${item.sentiment})`)
      .join('\n')

    const prompt = `You are a cryptocurrency analyst explaining market reasoning to a sophisticated trader.

Coin: ${coin}
Current Price: $${currentPrice.toLocaleString()}
24h Change: ${marketData.change24h || 'N/A'}
Market Cap: $${marketData.marketCap || 'N/A'}

Recent News:
${newsSummary}

Provide a concise (2-3 sentences) explanation of why this coin is currently bullish, bearish, or neutral. 
Be specific, reference recent news, and use crypto trading terminology.
Format as plain text (no markdown).`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text() || 'Unable to generate reasoning'
  } catch (error) {
    console.error('Vertex AI reasoning error:', error)
    return 'AI reasoning unavailable'
  }
}

/**
 * Fallback keyword-based sentiment analysis
 * Used when Vertex AI is unavailable
 */
function analyzeSentimentFallback(text: string): SentimentResult {
  const lowerText = text.toLowerCase()
  
  const positiveWords = [
    'surge', 'rise', 'gain', 'up', 'bullish', 'rally', 'growth', 'adoption',
    'breakthrough', 'success', 'milestone', 'record', 'high', 'moon', 'pump',
    'approval', 'launch', 'partnership', 'expansion', 'profit', 'win',
    'breakout', 'resistance', 'momentum', 'uptrend', 'bull run',
  ]
  
  const negativeWords = [
    'crash', 'drop', 'fall', 'down', 'bearish', 'decline', 'loss', 'hack',
    'scam', 'fraud', 'ban', 'regulation', 'warning', 'risk', 'volatility',
    'concern', 'fear', 'sell', 'dump', 'rekt', 'failure',
    'liquidated', 'liquidation', 'downtrend', 'bear market', 'support broken',
  ]
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  let sentiment: 'bullish' | 'bearish' | 'neutral' | 'positive' | 'negative'
  let confidence = 50

  if (positiveCount > negativeCount * 1.5) {
    sentiment = 'bullish'
    confidence = Math.min(positiveCount * 10, 85)
  } else if (negativeCount > positiveCount * 1.5) {
    sentiment = 'bearish'
    confidence = Math.min(negativeCount * 10, 85)
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive'
    confidence = 60
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative'
    confidence = 60
  } else {
    sentiment = 'neutral'
    confidence = 50
  }

  return {
    sentiment,
    confidence,
    reasoning: 'Keyword-based analysis',
    keywords: [],
    coins: [],
  }
}
