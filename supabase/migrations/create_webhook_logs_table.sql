-- ============================================
-- Krypto Trac: Webhook Telemetry Table
-- Stores webhook invocation logs for observability
-- ============================================

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  duration_ms INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON public.webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- Enable RLS (optional - can be public for monitoring)
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage all logs
DROP POLICY IF EXISTS "Service role can manage webhook logs" ON public.webhook_logs;
CREATE POLICY "Service role can manage webhook logs"
  ON public.webhook_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Users can view their own logs (optional)
DROP POLICY IF EXISTS "Users can view their own webhook logs" ON public.webhook_logs;
CREATE POLICY "Users can view their own webhook logs"
  ON public.webhook_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Retention policy: Auto-delete logs older than 90 days (optional)
-- Uncomment to enable:
/*
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.webhook_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Schedule cleanup (requires pg_cron extension)
SELECT cron.schedule(
  'cleanup-webhook-logs',
  '0 2 * * *', -- Daily at 2 AM
  $$SELECT public.cleanup_old_webhook_logs()$$
);
*/

COMMENT ON TABLE public.webhook_logs IS 'Webhook invocation logs for observability and debugging';
COMMENT ON COLUMN public.webhook_logs.duration_ms IS 'Webhook processing duration in milliseconds';
COMMENT ON COLUMN public.webhook_logs.metadata IS 'Additional webhook event metadata (JSON)';
