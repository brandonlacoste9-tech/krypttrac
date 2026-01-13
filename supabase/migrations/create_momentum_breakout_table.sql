-- ============================================
-- Krypto Trac: Momentum Breakout Detection
-- Stores Vertex AI predictions for momentum breakouts
-- ============================================

-- Create momentum_signals table
CREATE TABLE IF NOT EXISTS public.momentum_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('breakout', 'breakdown', 'consolidation', 'reversal')),
  confidence_score NUMERIC(5, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  predicted_price NUMERIC(20, 8),
  predicted_timeframe TEXT NOT NULL, -- '5m', '15m', '1h', '4h', '24h'
  current_price NUMERIC(20, 8) NOT NULL,
  price_change_pct NUMERIC(10, 4), -- Expected price change percentage
  volume_surge_pct NUMERIC(10, 4), -- Volume increase percentage
  rsi NUMERIC(5, 2), -- Relative Strength Index
  macd_signal TEXT, -- 'bullish', 'bearish', 'neutral'
  support_level NUMERIC(20, 8),
  resistance_level NUMERIC(20, 8),
  vertex_ai_model_version TEXT DEFAULT 'momentum-breakout-v1',
  model_confidence NUMERIC(5, 2),
  feature_importance JSONB, -- Which factors drove the prediction
  market_context JSONB, -- Market conditions at time of prediction
  triggered BOOLEAN DEFAULT FALSE,
  executed_trade_id UUID, -- Reference to executed trade
  actual_outcome NUMERIC(20, 8), -- Actual price after timeframe
  prediction_accuracy NUMERIC(5, 2), -- Calculated accuracy
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_momentum_signals_coin_id ON public.momentum_signals(coin_id);
CREATE INDEX IF NOT EXISTS idx_momentum_signals_signal_type ON public.momentum_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_momentum_signals_confidence ON public.momentum_signals(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_momentum_signals_created_at ON public.momentum_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_momentum_signals_triggered ON public.momentum_signals(triggered) WHERE triggered = FALSE;
CREATE INDEX IF NOT EXISTS idx_momentum_signals_expires_at ON public.momentum_signals(expires_at);

-- Enable RLS
ALTER TABLE public.momentum_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read signals (public alpha)
DROP POLICY IF EXISTS "Signals are publicly readable" ON public.momentum_signals;
CREATE POLICY "Signals are publicly readable"
  ON public.momentum_signals FOR SELECT
  USING (true);

-- RLS Policy: Only service_role can insert/update
DROP POLICY IF EXISTS "Service role can manage signals" ON public.momentum_signals;
CREATE POLICY "Service role can manage signals"
  ON public.momentum_signals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to get active breakout signals
CREATE OR REPLACE FUNCTION public.get_active_breakouts(
  p_min_confidence NUMERIC DEFAULT 75.0,
  p_timeframe TEXT DEFAULT '1h'
)
RETURNS TABLE(
  id UUID,
  coin_id TEXT,
  symbol TEXT,
  signal_type TEXT,
  confidence_score NUMERIC,
  predicted_price NUMERIC,
  current_price NUMERIC,
  price_change_pct NUMERIC,
  volume_surge_pct NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.id,
    ms.coin_id,
    ms.symbol,
    ms.signal_type,
    ms.confidence_score,
    ms.predicted_price,
    ms.current_price,
    ms.price_change_pct,
    ms.volume_surge_pct,
    ms.created_at
  FROM public.momentum_signals ms
  WHERE ms.signal_type = 'breakout'
    AND ms.confidence_score >= p_min_confidence
    AND ms.predicted_timeframe = p_timeframe
    AND ms.triggered = FALSE
    AND ms.expires_at > NOW()
  ORDER BY ms.confidence_score DESC, ms.created_at DESC
  LIMIT 20;
END;
$$;

-- Function to calculate prediction accuracy
CREATE OR REPLACE FUNCTION public.calculate_momentum_accuracy(p_signal_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signal RECORD;
  v_accuracy NUMERIC;
BEGIN
  SELECT * INTO v_signal
  FROM public.momentum_signals
  WHERE id = p_signal_id;
  
  IF v_signal.actual_outcome IS NULL THEN
    RETURN NULL; -- Signal hasn't expired yet
  END IF;
  
  -- Calculate accuracy: how close was the prediction?
  IF v_signal.predicted_price > 0 AND v_signal.current_price > 0 THEN
    v_accuracy := 100 - ABS(
      (v_signal.actual_outcome - v_signal.predicted_price) / 
      v_signal.current_price * 100
    );
  ELSE
    v_accuracy := 0;
  END IF;
  
  -- Update signal with accuracy
  UPDATE public.momentum_signals
  SET prediction_accuracy = v_accuracy
  WHERE id = p_signal_id;
  
  RETURN v_accuracy;
END;
$$;

COMMENT ON TABLE public.momentum_signals IS 'Vertex AI momentum breakout predictions for jump trades';
COMMENT ON FUNCTION public.get_active_breakouts(NUMERIC, TEXT) IS 'Returns active breakout signals above confidence threshold';
COMMENT ON FUNCTION public.calculate_momentum_accuracy(UUID) IS 'Calculates accuracy score for expired momentum predictions';
