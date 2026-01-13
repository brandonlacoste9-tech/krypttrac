-- ============================================
-- Krypto Trac: Schedule Price Aggregator Job
-- Runs price aggregator Edge Function every minute via pg_cron
-- ============================================

-- Schedule price aggregator to run every minute
-- Note: Replace [PROJECT-REF] with your actual Supabase project reference
DO $$
DECLARE
  v_project_ref TEXT := 'hiuemmkhwiaarpdyncgj'; -- Replace with your project ref
  v_function_url TEXT;
BEGIN
  -- Construct Edge Function URL
  v_function_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/price-aggregator';
  
  -- Unschedule if already exists
  BEGIN
    PERFORM cron.unschedule('price-aggregator');
  EXCEPTION
    WHEN OTHERS THEN
      -- Job doesn't exist, ignore
      NULL;
  END;
  
  -- Schedule job to run every minute
  -- Uses pg_net extension to make HTTP requests
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'price-aggregator',
      '* * * * *', -- Every minute
      format('SELECT net.http_post(
        url:=''%s'',
        headers:=''{"Content-Type": "application/json", "Authorization": "Bearer %s"}'',
        body:=''{}''
      )', 
      v_function_url,
      current_setting('app.settings.service_role_key', true)
      )
    );
    
    RAISE NOTICE '✅ Price aggregator scheduled to run every minute';
  ELSE
    RAISE NOTICE '⚠️  pg_cron extension not enabled - cannot schedule price aggregator';
  END IF;
END $$;

-- Alternative: If pg_net is not available, use a simpler approach
-- This requires the Edge Function to be called via HTTP from outside
-- You can use a service like cron-job.org or GitHub Actions

-- Manual trigger function (for testing)
CREATE OR REPLACE FUNCTION public.trigger_price_aggregator()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_ref TEXT := 'hiuemmkhwiaarpdyncgj';
  v_function_url TEXT;
BEGIN
  v_function_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/price-aggregator';
  
  -- This is a placeholder - actual HTTP call would need pg_net or external service
  RAISE NOTICE 'To trigger price aggregator, call: %', v_function_url;
END;
$$;

COMMENT ON FUNCTION public.trigger_price_aggregator() IS 'Manually trigger price aggregator (for testing)';
