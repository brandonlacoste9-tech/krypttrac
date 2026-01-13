-- ============================================
-- Krypto Trac: Schedule Fee Collection Job
-- Collects pending fees daily (or when threshold reached)
-- ============================================

-- Function to auto-collect fees when threshold is met
CREATE OR REPLACE FUNCTION public.auto_collect_fees()
RETURNS TABLE(
  collected_count INTEGER,
  total_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_total NUMERIC;
  v_min_threshold NUMERIC := 100.00; -- Collect when $100+ pending
  v_transaction_ids UUID[];
  v_collected_count INTEGER;
  v_total_amount NUMERIC;
  v_project_ref TEXT := 'hiuemmkhwiaarpdyncgj';
  v_function_url TEXT;
BEGIN
  -- Calculate total pending fees
  SELECT SUM(fee_amount) INTO v_pending_total
  FROM public.transaction_history
  WHERE status = 'pending';
  
  -- Check if meets threshold
  IF v_pending_total IS NULL OR v_pending_total < v_min_threshold THEN
    RETURN QUERY SELECT 0, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Get all pending transaction IDs
  SELECT ARRAY_AGG(id) INTO v_transaction_ids
  FROM public.transaction_history
  WHERE status = 'pending';
  
  -- Call Edge Function to collect fees
  v_function_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/collect-fees';
  
  -- In production, use pg_net to call Edge Function
  -- For now, we'll use the RPC function directly
  SELECT * INTO v_collected_count, v_total_amount
  FROM public.collect_fees(v_transaction_ids, NULL);
  
  RETURN QUERY SELECT v_collected_count, v_total_amount;
END;
$$;

-- Schedule daily fee collection (runs at 2 AM UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('auto-collect-fees');
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    PERFORM cron.schedule(
      'auto-collect-fees',
      '0 2 * * *', -- Daily at 2 AM UTC
      'SELECT * FROM public.auto_collect_fees()'
    );
    
    RAISE NOTICE '✅ Auto-collect fees job scheduled';
  ELSE
    RAISE NOTICE '⚠️  pg_cron not enabled - cannot schedule auto-collect';
  END IF;
END $$;

COMMENT ON FUNCTION public.auto_collect_fees() IS 'Automatically collects fees when threshold is met';
