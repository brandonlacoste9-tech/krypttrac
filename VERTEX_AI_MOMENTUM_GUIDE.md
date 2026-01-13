# Vertex AI Momentum Breakout Guide - Krypto Trac

## 🚀 Overview

This guide documents the Vertex AI-powered momentum breakout detection system that enables intelligent "jump trades" - automated trades triggered by AI-identified momentum breakouts.

## 🎯 How It Works

### 1. **Momentum Scanning** (Every 5 Minutes)

- pg_cron triggers scanner every 5 minutes
- Scans top 20 coins by market cap
- Calls Vertex AI Edge Function for each coin
- Analyzes technical indicators (RSI, MACD, volume, support/resistance)

### 2. **Vertex AI Analysis**

- Uses Gemini 1.5 Flash for real-time analysis
- Processes market features:
  - Price action (current, 24h change, high/low)
  - Volume surge percentage
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Support/Resistance levels
- Generates prediction:
  - Signal type (breakout/breakdown/consolidation/reversal)
  - Confidence score (0-100)
  - Predicted price
  - Expected price change percentage

### 3. **Signal Storage**

- Stores signals in `momentum_signals` table
- Tracks technical indicators
- Records feature importance
- Sets expiration based on timeframe

### 4. **Jump Trade Execution**

- User grants operator permissions (SIWE)
- High-confidence breakouts (≥80%) trigger notifications
- User can execute "jump trade" with one click
- Trade executed via Uniswap/1inch
- Revenue recorded (0.05% swap commission)

## 📊 Technical Indicators

### RSI (Relative Strength Index)
- **> 70**: Overbought (bearish signal)
- **< 30**: Oversold (bullish signal)
- **30-70**: Neutral

### MACD
- **MACD > Signal**: Bullish momentum
- **MACD < Signal**: Bearish momentum
- **Histogram**: Momentum strength

### Volume Surge
- **> 50%**: Significant volume increase
- Indicates strong interest
- Combined with price action = breakout signal

### Support/Resistance
- **Price near resistance + high volume**: Potential breakout
- **Price near support + high volume**: Potential bounce

## 🛠️ Setup Instructions

### Step 1: Create Tables

```sql
\i supabase/migrations/create_momentum_breakout_table.sql
```

### Step 2: Deploy Edge Functions

```bash
supabase functions deploy momentum-breakout
supabase functions deploy execute-jump-trade
```

### Step 3: Schedule Scanner

```sql
\i supabase/migrations/schedule_momentum_scan.sql
```

### Step 4: Configure Vertex AI

Set environment variables:
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_API_KEY` (or service account)

## 📱 Frontend Integration

### Display Active Breakouts

```typescript
import { getActiveBreakouts, subscribeToBreakouts } from '@/lib/momentum/breakout-client'

function MomentumDashboard() {
  const [breakouts, setBreakouts] = useState<MomentumSignal[]>([])
  
  useEffect(() => {
    // Load active breakouts
    getActiveBreakouts(80, '1h').then(setBreakouts)
    
    // Subscribe to new breakouts
    const channel = subscribeToBreakouts((signal) => {
      setBreakouts(prev => [signal, ...prev].slice(0, 10))
      showNotification(`🚀 Breakout detected: ${signal.symbol} (+${signal.price_change_pct}%)`)
    })
    
    return () => channel.unsubscribe()
  }, [])
  
  return (
    <div>
      {breakouts.map(signal => (
        <BreakoutCard
          key={signal.id}
          signal={signal}
          onExecute={() => executeJumpTrade(signal.id, 1000)}
        />
      ))}
    </div>
  )
}
```

### Execute Jump Trade

```typescript
import { executeJumpTrade } from '@/lib/momentum/breakout-client'

async function handleJumpTrade(signalId: string, amount: number) {
  // User must sign message granting operator permissions
  const message = `Grant Krypto Trac permission to execute jump trade for signal ${signalId}`
  const signature = await wallet.signMessage(message)
  
  const result = await executeJumpTrade(signalId, amount, signature)
  
  if (result.success) {
    showNotification(`✅ Trade executed: ${result.trade.tx_hash}`)
  }
}
```

## 🎯 Signal Types

### Breakout
- Price breaks above resistance
- High volume surge
- Bullish MACD
- **Action**: Buy signal

### Breakdown
- Price breaks below support
- High volume surge
- Bearish MACD
- **Action**: Sell signal

### Consolidation
- Price trading in range
- Low volatility
- **Action**: Wait

### Reversal
- Price reversing trend
- RSI extreme (oversold/overbought)
- **Action**: Counter-trend trade

## 📈 Performance Metrics

### Accuracy Tracking

```sql
-- Get prediction accuracy
SELECT 
  signal_type,
  AVG(prediction_accuracy) as avg_accuracy,
  COUNT(*) as total_signals,
  COUNT(*) FILTER (WHERE prediction_accuracy >= 80) as high_accuracy_count
FROM momentum_signals
WHERE prediction_accuracy IS NOT NULL
GROUP BY signal_type;
```

### Revenue from Jump Trades

```sql
-- Revenue from momentum trades
SELECT 
  DATE(created_at) as day,
  COUNT(*) as trades_executed,
  SUM(amount * 0.0005) as swap_revenue -- 0.05% commission
FROM transactions
WHERE metadata->>'signal_id' IS NOT NULL
GROUP BY day
ORDER BY day DESC;
```

## 🔐 Security

- ✅ **SIWE Verification**: Operator permissions verified via signature
- ✅ **Confidence Threshold**: Only high-confidence signals (≥80%) trigger trades
- ✅ **User Control**: User must explicitly execute trades
- ✅ **Non-Custodial**: User's wallet executes, not our system

## 🚀 Future Enhancements

1. **Custom AutoML Model**: Train Vertex AI AutoML tabular model on historical data
2. **Multi-Timeframe Analysis**: Combine signals from multiple timeframes
3. **Portfolio-Level Signals**: Analyze entire portfolio for rebalancing
4. **Risk Management**: Stop-loss and take-profit automation
5. **Backtesting**: Test strategies on historical data

## 📚 Resources

- [Vertex AI AutoML](https://cloud.google.com/vertex-ai/docs/tabular-data/overview)
- [Technical Analysis Indicators](https://www.investopedia.com/technical-analysis-4689657)
- [Uniswap SDK](https://docs.uniswap.org/sdk/v3/overview)

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-XX  
**Maintained By**: Krypto Trac Team
