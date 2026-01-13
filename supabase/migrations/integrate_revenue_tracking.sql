-- ============================================
-- Krypto Trac: Integrate Revenue Tracking
-- Adds revenue tracking to existing features
-- ============================================

-- Trigger to record performance fee when LP rebalancing generates profit
CREATE OR REPLACE FUNCTION public.record_rebalance_profit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profit NUMERIC;
  v_fee_percentage NUMERIC := 0.001; -- 0.1% performance fee
BEGIN
  -- Calculate profit from rebalancing (simplified - in production, calculate actual profit)
  -- This would come from Uniswap fee collection
  IF NEW.last_rebalanced_at IS NOT NULL AND OLD.last_rebalanced_at IS NULL THEN
    -- First rebalance - estimate profit based on fees earned
    v_profit := COALESCE(NEW.total_fees_earned, 0);
    
    IF v_profit > 0 THEN
      -- Record revenue transaction
      PERFORM public.record_revenue(
        p_user_id := NEW.user_id,
        p_transaction_type := 'rebalance_profit',
        p_amount := v_profit,
        p_fee_percentage := v_fee_percentage,
        p_metadata := jsonb_build_object(
          'position_id', NEW.id,
          'pool_address', NEW.pool_address,
          'token0', NEW.token0_symbol,
          'token1', NEW.token1_symbol,
          'rebalance_count', NEW.rebalance_count
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_record_rebalance_profit ON public.lp_positions;
CREATE TRIGGER trigger_record_rebalance_profit
  AFTER UPDATE ON public.lp_positions
  FOR EACH ROW
  WHEN (NEW.last_rebalanced_at IS DISTINCT FROM OLD.last_rebalanced_at)
  EXECUTE FUNCTION public.record_rebalance_profit();

-- Function to record swap execution fee
CREATE OR REPLACE FUNCTION public.record_swap_fee(
  p_user_id UUID,
  p_swap_amount NUMERIC,
  p_from_token TEXT,
  p_to_token TEXT,
  p_swap_tx_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_percentage NUMERIC := 0.0005; -- 0.05% swap commission
  v_transaction_id UUID;
BEGIN
  v_transaction_id := public.record_revenue(
    p_user_id := p_user_id,
    p_transaction_type := 'swap_execution',
    p_amount := p_swap_amount,
    p_fee_percentage := v_fee_percentage,
    p_metadata := jsonb_build_object(
      'from_token', p_from_token,
      'to_token', p_to_token,
      'swap_tx_hash', p_swap_tx_hash
    )
  );
  
  RETURN v_transaction_id;
END;
$$;

-- Function to record emergency protection fee
CREATE OR REPLACE FUNCTION public.record_protection_fee(
  p_user_id UUID,
  p_protected_amount NUMERIC,
  p_protection_tx_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flat_fee NUMERIC := 0.50; -- $0.50 flat fee
  v_transaction_id UUID;
BEGIN
  v_transaction_id := public.record_revenue(
    p_user_id := p_user_id,
    p_transaction_type := 'emergency_protection',
    p_amount := v_flat_fee, -- Flat fee, not percentage
    p_fee_percentage := 1.0, -- 100% of flat fee
    p_metadata := jsonb_build_object(
      'protected_amount', p_protected_amount,
      'protection_tx_hash', p_protection_tx_hash
    )
  );
  
  RETURN v_transaction_id;
END;
$$;

-- Function to record staking referral fee
CREATE OR REPLACE FUNCTION public.record_staking_referral(
  p_user_id UUID,
  p_staking_amount NUMERIC,
  p_staking_platform TEXT,
  p_referral_code TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_percentage NUMERIC := 0.01; -- 1% referral fee
  v_transaction_id UUID;
BEGIN
  v_transaction_id := public.record_revenue(
    p_user_id := p_user_id,
    p_transaction_type := 'staking_referral',
    p_amount := p_staking_amount,
    p_fee_percentage := v_fee_percentage,
    p_metadata := jsonb_build_object(
      'staking_platform', p_staking_platform,
      'referral_code', p_referral_code
    )
  );
  
  RETURN v_transaction_id;
END;
$$;

-- Function to record premium subscription
CREATE OR REPLACE FUNCTION public.record_subscription_revenue(
  p_user_id UUID,
  p_tier TEXT,
  p_amount NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  v_transaction_id := public.record_revenue(
    p_user_id := p_user_id,
    p_transaction_type := 'premium_subscription',
    p_amount := p_amount,
    p_fee_percentage := 1.0, -- 100% of subscription fee
    p_metadata := jsonb_build_object(
      'tier', p_tier,
      'billing_period', 'monthly'
    )
  );
  
  RETURN v_transaction_id;
END;
$$;

-- Function to record vault service revenue
CREATE OR REPLACE FUNCTION public.record_vault_service_revenue(
  p_user_id UUID,
  p_service_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monthly_fee NUMERIC := 499.00; -- $499/mo white glove service
  v_transaction_id UUID;
BEGIN
  v_transaction_id := public.record_revenue(
    p_user_id := p_user_id,
    p_transaction_type := 'vault_service',
    p_amount := v_monthly_fee,
    p_fee_percentage := 1.0,
    p_metadata := jsonb_build_object(
      'service_type', p_service_type
    )
  );
  
  RETURN v_transaction_id;
END;
$$;

-- Function to record sponsored alert revenue
CREATE OR REPLACE FUNCTION public.record_sponsored_alert(
  p_advertiser_id TEXT,
  p_alert_type TEXT,
  p_impressions INTEGER,
  p_clicks INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cpm NUMERIC := 5.00; -- $5 per 1000 impressions
  v_cpc NUMERIC := 0.50; -- $0.50 per click
  v_revenue NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Calculate revenue: CPM + CPC
  v_revenue := (p_impressions / 1000.0 * v_cpm) + (p_clicks * v_cpc);
  
  v_transaction_id := public.record_revenue(
    p_user_id := NULL, -- No user_id for ad revenue
    p_transaction_type := 'sponsored_alert',
    p_amount := v_revenue,
    p_fee_percentage := 1.0,
    p_metadata := jsonb_build_object(
      'advertiser_id', p_advertiser_id,
      'alert_type', p_alert_type,
      'impressions', p_impressions,
      'clicks', p_clicks
    )
  );
  
  RETURN v_transaction_id;
END;
$$;

COMMENT ON FUNCTION public.record_swap_fee(UUID, NUMERIC, TEXT, TEXT, TEXT) IS 'Records swap execution commission';
COMMENT ON FUNCTION public.record_protection_fee(UUID, NUMERIC, TEXT) IS 'Records emergency protection fee';
COMMENT ON FUNCTION public.record_staking_referral(UUID, NUMERIC, TEXT, TEXT) IS 'Records staking referral commission';
COMMENT ON FUNCTION public.record_subscription_revenue(UUID, TEXT, NUMERIC) IS 'Records premium subscription revenue';
COMMENT ON FUNCTION public.record_vault_service_revenue(UUID, TEXT) IS 'Records vault service revenue';
COMMENT ON FUNCTION public.record_sponsored_alert(TEXT, TEXT, INTEGER, INTEGER) IS 'Records sponsored alert ad revenue';
