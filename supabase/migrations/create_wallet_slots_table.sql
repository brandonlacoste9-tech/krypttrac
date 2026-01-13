-- ============================================
-- Krypto Trac: Wallet Slots Management
-- Metered billing for additional wallet connections ($2/mo per slot)
-- ============================================

-- Create wallet_slots table
CREATE TABLE IF NOT EXISTS public.wallet_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('ethereum', 'solana', 'polygon', 'arbitrum', 'base', 'optimism')),
  wallet_name TEXT, -- User-friendly name
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, wallet_address, network)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_slots_user_id ON public.wallet_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_slots_active ON public.wallet_slots(user_id, is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE public.wallet_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own wallet slots
DROP POLICY IF EXISTS "Users can view own wallet slots" ON public.wallet_slots;
CREATE POLICY "Users can view own wallet slots"
  ON public.wallet_slots FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can manage their own wallet slots
DROP POLICY IF EXISTS "Users can manage own wallet slots" ON public.wallet_slots;
CREATE POLICY "Users can manage own wallet slots"
  ON public.wallet_slots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to get user's wallet slot count
CREATE OR REPLACE FUNCTION public.get_wallet_slot_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.wallet_slots
  WHERE user_id = p_user_id
    AND is_active = TRUE;
  
  RETURN v_count;
END;
$$;

-- Function to check if user can add wallet (free tier = 1, paid = unlimited)
CREATE OR REPLACE FUNCTION public.can_add_wallet(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot_count INTEGER;
  v_has_sovereign BOOLEAN;
BEGIN
  -- Check if user has Sovereign plan (unlimited slots)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = p_user_id
      AND 'sovereign' = ANY(add_ons)
  ) INTO v_has_sovereign;
  
  IF v_has_sovereign THEN
    RETURN TRUE; -- Unlimited slots
  END IF;
  
  -- Free tier: 1 slot
  v_slot_count := public.get_wallet_slot_count(p_user_id);
  
  RETURN v_slot_count < 1;
END;
$$;

-- Function to add wallet slot (triggers billing if needed)
CREATE OR REPLACE FUNCTION public.add_wallet_slot(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_network TEXT,
  p_wallet_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot_id UUID;
  v_slot_count INTEGER;
  v_has_sovereign BOOLEAN;
BEGIN
  -- Check if user can add wallet
  SELECT public.can_add_wallet(p_user_id) INTO v_has_sovereign;
  
  IF NOT v_has_sovereign THEN
    -- Check current slot count
    v_slot_count := public.get_wallet_slot_count(p_user_id);
    
    IF v_slot_count >= 1 THEN
      -- User needs to pay for additional slots
      RAISE EXCEPTION 'Additional wallet slots require subscription. $2/mo per slot.';
    END IF;
  END IF;
  
  -- Add wallet slot
  INSERT INTO public.wallet_slots (
    user_id,
    wallet_address,
    network,
    wallet_name
  )
  VALUES (
    p_user_id,
    p_wallet_address,
    p_network,
    p_wallet_name
  )
  ON CONFLICT (user_id, wallet_address, network)
  DO UPDATE SET
    is_active = TRUE,
    last_used_at = NOW()
  RETURNING id INTO v_slot_id;
  
  -- If this is an additional slot (beyond free tier), record revenue
  IF NOT v_has_sovereign AND v_slot_count >= 1 THEN
    PERFORM public.record_revenue(
      p_user_id := p_user_id,
      p_transaction_type := 'premium_subscription',
      p_amount := 2.00, -- $2/mo per slot
      p_fee_percentage := 1.0,
      p_metadata := jsonb_build_object(
        'wallet_slot_id', v_slot_id,
        'billing_period', 'monthly'
      )
    );
  END IF;
  
  RETURN v_slot_id;
END;
$$;

COMMENT ON TABLE public.wallet_slots IS 'User wallet connections with metered billing';
COMMENT ON FUNCTION public.get_wallet_slot_count(UUID) IS 'Returns count of active wallet slots for user';
COMMENT ON FUNCTION public.can_add_wallet(UUID) IS 'Checks if user can add another wallet slot';
COMMENT ON FUNCTION public.add_wallet_slot(UUID, TEXT, TEXT, TEXT) IS 'Adds wallet slot and triggers billing if needed';
