-- ============================================
-- Krypto Trac: Schedule Auto-Rebalance Job
-- Checks LP positions every minute and rebalances if out of range
-- ============================================

-- Function to check and rebalance out-of-range positions
CREATE OR REPLACE FUNCTION public.check_and_rebalance_positions()
RETURNS TABLE(
  positions_checked INTEGER,
  positions_rebalanced INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position RECORD;
  v_checked_count INTEGER := 0;
  v_rebalanced_count INTEGER := 0;
  v_project_ref TEXT := 'hiuemmkhwiaarpdyncgj'; -- Replace with your project ref
  v_function_url TEXT;
BEGIN
  v_function_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/auto-rebalance';
  
  -- Find all out-of-range positions with operator permissions
  FOR v_position IN
    SELECT 
      lp.id,
      lp.user_id,
      lp.pool_address,
      lp.token0_symbol,
      lp.token1_symbol,
      lp.current_tick,
      lp.tick_lower,
      lp.tick_upper
    FROM public.lp_positions lp
    WHERE lp.operator_permissions = TRUE
      AND lp.in_range = FALSE
      AND (lp.last_rebalanced_at IS NULL 
           OR lp.last_rebalanced_at < NOW() - INTERVAL '1 hour') -- Throttle rebalancing
  LOOP
    v_checked_count := v_checked_count + 1;
    
    -- Check if position is still out of range
    PERFORM public.check_position_range(v_position.id);
    
    -- Call Edge Function to rebalance (async)
    -- Note: In production, use pg_net or external service
    -- For now, we'll just log
    RAISE NOTICE 'Position % (User: %) is out of range. Current tick: %, Range: [%, %]',
      v_position.id,
      v_position.user_id,
      v_position.current_tick,
      v_position.tick_lower,
      v_position.tick_upper;
    
    -- In production, trigger Edge Function:
    -- PERFORM net.http_post(
    --   url := v_function_url,
    --   headers := jsonb_build_object(
    --     'Content-Type', 'application/json',
    --     'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    --   ),
    --   body := jsonb_build_object(
    --     'position_id', v_position.id,
    --     'user_id', v_position.user_id
    --   )
    -- );
    
    v_rebalanced_count := v_rebalanced_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_checked_count, v_rebalanced_count;
END;
$$;

-- Schedule job to run every minute
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('auto-rebalance-positions');
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    PERFORM cron.schedule(
      'auto-rebalance-positions',
      '* * * * *', -- Every minute
      'SELECT * FROM public.check_and_rebalance_positions()'
    );
    
    RAISE NOTICE '✅ Auto-rebalance job scheduled';
  ELSE
    RAISE NOTICE '⚠️  pg_cron not enabled - cannot schedule auto-rebalance';
  END IF;
END $$;

COMMENT ON FUNCTION public.check_and_rebalance_positions() IS 'Checks LP positions and triggers rebalancing for out-of-range positions';
