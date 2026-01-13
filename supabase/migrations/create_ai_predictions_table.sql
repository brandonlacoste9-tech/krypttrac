-- ============================================
-- Krypto Trac: AI Predictions with Proof of Alpha
-- Stores Vertex AI predictions with blockchain verification
-- ============================================

-- Create ai_predictions table
CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('price', 'sentiment', 'whale_movement', 'market_trend')),
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  prediction_data JSONB NOT NULL, -- Full prediction details
  confidence_score NUMERIC(5, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  time_horizon TEXT NOT NULL, -- '1h', '24h', '7d', '30d'
  predicted_value NUMERIC(20, 8), -- Predicted price or metric
  actual_value NUMERIC(20, 8), -- Actual value when time_horizon expires
  accuracy_score NUMERIC(5, 2), -- Calculated after prediction expires
  embedding vector(1536), -- Vector embedding for similarity search
  prediction_hash TEXT NOT NULL, -- SHA256 hash of prediction
  blockchain_tx_hash TEXT, -- Transaction hash when anchored to chain
  blockchain_network TEXT DEFAULT 'solana', -- 'solana', 'ethereum', 'polygon'
  block_number BIGINT, -- Block number where hash was anchored
  block_timestamp TIMESTAMPTZ, -- Timestamp of blockchain anchor
  verified BOOLEAN DEFAULT FALSE, -- True when blockchain anchor confirmed
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL -- When prediction should be evaluated
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_predictions_coin_id ON public.ai_predictions(coin_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON public.ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON public.ai_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_expires_at ON public.ai_predictions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_verified ON public.ai_predictions(verified) WHERE verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_ai_predictions_hash ON public.ai_predictions(prediction_hash);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS idx_ai_predictions_embedding ON public.ai_predictions 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read predictions (public transparency)
DROP POLICY IF EXISTS "Predictions are publicly readable" ON public.ai_predictions;
CREATE POLICY "Predictions are publicly readable"
  ON public.ai_predictions FOR SELECT
  USING (true);

-- RLS Policy: Only service_role can insert/update
DROP POLICY IF EXISTS "Service role can manage predictions" ON public.ai_predictions;
CREATE POLICY "Service role can manage predictions"
  ON public.ai_predictions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to generate prediction hash
CREATE OR REPLACE FUNCTION public.generate_prediction_hash(p_prediction_data JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Generate SHA256 hash of prediction data
  RETURN encode(digest(p_prediction_data::text, 'sha256'), 'hex');
END;
$$;

-- Function to find similar predictions (for accuracy tracking)
CREATE OR REPLACE FUNCTION public.find_similar_predictions(
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  coin_id TEXT,
  symbol TEXT,
  prediction_type TEXT,
  confidence_score NUMERIC,
  time_horizon TEXT,
  predicted_value NUMERIC,
  actual_value NUMERIC,
  accuracy_score NUMERIC,
  similarity NUMERIC,
  verified BOOLEAN,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.coin_id,
    ap.symbol,
    ap.prediction_type,
    ap.confidence_score,
    ap.time_horizon,
    ap.predicted_value,
    ap.actual_value,
    ap.accuracy_score,
    1 - (ap.embedding <=> p_query_embedding) as similarity,
    ap.verified,
    ap.blockchain_tx_hash,
    ap.created_at
  FROM public.ai_predictions ap
  WHERE ap.embedding IS NOT NULL
  ORDER BY ap.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

-- Function to calculate prediction accuracy
CREATE OR REPLACE FUNCTION public.calculate_prediction_accuracy(p_prediction_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prediction RECORD;
  v_accuracy NUMERIC;
BEGIN
  SELECT * INTO v_prediction
  FROM public.ai_predictions
  WHERE id = p_prediction_id;
  
  IF v_prediction.actual_value IS NULL THEN
    RETURN NULL; -- Prediction hasn't expired yet
  END IF;
  
  -- Calculate accuracy: 100 - (percentage error)
  IF v_prediction.predicted_value > 0 THEN
    v_accuracy := 100 - ABS(
      (v_prediction.actual_value - v_prediction.predicted_value) / 
      v_prediction.predicted_value * 100
    );
  ELSE
    v_accuracy := 0;
  END IF;
  
  -- Update prediction with accuracy score
  UPDATE public.ai_predictions
  SET accuracy_score = v_accuracy
  WHERE id = p_prediction_id;
  
  RETURN v_accuracy;
END;
$$;

COMMENT ON TABLE public.ai_predictions IS 'AI market predictions with blockchain-verified proof of alpha';
COMMENT ON FUNCTION public.generate_prediction_hash(JSONB) IS 'Generates SHA256 hash for blockchain anchoring';
COMMENT ON FUNCTION public.find_similar_predictions(vector, INTEGER) IS 'Finds similar predictions using vector similarity';
COMMENT ON FUNCTION public.calculate_prediction_accuracy(UUID) IS 'Calculates accuracy score for expired predictions';
