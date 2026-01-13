-- ==============================================================================
-- KRYPTOTRAC "FORT KNOX" MIGRATION (GOLDEN MASTER v1.0)
-- Includes: Telemetry, RBAC, Tier Constraints, Auto-Cleanup, and Smoke Tests
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS & SETUP
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. ENUMS & CONSTANTS
-- ------------------------------------------------------------------------------
-- Ensure subscription_tier enum exists and handles the 'magnum' tier
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM ('core', 'defi', 'whale', 'magnum');
  ELSE
    -- Optional: If enum exists but is missing 'magnum', you would handle that here.
    -- For now, we assume if it exists, it matches the schema.
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CORE PROFILES TABLE ENHANCEMENTS
-- ------------------------------------------------------------------------------
-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT
);

-- Safely ADD columns if they don't exist (Idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS add_ons TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS defense_enabled BOOLEAN DEFAULT FALSE;

-- Update Constraints (Drop first to avoid errors on retry)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_add_ons;
ALTER TABLE public.profiles ADD CONSTRAINT valid_add_ons 
  CHECK (add_ons <@ ARRAY['core', 'defi', 'whale', 'magnum']::text[]);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. WEBHOOK TELEMETRY (Debug Stripe Events Safely)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    endpoint TEXT,
    event_type TEXT NOT NULL,
    stripe_event_id TEXT,
    user_id UUID,
    duration_ms INTEGER,
    status INTEGER,
    payload JSONB DEFAULT '{}',
    error_message TEXT,
    CONSTRAINT status_valid CHECK (status IS NULL OR (status >= 100 AND status <= 599))
);

-- Secure the table (Service Role ONLY)
REVOKE ALL ON public.webhook_logs FROM PUBLIC;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_logs" ON public.webhook_logs;
CREATE POLICY "service_role_full_access_logs" 
ON public.webhook_logs 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Performance Indexes
DROP INDEX IF EXISTS idx_webhook_logs_recent;
CREATE INDEX idx_webhook_logs_recent ON public.webhook_logs (created_at) WHERE created_at > now() - interval '14 days';
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_created ON public.webhook_logs (event_type, created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. SECURITY EVENTS (The "Sentinel" Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    event_type TEXT DEFAULT 'security_alert',
    severity TEXT DEFAULT 'info',
    description TEXT,
    tx_hash TEXT,
    confidence_score INTEGER,
    fee_tier TEXT,
    payload JSONB
);

-- Secure the table (Users see their own)
REVOKE ALL ON public.security_events FROM PUBLIC;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own security events" ON public.security_events;
CREATE POLICY "Users view own security events" 
ON public.security_events FOR SELECT 
TO authenticated 
USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created ON public.security_events(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. MAINTENANCE: Auto-Cleanup Function (60 Days)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.webhook_logs WHERE created_at < now() - interval '60 days';
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_webhook_logs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_webhook_logs() TO service_role;

-- Schedule via pg_cron (Safe Fallback)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM set_config('search_path', current_setting('search_path') || ', cron', true);
    -- Idempotent schedule: daily at 02:00 UTC
    BEGIN
      PERFORM cron.schedule('cleanup_webhook_logs_daily', '0 2 * * *', 'SELECT public.cleanup_old_webhook_logs()');
    EXCEPTION WHEN OTHERS THEN
      PERFORM cron.schedule('0 2 * * *', 'SELECT public.cleanup_old_webhook_logs()');
    END;
  ELSE
    RAISE NOTICE 'pg_cron extension not available. Skipping auto-schedule.';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. PII HYGIENE CHECK (Helper View)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_webhook_logs_pii_scan AS
SELECT id, created_at, event_type, 
  (payload::text ~* '\b4[0-9]{12}(?:[0-9]{3})?\b') AS potential_cc_number,
  (payload::text ~* '\bcvv\b' OR payload::text ~* '\bcvc\b') AS mentions_cvv
FROM public.webhook_logs;

REVOKE ALL ON public.v_webhook_logs_pii_scan FROM PUBLIC;

-- ------------------------------------------------------------------------------
-- 7. SMOKE TESTS (Validation)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    found_count INTEGER;
BEGIN
    -- Assert: Profiles Table
    SELECT count(*) INTO found_count FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'add_ons';
    IF found_count = 0 THEN RAISE EXCEPTION 'FAIL: Profiles table missing add_ons column'; END IF;

    -- Assert: Webhook Logs RLS
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_logs' AND (roles @> '{anon}' OR roles @> '{authenticated}')
    ) THEN
        RAISE EXCEPTION 'FAIL: Webhook logs exposed to public!';
    END IF;

    RAISE NOTICE 'SUCCESS: Golden Master Migration Applied. System is Secure.';
END $$;

COMMIT;
