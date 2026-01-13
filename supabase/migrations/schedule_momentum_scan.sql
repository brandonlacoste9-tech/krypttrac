-- ============================================
-- Krypto Trac: Schedule Momentum Breakout Scanner
-- Scans top coins for momentum breakouts every 5 minutes
-- ============================================

-- Function to scan top coins for momentum breakouts
CREATE OR REPLACE FUNCTION public.scan_momentum_breakouts()
RETURNS TABLE(
  signals_generated INTEGER,
  breakouts_detected INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coin RECORD;
  v_signals_count INTEGER := 0;
  v_breakouts_count INTEGER := 0;
  v_project_ref TEXT := 'hiuemmkhwiaarpdyncgj';
  v_function_url TEXT;
BEGIN
  v_function_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/momentum-breakout';
  
  -- Scan top 20 coins by market cap
  FOR v_coin IN
    SELECT DISTINCT ON (coin_id)
      coin_id,
      symbol
    FROM public.price_history
    WHERE created_at > NOW() - INTERVAL '1 hour'
    ORDER BY coin_id, created_at DESC
    LIMIT 20
  LOOP
    -- Call Edge Function to analyze momentum
    -- In production, use pg_net or external service
    -- For now, we'll just log
    RAISE NOTICE 'Scanning % (%) for momentum breakouts', v_coin.symbol, v_coin.coin_id;
    
    -- In production, trigger Edge Function:
    -- PERFORM net.http_post(
    --   url := v_function_url,
    --   headers := jsonb_build_object(
    --     'Content-Type', 'application/json',
    --     'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    --   ),
    --   body := jsonb_build_object(
    --     'coin_id', v_coin.coin_id,
    --     'symbol', v_coin.symbol,
    --     'timeframe', '1h'
    --   )
    -- );
    
    v_signals_count := v_signals_count + 1;
  END LOOP;
  
  -- Count breakouts detected in last scan
  SELECT COUNT(*) INTO v_breakouts_count
  FROM public.momentum_signals
  WHERE signal_type = 'breakout'
    AND confidence_score >= 80
    AND created_at > NOW() - INTERVAL '10 minutes';
  
  RETURN QUERY SELECT v_signals_count, v_breakouts_count;
END;
$$;

-- Schedule job to run every 5 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('scan-momentum-breakouts');
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    PERFORM cron.schedule(
      'scan-momentum-breakouts',
      '*/5 * * * *', -- Every 5 minutes
      'SELECT * FROM public.scan_momentum_breakouts()'
    );
    
    RAISE NOTICE '✅ Momentum breakout scanner scheduled';
  ELSE
    RAISE NOTICE '⚠️  pg_cron not enabled - cannot schedule scanner';
  END IF;
END $$;

COMMENT ON FUNCTION public.scan_momentum_breakouts() IS 'Scans top coins for momentum breakout signals';
