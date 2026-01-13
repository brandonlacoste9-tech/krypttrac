-- ============================================
-- Krypto Trac: High-Performance Price History Table
-- Uses TimescaleDB for time-series optimization
-- ============================================

-- Create price_history table
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  price_usd NUMERIC(20, 8) NOT NULL,
  market_cap_usd NUMERIC(20, 2),
  volume_24h_usd NUMERIC(20, 2),
  price_change_24h NUMERIC(10, 4),
  price_change_percentage_24h NUMERIC(10, 4),
  high_24h NUMERIC(20, 8),
  low_24h NUMERIC(20, 8),
  source TEXT DEFAULT 'coingecko', -- 'coingecko', 'binance', 'aggregated'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_price_history_coin_id ON public.price_history(coin_id);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON public.price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON public.price_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_coin_created ON public.price_history(coin_id, created_at DESC);

-- Convert to TimescaleDB hypertable (if extension enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    -- Convert to hypertable with 1-hour chunks
    PERFORM create_hypertable(
      'public.price_history',
      'created_at',
      chunk_time_interval => INTERVAL '1 hour',
      if_not_exists => TRUE
    );
    RAISE NOTICE '✅ Price history table converted to TimescaleDB hypertable';
  ELSE
    RAISE NOTICE '⚠️  TimescaleDB not enabled - using standard PostgreSQL partitioning';
    
    -- Fallback: Create monthly partitions manually
    CREATE TABLE IF NOT EXISTS public.price_history_y2026m01 
    PARTITION OF public.price_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read price history (public data)
DROP POLICY IF EXISTS "Price history is publicly readable" ON public.price_history;
CREATE POLICY "Price history is publicly readable"
  ON public.price_history FOR SELECT
  USING (true);

-- RLS Policy: Only service_role can insert/update
DROP POLICY IF EXISTS "Service role can manage price history" ON public.price_history;
CREATE POLICY "Service role can manage price history"
  ON public.price_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to get latest price for a coin
CREATE OR REPLACE FUNCTION public.get_latest_price(p_coin_id TEXT)
RETURNS TABLE(
  coin_id TEXT,
  symbol TEXT,
  price_usd NUMERIC,
  price_change_24h NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.coin_id,
    ph.symbol,
    ph.price_usd,
    ph.price_change_percentage_24h,
    ph.created_at
  FROM public.price_history ph
  WHERE ph.coin_id = p_coin_id
  ORDER BY ph.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to get price history for a coin (last N hours)
CREATE OR REPLACE FUNCTION public.get_price_history(
  p_coin_id TEXT,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  price_usd NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.price_usd,
    ph.created_at
  FROM public.price_history ph
  WHERE ph.coin_id = p_coin_id
    AND ph.created_at > NOW() - (p_hours || ' hours')::INTERVAL
  ORDER BY ph.created_at ASC;
END;
$$;

COMMENT ON TABLE public.price_history IS 'Time-series price history for all tracked cryptocurrencies';
COMMENT ON FUNCTION public.get_latest_price(TEXT) IS 'Returns the latest price for a given coin';
COMMENT ON FUNCTION public.get_price_history(TEXT, INTEGER) IS 'Returns price history for a coin over the last N hours';
