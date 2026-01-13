-- ============================================
-- Krypto Trac: Security Events & Sentinel System
-- Tracks security events and triggers automatic lockdowns
-- ============================================

-- Create security_events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'ip_anomaly',
    'unauthorized_access',
    'ai_threat_detected',
    'panic_button',
    'massive_withdrawal',
    'new_mixer_address',
    'suspicious_transaction',
    'session_hijack_attempt',
    'api_key_compromise',
    'vault_breach_attempt'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  threat_signature TEXT, -- Behavioral signature detected by AI
  ip_address INET,
  user_agent TEXT,
  location JSONB, -- Geographic location data
  metadata JSONB DEFAULT '{}', -- Additional event details
  ai_confidence NUMERIC(5, 2), -- AI confidence score (0-100)
  vertex_ai_model_version TEXT DEFAULT 'sentinel-v1',
  detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution_action TEXT -- 'blocked_ip', 'revoked_sessions', 'locked_account', etc.
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_detected_at ON public.security_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_critical ON public.security_events(severity, detected_at DESC) 
  WHERE severity = 'critical';

-- Convert to TimescaleDB hypertable (if extension enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable(
      'public.security_events',
      'detected_at',
      chunk_time_interval => INTERVAL '1 day',
      if_not_exists => TRUE
    );
    RAISE NOTICE '✅ Security events converted to TimescaleDB hypertable';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own security events
DROP POLICY IF EXISTS "Users can view own security events" ON public.security_events;
CREATE POLICY "Users can view own security events"
  ON public.security_events FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all events
DROP POLICY IF EXISTS "Service role can manage security events" ON public.security_events;
CREATE POLICY "Service role can manage security events"
  ON public.security_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create security_lockdown table
CREATE TABLE IF NOT EXISTS public.security_lockdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  locked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  locked_by TEXT NOT NULL CHECK (locked_by IN ('sentinel_ai', 'panic_button', 'manual', 'ip_block')),
  lock_reason TEXT NOT NULL,
  security_event_id UUID REFERENCES public.security_events(id),
  vault_cleared BOOLEAN DEFAULT FALSE,
  sessions_revoked BOOLEAN DEFAULT FALSE,
  api_keys_revoked BOOLEAN DEFAULT FALSE,
  withdrawals_blocked BOOLEAN DEFAULT TRUE,
  recovery_method TEXT CHECK (recovery_method IN ('email_verification', 'mfa', 'hardware_key', 'support_review')),
  recovery_initiated_at TIMESTAMPTZ,
  recovery_completed_at TIMESTAMPTZ,
  unlock_code TEXT, -- Temporary unlock code for recovery
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_security_lockdown_user_id ON public.security_lockdown(user_id);
CREATE INDEX IF NOT EXISTS idx_security_lockdown_locked_at ON public.security_lockdown(locked_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_lockdown_active ON public.security_lockdown(user_id) 
  WHERE recovery_completed_at IS NULL;

-- Enable RLS
ALTER TABLE public.security_lockdown ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own lockdown status
DROP POLICY IF EXISTS "Users can view own lockdown" ON public.security_lockdown;
CREATE POLICY "Users can view own lockdown"
  ON public.security_lockdown FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all lockdowns
DROP POLICY IF EXISTS "Service role can manage lockdowns" ON public.security_lockdown;
CREATE POLICY "Service role can manage lockdowns"
  ON public.security_lockdown FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add is_locked column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
    CREATE INDEX IF NOT EXISTS idx_profiles_is_locked ON public.profiles(is_locked) WHERE is_locked = TRUE;
  END IF;
END $$;

-- Function to revoke all user sessions
CREATE OR REPLACE FUNCTION public.revoke_user_sessions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_revoked_count INTEGER;
BEGIN
  -- Revoke all sessions for the user
  UPDATE auth.sessions
  SET revoked_at = NOW()
  WHERE user_id = p_user_id
    AND revoked_at IS NULL;
  
  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  
  RETURN v_revoked_count;
END;
$$;

-- Function to lock user account
CREATE OR REPLACE FUNCTION public.lock_account(
  p_user_id UUID,
  p_locked_by TEXT,
  p_lock_reason TEXT,
  p_security_event_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lockdown_id UUID;
  v_unlock_code TEXT;
BEGIN
  -- Generate unlock code
  v_unlock_code := encode(gen_random_bytes(16), 'hex');
  
  -- Create lockdown record
  INSERT INTO public.security_lockdown (
    user_id,
    locked_by,
    lock_reason,
    security_event_id,
    vault_cleared,
    sessions_revoked,
    api_keys_revoked,
    withdrawals_blocked,
    unlock_code
  )
  VALUES (
    p_user_id,
    p_locked_by,
    p_lock_reason,
    p_security_event_id,
    TRUE, -- Clear vault
    TRUE, -- Revoke sessions
    TRUE, -- Revoke API keys
    TRUE, -- Block withdrawals
    v_unlock_code
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    locked_at = NOW(),
    locked_by = EXCLUDED.locked_by,
    lock_reason = EXCLUDED.lock_reason,
    security_event_id = EXCLUDED.security_event_id,
    vault_cleared = TRUE,
    sessions_revoked = TRUE,
    api_keys_revoked = TRUE,
    withdrawals_blocked = TRUE,
    unlock_code = v_unlock_code,
    recovery_completed_at = NULL,
    updated_at = NOW()
  RETURNING id INTO v_lockdown_id;
  
  -- Update profile
  UPDATE public.profiles
  SET is_locked = TRUE
  WHERE user_id = p_user_id;
  
  -- Revoke all sessions
  PERFORM public.revoke_user_sessions(p_user_id);
  
  -- Revoke API keys (mark as inactive)
  UPDATE public.user_api_keys
  SET is_active = FALSE
  WHERE user_id = p_user_id;
  
  RETURN v_lockdown_id;
END;
$$;

-- Function to unlock account
CREATE OR REPLACE FUNCTION public.unlock_account(
  p_user_id UUID,
  p_unlock_code TEXT,
  p_recovery_method TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lockdown RECORD;
BEGIN
  -- Verify unlock code
  SELECT * INTO v_lockdown
  FROM public.security_lockdown
  WHERE user_id = p_user_id
    AND unlock_code = p_unlock_code
    AND recovery_completed_at IS NULL;
  
  IF v_lockdown IS NULL THEN
    RETURN FALSE; -- Invalid unlock code
  END IF;
  
  -- Update lockdown record
  UPDATE public.security_lockdown
  SET 
    recovery_method = p_recovery_method,
    recovery_initiated_at = NOW(),
    recovery_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_lockdown.id;
  
  -- Update profile
  UPDATE public.profiles
  SET is_locked = FALSE
  WHERE user_id = p_user_id;
  
  -- Clear unlock code (one-time use)
  UPDATE public.security_lockdown
  SET unlock_code = NULL
  WHERE id = v_lockdown.id;
  
  RETURN TRUE;
END;
$$;

-- Trigger: Auto-lockdown on critical security events
CREATE OR REPLACE FUNCTION public.trigger_security_lockdown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lockdown_id UUID;
BEGIN
  -- Only trigger on critical events
  IF NEW.severity = 'critical' AND NEW.user_id IS NOT NULL THEN
    -- Lock account automatically
    v_lockdown_id := public.lock_account(
      p_user_id := NEW.user_id,
      p_locked_by := 'sentinel_ai',
      p_lock_reason := 'Critical security threat detected: ' || NEW.event_type,
      p_security_event_id := NEW.id
    );
    
    -- Broadcast lockdown event
    PERFORM pg_notify(
      'security_lockdown',
      json_build_object(
        'user_id', NEW.user_id,
        'lockdown_id', v_lockdown_id,
        'reason', NEW.event_type,
        'timestamp', NOW()
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_lockdown ON public.security_events;
CREATE TRIGGER trigger_auto_lockdown
  AFTER INSERT ON public.security_events
  FOR EACH ROW
  WHEN (NEW.severity = 'critical')
  EXECUTE FUNCTION public.trigger_security_lockdown();

COMMENT ON TABLE public.security_events IS 'Security events detected by Sentinel AI and system';
COMMENT ON TABLE public.security_lockdown IS 'Account lockdown records with recovery mechanisms';
COMMENT ON FUNCTION public.revoke_user_sessions(UUID) IS 'Revokes all active sessions for a user';
COMMENT ON FUNCTION public.lock_account(UUID, TEXT, TEXT, UUID) IS 'Locks user account and revokes all access';
COMMENT ON FUNCTION public.unlock_account(UUID, TEXT, TEXT) IS 'Unlocks user account with recovery code';
COMMENT ON FUNCTION public.trigger_security_lockdown() IS 'Automatically locks account on critical security events';
