-- ============================================
-- Krypto Trac: Monetization Engine
-- Tracks revenue from all features in real-time
-- ============================================

-- Create transaction_history table for revenue tracking
CREATE TABLE IF NOT EXISTS public.transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'rebalance_profit',
    'swap_execution',
    'staking_referral',
    'emergency_protection',
    'premium_subscription',
    'vault_service',
    'custom_indexer',
    'sponsored_alert'
  )),
  amount NUMERIC(20, 8) NOT NULL, -- Transaction amount in USD
  fee_percentage NUMERIC(5, 4) NOT NULL, -- Fee percentage (e.g., 0.001 = 0.1%)
  fee_amount NUMERIC(20, 8) NOT NULL, -- Calculated fee amount
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}', -- Additional transaction details
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'failed')),
  collected_at TIMESTAMPTZ,
  collection_tx_hash TEXT, -- Blockchain transaction hash if collected on-chain
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transaction_history_user_id ON public.transaction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_type ON public.transaction_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_history_created_at ON public.transaction_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_history_status ON public.transaction_history(status);
CREATE INDEX IF NOT EXISTS idx_transaction_history_date ON public.transaction_history(DATE(created_at));

-- Convert to TimescaleDB hypertable (if extension enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable(
      'public.transaction_history',
      'created_at',
      chunk_time_interval => INTERVAL '1 day',
      if_not_exists => TRUE
    );
    RAISE NOTICE '✅ Transaction history converted to TimescaleDB hypertable';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transaction_history;
CREATE POLICY "Users can view own transactions"
  ON public.transaction_history FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all transactions
DROP POLICY IF EXISTS "Service role can manage transactions" ON public.transaction_history;
CREATE POLICY "Service role can manage transactions"
  ON public.transaction_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create monetization_analytics view
CREATE OR REPLACE VIEW public.monetization_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as day,
  
  -- 1. Performance Fees: 0.1% of profits from Auto-Pilot rebalancing
  SUM(CASE 
    WHEN transaction_type = 'rebalance_profit' AND status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as performance_revenue,
  
  -- 2. Swap Commissions: 0.05% fee on "Jump" trades triggered by AI
  SUM(CASE 
    WHEN transaction_type = 'swap_execution' AND status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as swap_revenue,
  
  -- 3. Staking Referrals: 1% affiliate kickbacks from suggested staking
  SUM(CASE 
    WHEN transaction_type = 'staking_referral' AND status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as referral_revenue,
  
  -- 4. Emergency Protection: $0.50 flat fee per protection event
  SUM(CASE 
    WHEN transaction_type = 'emergency_protection' AND status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as protection_revenue,
  
  -- 5. Premium Subscriptions: Monthly recurring revenue
  SUM(CASE 
    WHEN transaction_type = 'premium_subscription' AND status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as subscription_revenue,
  
  -- 6. Vault Service: $499/mo for white glove service
  SUM(CASE 
    WHEN transaction_type = 'vault_service' AND status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as vault_revenue,
  
  -- 7. Custom Indexers: One-time setup fees
  SUM(CASE 
    WHEN transaction_type = 'custom_indexer' AND status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as indexer_revenue,
  
  -- 8. Sponsored Alerts: Native ad revenue
  SUM(CASE 
    WHEN transaction_type = 'sponsored_alert' AND status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as ad_revenue,
  
  -- Total revenue
  SUM(CASE 
    WHEN status = 'collected' 
    THEN fee_amount 
    ELSE 0 
  END) as total_revenue,
  
  -- Pending revenue (not yet collected)
  SUM(CASE 
    WHEN status = 'pending' 
    THEN fee_amount 
    ELSE 0 
  END) as pending_revenue,
  
  -- Transaction counts
  COUNT(*) FILTER (WHERE transaction_type = 'rebalance_profit') as rebalance_count,
  COUNT(*) FILTER (WHERE transaction_type = 'swap_execution') as swap_count,
  COUNT(*) FILTER (WHERE transaction_type = 'staking_referral') as referral_count,
  COUNT(*) FILTER (WHERE transaction_type = 'emergency_protection') as protection_count,
  COUNT(*) FILTER (WHERE status = 'collected') as collected_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count
  
FROM public.transaction_history
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Create real-time revenue summary view
CREATE OR REPLACE VIEW public.revenue_summary AS
SELECT 
  -- Today's revenue
  COALESCE(SUM(fee_amount) FILTER (
    WHERE DATE(created_at) = CURRENT_DATE 
    AND status = 'collected'
  ), 0) as today_revenue,
  
  -- This week's revenue
  COALESCE(SUM(fee_amount) FILTER (
    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND status = 'collected'
  ), 0) as week_revenue,
  
  -- This month's revenue
  COALESCE(SUM(fee_amount) FILTER (
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND status = 'collected'
  ), 0) as month_revenue,
  
  -- All-time revenue
  COALESCE(SUM(fee_amount) FILTER (
    WHERE status = 'collected'
  ), 0) as total_revenue,
  
  -- Pending revenue
  COALESCE(SUM(fee_amount) FILTER (
    WHERE status = 'pending'
  ), 0) as pending_revenue,
  
  -- Revenue by type (today)
  COALESCE(SUM(fee_amount) FILTER (
    WHERE DATE(created_at) = CURRENT_DATE 
    AND transaction_type = 'rebalance_profit'
    AND status = 'collected'
  ), 0) as today_performance,
  
  COALESCE(SUM(fee_amount) FILTER (
    WHERE DATE(created_at) = CURRENT_DATE 
    AND transaction_type = 'swap_execution'
    AND status = 'collected'
  ), 0) as today_swaps,
  
  COALESCE(SUM(fee_amount) FILTER (
    WHERE DATE(created_at) = CURRENT_DATE 
    AND transaction_type = 'premium_subscription'
    AND status = 'collected'
  ), 0) as today_subscriptions
  
FROM public.transaction_history;

-- Function to record a revenue transaction
CREATE OR REPLACE FUNCTION public.record_revenue(
  p_user_id UUID,
  p_transaction_type TEXT,
  p_amount NUMERIC,
  p_fee_percentage NUMERIC,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_fee_amount NUMERIC;
BEGIN
  -- Calculate fee amount
  v_fee_amount := p_amount * p_fee_percentage;
  
  -- Insert transaction
  INSERT INTO public.transaction_history (
    user_id,
    transaction_type,
    amount,
    fee_percentage,
    fee_amount,
    metadata
  )
  VALUES (
    p_user_id,
    p_transaction_type,
    p_amount,
    p_fee_percentage,
    v_fee_amount,
    p_metadata
  )
  RETURNING id INTO v_id;
  
  -- Broadcast revenue update via Realtime
  PERFORM pg_notify(
    'revenue_update',
    json_build_object(
      'transaction_id', v_id,
      'type', p_transaction_type,
      'fee_amount', v_fee_amount,
      'timestamp', NOW()
    )::text
  );
  
  RETURN v_id;
END;
$$;

-- Function to collect fees (mark as collected)
CREATE OR REPLACE FUNCTION public.collect_fees(
  p_transaction_ids UUID[],
  p_collection_tx_hash TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collected_count INTEGER;
  v_total_amount NUMERIC;
BEGIN
  -- Update transactions to collected status
  UPDATE public.transaction_history
  SET 
    status = 'collected',
    collected_at = NOW(),
    collection_tx_hash = p_collection_tx_hash
  WHERE id = ANY(p_transaction_ids)
    AND status = 'pending';
  
  GET DIAGNOSTICS v_collected_count = ROW_COUNT;
  
  -- Calculate total collected
  SELECT SUM(fee_amount) INTO v_total_amount
  FROM public.transaction_history
  WHERE id = ANY(p_transaction_ids)
    AND status = 'collected';
  
  -- Broadcast collection update
  PERFORM pg_notify(
    'revenue_collected',
    json_build_object(
      'transaction_count', v_collected_count,
      'total_amount', v_total_amount,
      'timestamp', NOW()
    )::text
  );
  
  RETURN v_collected_count;
END;
$$;

COMMENT ON TABLE public.transaction_history IS 'Tracks all revenue-generating transactions';
COMMENT ON VIEW public.monetization_analytics IS 'Daily revenue breakdown by transaction type';
COMMENT ON VIEW public.revenue_summary IS 'Real-time revenue summary (today, week, month, all-time)';
COMMENT ON FUNCTION public.record_revenue(UUID, TEXT, NUMERIC, NUMERIC, JSONB) IS 'Records a revenue transaction and broadcasts update';
COMMENT ON FUNCTION public.collect_fees(UUID[], TEXT) IS 'Marks transactions as collected and broadcasts update';
