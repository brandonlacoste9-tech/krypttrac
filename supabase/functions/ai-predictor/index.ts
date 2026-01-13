// ============================================
// Krypto Trac: AI Predictor Edge Function
// Uses Vertex AI to generate market predictions
// Anchors predictions to blockchain for proof of alpha
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { VertexAI } from 'https://esm.sh/@google-cloud/vertexai@latest'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PredictionRequest {
  coin_id: string
  symbol: string
  prediction_type: 'price' | 'sentiment' | 'whale_movement' | 'market_trend'
  time_horizon: '1h' | '24h' | '7d' | '30d'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { coin_id, symbol, prediction_type, time_horizon }: PredictionRequest = await req.json()

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')!,
      location: 'us-central1',
    })

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    })

    // Fetch current market data
    const { data: latestPrice } = await supabase
      .from('price_history')
      .select('*')
      .eq('coin_id', coin_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Fetch recent news
    const { data: recentNews } = await supabase
      .from('news_embeddings')
      .select('title, content, sentiment, coins_mentioned')
      .contains('coins_mentioned', [symbol.toUpperCase()])
      .order('published_at', { ascending: false })
      .limit(5)

    // Build prediction prompt
    const prompt = `
You are an expert cryptocurrency market analyst. Analyze the following data and make a prediction for ${symbol} (${coin_id}).

Current Price: $${latestPrice?.price_usd || 'N/A'}
24h Change: ${latestPrice?.price_change_percentage_24h || 0}%
Market Cap: $${latestPrice?.market_cap_usd || 'N/A'}

Recent News Sentiment:
${recentNews?.map(n => `- ${n.title}: ${n.sentiment}`).join('\n') || 'No recent news'}

Prediction Type: ${prediction_type}
Time Horizon: ${time_horizon}

Provide:
1. Predicted ${prediction_type === 'price' ? 'price' : 'outcome'}
2. Confidence score (0-100)
3. Reasoning (brief)
4. Key factors influencing the prediction

Format as JSON:
{
  "predicted_value": <number>,
  "confidence_score": <number>,
  "reasoning": "<text>",
  "key_factors": ["<factor1>", "<factor2>"]
}
`

    // Generate prediction with Vertex AI
    const result = await model.generateContent(prompt)
    const response = result.response
    const predictionText = response.text()

    // Parse prediction JSON
    const jsonMatch = predictionText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse prediction JSON')
    }

    const prediction = JSON.parse(jsonMatch[0])

    // Generate embedding for similarity search
    const embeddingModel = vertexAI.getGenerativeModel({
      model: 'text-embedding-004', // Use embedding model
    })

    const embeddingResult = await embeddingModel.embedContent(predictionText)
    const embedding = embeddingResult.embeddings[0].values

    // Create prediction data object
    const predictionData = {
      coin_id,
      symbol,
      prediction_type,
      time_horizon,
      predicted_value: prediction.predicted_value,
      confidence_score: prediction.confidence_score,
      reasoning: prediction.reasoning,
      key_factors: prediction.key_factors,
      current_price: latestPrice?.price_usd,
      timestamp: new Date().toISOString(),
    }

    // Generate prediction hash
    const hashResponse = await supabase.rpc('generate_prediction_hash', {
      p_prediction_data: predictionData,
    })

    const predictionHash = hashResponse.data || 
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(predictionData)))))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    // Calculate expiration time
    const expiresAt = new Date()
    switch (time_horizon) {
      case '1h':
        expiresAt.setHours(expiresAt.getHours() + 1)
        break
      case '24h':
        expiresAt.setHours(expiresAt.getHours() + 24)
        break
      case '7d':
        expiresAt.setDate(expiresAt.getDate() + 7)
        break
      case '30d':
        expiresAt.setDate(expiresAt.getDate() + 30)
        break
    }

    // Store prediction in database
    const { data: storedPrediction, error: insertError } = await supabase
      .from('ai_predictions')
      .insert({
        prediction_type,
        coin_id,
        symbol,
        prediction_data: predictionData,
        confidence_score: prediction.confidence_score,
        time_horizon,
        predicted_value: prediction.predicted_value,
        embedding: `[${embedding.join(',')}]`,
        prediction_hash: predictionHash,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Anchor hash to blockchain (call anchor function)
    const anchorResponse = await fetch(`${supabaseUrl}/functions/v1/anchor-prediction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        prediction_id: storedPrediction.id,
        prediction_hash: predictionHash,
      }),
    })

    const anchorResult = await anchorResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        prediction: {
          id: storedPrediction.id,
          coin_id,
          symbol,
          predicted_value: prediction.predicted_value,
          confidence_score: prediction.confidence_score,
          reasoning: prediction.reasoning,
          time_horizon,
          expires_at: expiresAt.toISOString(),
          prediction_hash: predictionHash,
          blockchain_tx_hash: anchorResult.tx_hash,
          verified: anchorResult.verified,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('AI predictor error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
