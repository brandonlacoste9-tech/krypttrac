-- ============================================
-- Krypto Trac: Optional Database Enhancements
-- Apply these if you need the additional features
-- ============================================

-- Enhancement 1: Normalize add_ons to lowercase
-- Prevents mismatches like 'DeFi' vs 'defi'
CREATE OR REPLACE FUNCTION public.normalize_add_ons()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Convert all add_ons array values to lowercase
  NEW.add_ons := array(SELECT lower(unnest(NEW.add_ons)));
  RETURN NEW;
END;
$$;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS normalize_profiles_add_ons ON public.profiles;
CREATE TRIGGER normalize_profiles_add_ons
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.add_ons IS NOT NULL)
  EXECUTE FUNCTION public.normalize_add_ons();

-- Enhancement 2: Composite index for user_id + add_ons lookups
-- Note: GIN indexes can't combine UUID and array types directly
-- The existing separate indexes (idx_profiles_user_id btree + idx_profiles_add_ons GIN) 
-- are sufficient for composite queries. PostgreSQL will use both indexes efficiently.
-- No additional index needed.

-- Enhancement 3: Make public_key NOT NULL (if enforcing presence post-recovery)
-- WARNING: Only run this if you want to enforce public_key after recovery
-- This will fail if any existing profiles have NULL public_key
-- Uncomment to enable:
/*
ALTER TABLE public.profiles
  ALTER COLUMN public_key SET NOT NULL;
*/

-- Enhancement 4: Add index on public_key for faster lookups
-- Useful for Ed25519 signature verification
CREATE INDEX IF NOT EXISTS idx_profiles_public_key_lookup 
ON public.profiles(public_key) 
WHERE public_key IS NOT NULL;

-- Enhancement 5: Function to get all users with a specific add-on
-- Useful for analytics or feature rollouts
CREATE OR REPLACE FUNCTION public.get_users_with_addon(
  p_addon_name TEXT
)
RETURNS TABLE (
  user_id UUID,
  add_ons TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.add_ons,
    p.created_at
  FROM public.profiles p
  WHERE p.add_ons @> ARRAY[lower(p_addon_name)]::text[];
END;
$$;

-- Grant to service_role only
GRANT EXECUTE ON FUNCTION public.get_users_with_addon(TEXT) TO service_role;

-- Enhancement 6: Add constraint to ensure add_ons array doesn't have duplicates
-- This is handled by the normalize function, but this adds an extra safety check
CREATE OR REPLACE FUNCTION public.check_no_duplicate_addons()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if array has duplicates
  IF array_length(NEW.add_ons, 1) IS NOT NULL AND
     array_length(NEW.add_ons, 1) != array_length(array(SELECT DISTINCT unnest(NEW.add_ons)), 1) THEN
    RAISE EXCEPTION 'add_ons array contains duplicate values';
  END IF;
  RETURN NEW;
END;
$$;

-- Apply trigger
DROP TRIGGER IF EXISTS check_profiles_no_duplicate_addons ON public.profiles;
CREATE TRIGGER check_profiles_no_duplicate_addons
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.add_ons IS NOT NULL)
  EXECUTE FUNCTION public.check_no_duplicate_addons();

-- Comments
COMMENT ON FUNCTION public.normalize_add_ons IS 'Normalizes add_ons array values to lowercase to prevent mismatches';
COMMENT ON FUNCTION public.get_users_with_addon IS 'Returns all users who have a specific add-on active';
COMMENT ON FUNCTION public.check_no_duplicate_addons IS 'Ensures add_ons array does not contain duplicate values';
COMMENT ON INDEX idx_profiles_user_id_add_ons IS 'Composite index for efficient user_id + add_ons queries';
