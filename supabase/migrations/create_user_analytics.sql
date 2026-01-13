-- ============================================
-- Krypto Trac: User Behavior Analytics
-- Tracks user interactions for personalized insights
-- ============================================

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'portfolio_view', 'coin_search', 'news_read', 'whale_alert_view', etc.
  activity_data JSONB DEFAULT '{}', -- Additional context (coin_id, search_query, etc.)
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON public.user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_activity ON public.user_activity_logs(user_id, activity_type, created_at DESC);

-- Convert to TimescaleDB hypertable (if extension enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable(
      'public.user_activity_logs',
      'created_at',
      chunk_time_interval => INTERVAL '1 day',
      if_not_exists => TRUE
    );
    RAISE NOTICE '✅ User activity logs converted to TimescaleDB hypertable';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own activity
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_logs;
CREATE POLICY "Users can view own activity"
  ON public.user_activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own activity
DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity_logs;
CREATE POLICY "Users can insert own activity"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role can view all activity (for analytics)
DROP POLICY IF EXISTS "Service role can view all activity" ON public.user_activity_logs;
CREATE POLICY "Service role can view all activity"
  ON public.user_activity_logs FOR SELECT
  USING (auth.role() = 'service_role');

-- Function to identify "whale" users (high engagement)
CREATE OR REPLACE FUNCTION public.get_whale_users(
  p_days INTEGER DEFAULT 7,
  p_min_activities INTEGER DEFAULT 50
)
RETURNS TABLE(
  user_id UUID,
  activity_count BIGINT,
  portfolio_views BIGINT,
  coin_searches BIGINT,
  news_reads BIGINT,
  last_activity TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ual.user_id,
    COUNT(*) as activity_count,
    COUNT(*) FILTER (WHERE ual.activity_type = 'portfolio_view') as portfolio_views,
    COUNT(*) FILTER (WHERE ual.activity_type = 'coin_search') as coin_searches,
    COUNT(*) FILTER (WHERE ual.activity_type = 'news_read') as news_reads,
    MAX(ual.created_at) as last_activity
  FROM public.user_activity_logs ual
  WHERE ual.created_at > NOW() - (p_days || ' days')::INTERVAL
    AND ual.user_id IS NOT NULL
  GROUP BY ual.user_id
  HAVING COUNT(*) >= p_min_activities
  ORDER BY activity_count DESC;
END;
$$;

-- Function to get user interests (most viewed coins)
CREATE OR REPLACE FUNCTION public.get_user_interests(p_user_id UUID)
RETURNS TABLE(
  coin_id TEXT,
  view_count BIGINT,
  last_viewed TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ual.activity_data->>'coin_id' as coin_id,
    COUNT(*) as view_count,
    MAX(ual.created_at) as last_viewed
  FROM public.user_activity_logs ual
  WHERE ual.user_id = p_user_id
    AND ual.activity_type IN ('coin_view', 'coin_search', 'portfolio_view')
    AND ual.activity_data->>'coin_id' IS NOT NULL
  GROUP BY ual.activity_data->>'coin_id'
  ORDER BY view_count DESC
  LIMIT 10;
END;
$$;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  INSERT INTO public.user_activity_logs (
    user_id,
    activity_type,
    activity_data,
    session_id
  )
  VALUES (
    v_user_id,
    p_activity_type,
    p_activity_data,
    p_session_id
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

COMMENT ON TABLE public.user_activity_logs IS 'Tracks user behavior for analytics and personalization';
COMMENT ON FUNCTION public.get_whale_users(INTEGER, INTEGER) IS 'Identifies high-engagement users (whales)';
COMMENT ON FUNCTION public.get_user_interests(UUID) IS 'Returns user interests based on activity (most viewed coins)';
COMMENT ON FUNCTION public.log_user_activity(TEXT, JSONB, TEXT) IS 'Logs a user activity event';
