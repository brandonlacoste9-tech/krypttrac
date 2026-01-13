-- ============================================
-- Krypto Trac: Dead-Letter Table for Telemetry Failures
-- Stores failed telemetry writes for retry processing
-- ============================================

-- Create dead_letter_webhook_logs table
CREATE TABLE IF NOT EXISTS public.dead_letter_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_log_data JSONB NOT NULL,  -- Full log entry that failed to insert
  failure_reason TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'succeeded', 'failed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for retry processing
CREATE INDEX IF NOT EXISTS idx_dl_webhook_logs_status ON public.dead_letter_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_dl_webhook_logs_next_retry ON public.dead_letter_webhook_logs(next_retry_at) 
  WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_dl_webhook_logs_created_at ON public.dead_letter_webhook_logs(created_at DESC);

-- Enable RLS (service_role only)
ALTER TABLE public.dead_letter_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role only
DROP POLICY IF EXISTS "Service role can manage dead letter logs" ON public.dead_letter_webhook_logs;
CREATE POLICY "Service role can manage dead letter logs"
  ON public.dead_letter_webhook_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Retry function: Attempts to reprocess failed telemetry logs
CREATE OR REPLACE FUNCTION public.retry_failed_webhook_logs()
RETURNS TABLE(
  retried_count INTEGER,
  succeeded_count INTEGER,
  failed_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_record RECORD;
  v_retried_count INTEGER := 0;
  v_succeeded_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_max_retries INTEGER := 5;
  v_retry_delay INTERVAL := '5 minutes';
BEGIN
  -- Process logs that are ready for retry
  FOR v_log_record IN
    SELECT 
      id,
      original_log_data,
      retry_count,
      next_retry_at
    FROM public.dead_letter_webhook_logs
    WHERE status IN ('pending', 'retrying')
      AND next_retry_at <= NOW()
      AND retry_count < v_max_retries
    ORDER BY created_at ASC
    LIMIT 100  -- Process in batches
  LOOP
    v_retried_count := v_retried_count + 1;
    
    -- Update status to retrying
    UPDATE public.dead_letter_webhook_logs
    SET 
      status = 'retrying',
      last_retry_at = NOW(),
      retry_count = retry_count + 1
    WHERE id = v_log_record.id;
    
    -- Attempt to insert into webhook_logs
    BEGIN
      INSERT INTO public.webhook_logs (
        event_type,
        user_id,
        feature,
        status,
        duration_ms,
        error_message,
        metadata,
        created_at
      )
      VALUES (
        v_log_record.original_log_data->>'event_type',
        (v_log_record.original_log_data->>'user_id')::UUID,
        v_log_record.original_log_data->>'feature',
        v_log_record.original_log_data->>'status',
        (v_log_record.original_log_data->>'duration_ms')::INTEGER,
        v_log_record.original_log_data->>'error_message',
        COALESCE((v_log_record.original_log_data->>'metadata')::jsonb, '{}'::jsonb),
        COALESCE((v_log_record.original_log_data->>'created_at')::timestamptz, NOW())
      );
      
      -- Success: Mark as succeeded
      UPDATE public.dead_letter_webhook_logs
      SET 
        status = 'succeeded',
        resolved_at = NOW()
      WHERE id = v_log_record.id;
      
      v_succeeded_count := v_succeeded_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Failure: Schedule next retry with exponential backoff
      UPDATE public.dead_letter_webhook_logs
      SET 
        status = CASE 
          WHEN retry_count + 1 >= v_max_retries THEN 'failed'
          ELSE 'pending'
        END,
        next_retry_at = CASE 
          WHEN retry_count + 1 >= v_max_retries THEN NULL
          ELSE NOW() + (v_retry_delay * POWER(2, retry_count))
        END,
        failure_reason = COALESCE(failure_reason || '; ', '') || SQLERRM
      WHERE id = v_log_record.id;
      
      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;
  
  -- Mark abandoned logs (older than 7 days)
  UPDATE public.dead_letter_webhook_logs
  SET status = 'abandoned'
  WHERE status IN ('pending', 'retrying')
    AND created_at < NOW() - INTERVAL '7 days';
  
  RETURN QUERY SELECT v_retried_count, v_succeeded_count, v_failed_count;
END;
$$;

-- Schedule retry job (if pg_cron enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('retry-failed-webhook-logs');
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    PERFORM cron.schedule(
      'retry-failed-webhook-logs',
      '*/5 * * * *',  -- Every 5 minutes
      'SELECT * FROM public.retry_failed_webhook_logs()'
    );
    
    RAISE NOTICE 'Scheduled dead-letter retry job';
  ELSE
    RAISE NOTICE 'pg_cron extension not found - retry job not scheduled';
  END IF;
END $$;

-- Cleanup function: Remove old resolved/abandoned logs
CREATE OR REPLACE FUNCTION public.cleanup_dead_letter_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.dead_letter_webhook_logs
  WHERE status IN ('succeeded', 'abandoned')
    AND resolved_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % dead-letter log entries', deleted_count;
END;
$$;

-- Schedule cleanup (if pg_cron enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('cleanup-dead-letter-logs');
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    PERFORM cron.schedule(
      'cleanup-dead-letter-logs',
      '0 3 * * *',  -- Daily at 3 AM UTC
      'SELECT public.cleanup_dead_letter_logs()'
    );
  END IF;
END $$;

COMMENT ON TABLE public.dead_letter_webhook_logs IS 'Dead-letter queue for failed webhook telemetry writes';
COMMENT ON FUNCTION public.retry_failed_webhook_logs() IS 'Retries failed telemetry log insertions with exponential backoff';
COMMENT ON FUNCTION public.cleanup_dead_letter_logs() IS 'Removes old resolved/abandoned dead-letter logs';
