import { Anthropic } from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { message, dashboardData, portfolioData } = await request.json()

    // Build market context from your dashboard
    const gainers = dashboardData?.gainers || []
    const losers = dashboardData?.losers || []
    const stablecoins = dashboardData?.stablecoins || []

    const marketContext = `
📊 LIVE KRYPTTRAC DATA (Built for Kings 👑)

🔥 MOOMIN' RIGHT NOW:
${gainers.slice(0, 3).map((c: any, i: number) =>
  `#${i+1} ${c.name}: ${c.price} (${c.change})`
).join('\n') || 'No gainers data'}

📉 TAKIN' L'S TODAY:
${losers.slice(0, 3).map((c: any, i: number) =>
  `#${i+1} ${c.name}: ${c.price} (${c.change})`
).join('\n') || 'No losers data'}

💵 STABLECOINS:
${stablecoins.map((c: any) =>
  `${c.symbol}: ${c.price} (${c.change})${parseFloat(c.price.replace(/,/g, '')) < 0.99 ? ' ⚠️ DE-PEG' : ''}`
).join('\n') || 'No stablecoin data'}

👑 YOUR EMPIRE:
${portfolioData ? JSON.stringify(portfolioData) : 'No portfolio connected'}
`

    const systemPrompt = `You are the Krypttrac AI - crypto advisor for KINGS 👑

${marketContext}

Your Personality:
- SHORT & DIRECT (2-3 sentences max)
- HYPE THE WINS 🚀
- WARN THE RISKS ⚠️
- USE CRYPTO SLANG (mooning, aping, diamond hands, rekt)
- BE REAL (no corporate talk)

Rules:
- Stablecoin < $0.99 → "⚠️ DE-PEG ALERT"
- Coin up >5% → "🔥 MOOMIN'"
- Coin down >3% → "📉 TAKIN' L's"
- Always reference LIVE data
- End with "NFA 👑" (Not Financial Advice)

Be the advisor kings deserve - smart, fast, and no BS.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast & cheap
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Unable to process request'

    return NextResponse.json({
      reply,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Agent error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
