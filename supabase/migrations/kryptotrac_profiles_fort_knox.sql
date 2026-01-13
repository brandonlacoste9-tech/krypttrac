-- ============================================
-- Krypto Trac: Complete Profiles & Fort Knox Migration
-- Idempotent: Safe to run multiple times
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  add_ons TEXT[] DEFAULT '{}',
  public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_add_ons ON public.profiles USING GIN (add_ons);
CREATE INDEX idx_profiles_public_key ON public.profiles(public_key) WHERE public_key IS NOT NULL;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (DROP first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Create add_user_addon function
CREATE OR REPLACE FUNCTION public.add_user_addon(
  p_user_id UUID,
  p_addon_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert profile: create if missing, update if exists
  INSERT INTO public.profiles (user_id, add_ons)
  VALUES (p_user_id, ARRAY[p_addon_name])
  ON CONFLICT (user_id) DO UPDATE
  SET 
    add_ons = CASE 
      WHEN NOT (p_addon_name = ANY(profiles.add_ons)) 
      THEN profiles.add_ons || p_addon_name
      ELSE profiles.add_ons
    END,
    updated_at = NOW();
END;
$$;

-- Grant to service_role only (webhooks use service role)
GRANT EXECUTE ON FUNCTION public.add_user_addon(UUID, TEXT) TO service_role;

-- 3. Create remove_user_addon function
CREATE OR REPLACE FUNCTION public.remove_user_addon(
  p_user_id UUID,
  p_addon_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    add_ons = array_remove(add_ons, p_addon_name),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Grant to service_role only
GRANT EXECUTE ON FUNCTION public.remove_user_addon(UUID, TEXT) TO service_role;

-- 4. Create guardians table
DROP TABLE IF EXISTS public.guardians CASCADE;

CREATE TABLE public.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_email TEXT,
  guardian_wallet_address TEXT,
  nickname TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guardian_user_id)
);

-- Indexes
CREATE INDEX idx_guardians_user_id ON public.guardians(user_id);
CREATE INDEX idx_guardians_guardian_user_id ON public.guardians(guardian_user_id);
CREATE INDEX idx_guardians_status ON public.guardians(status);

-- Enable RLS
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own guardians" ON public.guardians;
DROP POLICY IF EXISTS "Guardians can view entries where they are guardian" ON public.guardians;
DROP POLICY IF EXISTS "Users can add their own guardians" ON public.guardians;
DROP POLICY IF EXISTS "Users can update their own guardians" ON public.guardians;
DROP POLICY IF EXISTS "Users can delete their own guardians" ON public.guardians;

CREATE POLICY "Users can view their own guardians"
  ON public.guardians FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view entries where they are guardian"
  ON public.guardians FOR SELECT
  USING (auth.uid() = guardian_user_id);

CREATE POLICY "Users can add their own guardians"
  ON public.guardians FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guardians"
  ON public.guardians FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guardians"
  ON public.guardians FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create recovery_requests table
DROP TABLE IF EXISTS public.recovery_requests CASCADE;

CREATE TABLE public.recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_public_key TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired')),
  approvals_required INTEGER DEFAULT 2,
  approvals_received INTEGER DEFAULT 0,
  guardian_approvals JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recovery_requests_user_id ON public.recovery_requests(user_id);
CREATE INDEX idx_recovery_requests_status ON public.recovery_requests(status);

-- Enable RLS
ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their recovery requests" ON public.recovery_requests;
DROP POLICY IF EXISTS "Guardians can view recovery requests they can approve" ON public.recovery_requests;
DROP POLICY IF EXISTS "Users can create recovery requests" ON public.recovery_requests;
DROP POLICY IF EXISTS "Guardians can update recovery requests" ON public.recovery_requests;
DROP POLICY IF EXISTS "Users can complete their recovery requests" ON public.recovery_requests;

CREATE POLICY "Users can view their recovery requests"
  ON public.recovery_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view recovery requests they can approve"
  ON public.recovery_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.guardians
      WHERE guardians.user_id = recovery_requests.user_id
      AND guardians.guardian_user_id = auth.uid()
      AND guardians.status = 'active'
    )
  );

CREATE POLICY "Users can create recovery requests"
  ON public.recovery_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guardians can update recovery requests"
  ON public.recovery_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.guardians
      WHERE guardians.user_id = recovery_requests.user_id
      AND guardians.guardian_user_id = auth.uid()
      AND guardians.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guardians
      WHERE guardians.user_id = recovery_requests.user_id
      AND guardians.guardian_user_id = auth.uid()
      AND guardians.status = 'active'
    )
  );

CREATE POLICY "Users can complete their recovery requests"
  ON public.recovery_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'approved')
  WITH CHECK (auth.uid() = user_id AND status = 'completed');

-- 6. Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_guardians_updated_at ON public.guardians;
CREATE TRIGGER update_guardians_updated_at
  BEFORE UPDATE ON public.guardians
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_recovery_requests_updated_at ON public.recovery_requests;
CREATE TRIGGER update_recovery_requests_updated_at
  BEFORE UPDATE ON public.recovery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Comments
COMMENT ON TABLE public.profiles IS 'User profiles with subscription add-ons (core, defi, whale, magnum) and Fort Knox public keys';
COMMENT ON TABLE public.guardians IS 'Social Recovery Guardians - Users who can help recover accounts';
COMMENT ON TABLE public.recovery_requests IS 'Account Recovery Requests - Tracks recovery process with guardian approvals';
COMMENT ON FUNCTION public.add_user_addon IS 'Adds subscription add-on to user profile. Valid add-ons: core, defi, whale, magnum';
COMMENT ON FUNCTION public.remove_user_addon IS 'Removes subscription add-on from user profile';
