-- ============================================
-- Krypto Trac: High-Performance Transactions Table
-- Optimized for whale detection and analytics
-- ============================================

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'transfer', 'stake', 'unstake')),
  amount NUMERIC(20, 8) NOT NULL,
  price_usd NUMERIC(20, 8) NOT NULL,
  total_value_usd NUMERIC(20, 2) NOT NULL,
  transaction_hash TEXT, -- Blockchain transaction hash
  from_address TEXT,
  to_address TEXT,
  network TEXT DEFAULT 'ethereum', -- 'ethereum', 'solana', 'polygon', etc.
  fee_usd NUMERIC(10, 2),
  exchange TEXT, -- 'binance', 'coinbase', 'uniswap', etc.
  is_whale BOOLEAN DEFAULT FALSE, -- Flag for large transactions
  whale_threshold_usd NUMERIC(20, 2) DEFAULT 1000000, -- $1M default
  notes TEXT, -- Encrypted notes using Supabase Vault
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_coin_id ON public.transactions(coin_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_is_whale ON public.transactions(is_whale) WHERE is_whale = TRUE;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_coin ON public.transactions(user_id, coin_id, created_at DESC);

-- Convert to TimescaleDB hypertable (if extension enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable(
      'public.transactions',
      'created_at',
      chunk_time_interval => INTERVAL '1 day',
      if_not_exists => TRUE
    );
    RAISE NOTICE '✅ Transactions table converted to TimescaleDB hypertable';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own transactions
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Public whale transactions (for alerts)
DROP POLICY IF EXISTS "Public can view whale transactions" ON public.transactions;
CREATE POLICY "Public can view whale transactions"
  ON public.transactions FOR SELECT
  USING (is_whale = TRUE AND user_id IS NULL); -- Only system-detected whales

-- Function to detect and flag whale transactions
CREATE OR REPLACE FUNCTION public.detect_whale_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Flag as whale if transaction value exceeds threshold
  IF NEW.total_value_usd >= COALESCE(NEW.whale_threshold_usd, 1000000) THEN
    NEW.is_whale := TRUE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-detect whale transactions
DROP TRIGGER IF EXISTS trigger_detect_whale ON public.transactions;
CREATE TRIGGER trigger_detect_whale
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_whale_transaction();

-- Function to get user portfolio summary
CREATE OR REPLACE FUNCTION public.get_user_portfolio(p_user_id UUID)
RETURNS TABLE(
  coin_id TEXT,
  symbol TEXT,
  total_amount NUMERIC,
  avg_price_usd NUMERIC,
  current_value_usd NUMERIC,
  total_cost_usd NUMERIC,
  profit_loss_usd NUMERIC,
  profit_loss_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH holdings AS (
    SELECT 
      t.coin_id,
      t.symbol,
      SUM(CASE WHEN t.transaction_type IN ('buy', 'stake') THEN t.amount ELSE -t.amount END) as total_amount,
      AVG(CASE WHEN t.transaction_type IN ('buy', 'stake') THEN t.price_usd END) as avg_price_usd,
      SUM(CASE WHEN t.transaction_type IN ('buy', 'stake') THEN t.total_value_usd ELSE -t.total_value_usd END) as total_cost_usd
    FROM public.transactions t
    WHERE t.user_id = p_user_id
    GROUP BY t.coin_id, t.symbol
    HAVING SUM(CASE WHEN t.transaction_type IN ('buy', 'stake') THEN t.amount ELSE -t.amount END) > 0
  ),
  current_prices AS (
    SELECT 
      ph.coin_id,
      ph.price_usd,
      ROW_NUMBER() OVER (PARTITION BY ph.coin_id ORDER BY ph.created_at DESC) as rn
    FROM public.price_history ph
  )
  SELECT 
    h.coin_id,
    h.symbol,
    h.total_amount,
    h.avg_price_usd,
    h.total_amount * cp.price_usd as current_value_usd,
    h.total_cost_usd,
    (h.total_amount * cp.price_usd) - h.total_cost_usd as profit_loss_usd,
    CASE 
      WHEN h.total_cost_usd > 0 
      THEN ((h.total_amount * cp.price_usd) - h.total_cost_usd) / h.total_cost_usd * 100
      ELSE 0
    END as profit_loss_pct
  FROM holdings h
  LEFT JOIN current_prices cp ON h.coin_id = cp.coin_id AND cp.rn = 1
  ORDER BY current_value_usd DESC NULLS LAST;
END;
$$;

COMMENT ON TABLE public.transactions IS 'User cryptocurrency transactions with whale detection';
COMMENT ON FUNCTION public.get_user_portfolio(UUID) IS 'Returns portfolio summary for a user with current values and P/L';
