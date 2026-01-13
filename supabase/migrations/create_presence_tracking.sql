-- ============================================
-- Krypto Trac: Presence Tracking for Ghost Trading
-- Tracks which users are viewing which coins in real-time
-- ============================================

-- Create presence_channels table to track active channels
CREATE TABLE IF NOT EXISTS public.presence_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name TEXT NOT NULL, -- e.g., 'coin:bitcoin', 'portfolio:user-uuid'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT, -- If tracking coin views
  metadata JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(channel_name, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_presence_channels_channel ON public.presence_channels(channel_name);
CREATE INDEX IF NOT EXISTS idx_presence_channels_user ON public.presence_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_channels_coin ON public.presence_channels(coin_id);
CREATE INDEX IF NOT EXISTS idx_presence_channels_last_seen ON public.presence_channels(last_seen DESC);

-- Enable RLS
ALTER TABLE public.presence_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see presence in channels they're subscribed to
DROP POLICY IF EXISTS "Users can view presence" ON public.presence_channels;
CREATE POLICY "Users can view presence"
  ON public.presence_channels FOR SELECT
  USING (true); -- Public presence data

-- RLS Policy: Users can update their own presence
DROP POLICY IF EXISTS "Users can update own presence" ON public.presence_channels;
CREATE POLICY "Users can update own presence"
  ON public.presence_channels FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to get active users viewing a coin
CREATE OR REPLACE FUNCTION public.get_coin_viewers(p_coin_id TEXT)
RETURNS TABLE(
  user_id UUID,
  user_tier TEXT,
  last_seen TIMESTAMPTZ,
  is_whale BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.user_id,
    p.user_tier,
    pc.last_seen,
    EXISTS (
      SELECT 1 
      FROM public.get_whale_users(7, 50) wu
      WHERE wu.user_id = pc.user_id
    ) as is_whale
  FROM public.presence_channels pc
  LEFT JOIN public.profiles p ON pc.user_id = p.user_id
  WHERE pc.coin_id = p_coin_id
    AND pc.last_seen > NOW() - INTERVAL '5 minutes' -- Active in last 5 minutes
  ORDER BY 
    is_whale DESC, -- Whales first
    pc.last_seen DESC;
END;
$$;

-- Function to get heatmap data (most viewed coins)
CREATE OR REPLACE FUNCTION public.get_coin_heatmap()
RETURNS TABLE(
  coin_id TEXT,
  viewer_count BIGINT,
  whale_count BIGINT,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.coin_id,
    COUNT(DISTINCT pc.user_id) as viewer_count,
    COUNT(DISTINCT pc.user_id) FILTER (
      WHERE EXISTS (
        SELECT 1 
        FROM public.get_whale_users(7, 50) wu
        WHERE wu.user_id = pc.user_id
      )
    ) as whale_count,
    MAX(pc.last_seen) as last_updated
  FROM public.presence_channels pc
  WHERE pc.coin_id IS NOT NULL
    AND pc.last_seen > NOW() - INTERVAL '5 minutes'
  GROUP BY pc.coin_id
  ORDER BY viewer_count DESC
  LIMIT 20;
END;
$$;

-- Cleanup function to remove stale presence (older than 10 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.presence_channels
  WHERE last_seen < NOW() - INTERVAL '10 minutes';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % stale presence entries', deleted_count;
END;
$$;

-- Schedule cleanup (every 5 minutes)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('cleanup-stale-presence');
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    PERFORM cron.schedule(
      'cleanup-stale-presence',
      '*/5 * * * *', -- Every 5 minutes
      'SELECT public.cleanup_stale_presence()'
    );
  END IF;
END $$;

COMMENT ON TABLE public.presence_channels IS 'Tracks real-time presence for ghost trading features';
COMMENT ON FUNCTION public.get_coin_viewers(TEXT) IS 'Returns active users viewing a specific coin';
COMMENT ON FUNCTION public.get_coin_heatmap() IS 'Returns heatmap of most viewed coins with whale counts';
COMMENT ON FUNCTION public.cleanup_stale_presence() IS 'Removes stale presence entries';
