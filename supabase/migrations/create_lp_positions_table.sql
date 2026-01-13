-- ============================================
-- Krypto Trac: Liquidity Pool Positions
-- Tracks user LP positions for automated rebalancing
-- ============================================

-- Create lp_positions table
CREATE TABLE IF NOT EXISTS public.lp_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pool_address TEXT NOT NULL, -- Uniswap V3/V4 pool address
  pool_type TEXT NOT NULL CHECK (pool_type IN ('uniswap_v3', 'uniswap_v4', 'curve', 'balancer')),
  token0_address TEXT NOT NULL,
  token0_symbol TEXT NOT NULL,
  token1_address TEXT NOT NULL,
  token1_symbol TEXT NOT NULL,
  position_id TEXT, -- NFT token ID for Uniswap V3
  liquidity_amount NUMERIC(40, 0), -- Raw liquidity amount
  tick_lower INTEGER NOT NULL,
  tick_upper INTEGER NOT NULL,
  current_tick INTEGER, -- Current pool tick
  in_range BOOLEAN DEFAULT TRUE,
  fee_tier INTEGER, -- Fee tier (e.g., 500, 3000, 10000 for Uniswap)
  operator_permissions BOOLEAN DEFAULT FALSE, -- User granted rebalancing permissions
  operator_address TEXT, -- Address authorized to rebalance
  last_rebalanced_at TIMESTAMPTZ,
  rebalance_count INTEGER DEFAULT 0,
  total_fees_earned NUMERIC(20, 8) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lp_positions_user_id ON public.lp_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_positions_pool_address ON public.lp_positions(pool_address);
CREATE INDEX IF NOT EXISTS idx_lp_positions_in_range ON public.lp_positions(in_range) WHERE in_range = FALSE;
CREATE INDEX IF NOT EXISTS idx_lp_positions_operator ON public.lp_positions(operator_permissions) WHERE operator_permissions = TRUE;

-- Enable RLS
ALTER TABLE public.lp_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own positions
DROP POLICY IF EXISTS "Users can view own LP positions" ON public.lp_positions;
CREATE POLICY "Users can view own LP positions"
  ON public.lp_positions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own positions
DROP POLICY IF EXISTS "Users can insert own LP positions" ON public.lp_positions;
CREATE POLICY "Users can insert own LP positions"
  ON public.lp_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own positions
DROP POLICY IF EXISTS "Users can update own LP positions" ON public.lp_positions;
CREATE POLICY "Users can update own LP positions"
  ON public.lp_positions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check if position is out of range
CREATE OR REPLACE FUNCTION public.check_position_range(p_position_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position RECORD;
  v_in_range BOOLEAN;
BEGIN
  SELECT * INTO v_position
  FROM public.lp_positions
  WHERE id = p_position_id;
  
  -- Check if current tick is within range
  v_in_range := v_position.current_tick >= v_position.tick_lower 
    AND v_position.current_tick <= v_position.tick_upper;
  
  -- Update position
  UPDATE public.lp_positions
  SET 
    in_range = v_in_range,
    updated_at = NOW()
  WHERE id = p_position_id;
  
  RETURN v_in_range;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_lp_position_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_lp_position_updated_at ON public.lp_positions;
CREATE TRIGGER trigger_update_lp_position_updated_at
  BEFORE UPDATE ON public.lp_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lp_position_updated_at();

COMMENT ON TABLE public.lp_positions IS 'User liquidity pool positions for automated rebalancing';
COMMENT ON FUNCTION public.check_position_range(UUID) IS 'Checks if LP position is still in range';
