# Vertex AI / Gemini Integration Setup

Krypto Trac now uses **Google Gemini 1.5 Flash** for advanced AI-powered sentiment analysis, whale transaction predictions, and market reasoning.

## Features Enabled

1. **Advanced Sentiment Analysis**: Replaces keyword matching with AI understanding
2. **Whale Transaction Predictions**: Analyzes patterns to predict price impact
3. **AI Market Reasoning**: Explains why coins are bullish/bearish
4. **Automatic Fallback**: Falls back to keyword-based analysis if API is unavailable

## Environment Variables

Add your Vertex AI / Gemini API key to `.env.local`:

```env
# Google Cloud / Vertex AI API Key
GOOGLE_CLOUD_API_KEY=your_api_key_here
# OR (alternative name)
NEXT_PUBLIC_VERTEX_AI_KEY=your_api_key_here
```

**Note**: The key you provided appears to be a Google API key. Add it as `GOOGLE_CLOUD_API_KEY`.

### Getting Your API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to `.env.local`

Or if using Vertex AI:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Vertex AI API
3. Create a service account and download the JSON key
4. Set up Application Default Credentials

## API Endpoints

### `/api/vertex/sentiment`
Analyzes news sentiment using Gemini 1.5 Flash.

**Request:**
```json
{
  "title": "Bitcoin surges to new all-time high",
  "description": "BTC breaks $100k barrier..."
}
```

**Response:**
```json
{
  "success": true,
  "sentiment": "bullish",
  "confidence": 85,
  "reasoning": "Strong positive price movement indicators...",
  "keywords": ["surge", "all-time high"],
  "coins": ["bitcoin", "BTC"],
  "timestamp": "2026-01-15T..."
}
```

### `/api/vertex/whale`
Analyzes whale transactions and predicts price impact.

**Request:**
```json
{
  "coin": "SOL",
  "amount": 10000000,
  "direction": "sell",
  "exchange": "Binance",
  "historicalData": [...]
}
```

**Response:**
```json
{
  "success": true,
  "prediction": "SOL price likely to drop 2-4% within 4 hours",
  "confidence": 75,
  "reasoning": "Historical analysis shows...",
  "timeframe": "4 hours",
  "impact": "high",
  "timestamp": "2026-01-15T..."
}
```

### `/api/vertex/reasoning`
Generates AI explanations for market conditions.

**Request:**
```json
{
  "coin": "ETH",
  "currentPrice": 3500,
  "marketData": {
    "change24h": 5.2,
    "marketCap": 420000000000
  },
  "newsItems": [...]
}
```

**Response:**
```json
{
  "success": true,
  "reasoning": "Ethereum is currently bullish due to...",
  "timestamp": "2026-01-15T..."
}
```

## Components

### `AIReasoning.tsx`
A React component that displays AI-powered market analysis.

```tsx
import { AIReasoning } from '@/components/AIReasoning'

<AIReasoning
  coin="BTC"
  currentPrice={100000}
  marketData={{
    change24h: 5.2,
    marketCap: 2000000000000
  }}
  newsItems={[...]}
/>
```

## Usage in News Feed

The news API (`/api/news`) automatically uses Vertex AI for sentiment analysis when available. If the API key is not configured, it falls back to keyword-based analysis.

## Cost Optimization

- **Gemini 1.5 Flash** is optimized for speed and cost-efficiency
- Temperature settings are tuned for consistent, professional results
- Requests are cached where possible to reduce API calls
- Automatic fallback ensures the app works even if the API is unavailable

## Security

- API key is stored server-side only (never exposed to frontend)
- All AI requests go through Next.js API routes
- Environment variables are not included in client-side bundles

## Testing

1. Add your API key to `.env.local`
2. Restart your Next.js dev server
3. Check the news feed - sentiment should show "Powered by Gemini" indicators
4. View a coin detail page - AI reasoning should appear automatically

## Troubleshooting

**"AI reasoning unavailable - service not configured"**
- Check that `GOOGLE_CLOUD_API_KEY` is set in `.env.local`
- Restart your dev server after adding the key

**"Failed to analyze sentiment"**
- Verify your API key is valid
- Check your Google Cloud billing/quota limits
- Review server logs for specific error messages

**Falling back to keyword-based analysis**
- This is expected if the API key is missing
- The app continues to work with basic sentiment analysis
