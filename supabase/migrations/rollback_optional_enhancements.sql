-- ============================================
-- Krypto Trac: Rollback Optional Enhancements
-- Use this if you need to revert the optional enhancements
-- ============================================

-- Rollback Enhancement 1: Remove normalization trigger
DROP TRIGGER IF EXISTS normalize_profiles_add_ons ON public.profiles;
DROP FUNCTION IF EXISTS public.normalize_add_ons();

-- Rollback Enhancement 4: Remove public key lookup index
DROP INDEX IF EXISTS public.idx_profiles_public_key_lookup;

-- Rollback Enhancement 5: Remove get_users_with_addon function
DROP FUNCTION IF EXISTS public.get_users_with_addon(TEXT);

-- Rollback Enhancement 6: Remove duplicate prevention trigger
DROP TRIGGER IF EXISTS check_profiles_no_duplicate_addons ON public.profiles;
DROP FUNCTION IF EXISTS public.check_no_duplicate_addons();

-- Note: Enhancement 2 (composite index) was not applied, so nothing to rollback
-- Note: Enhancement 3 (NOT NULL on public_key) was commented out, so nothing to rollback

-- Verification query (should return 0 for all)
SELECT 
  'normalize_add_ons function' as object,
  COUNT(*) as still_exists
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'normalize_add_ons'
UNION ALL
SELECT 
  'get_users_with_addon function',
  COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'get_users_with_addon'
UNION ALL
SELECT 
  'check_no_duplicate_addons function',
  COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'check_no_duplicate_addons'
UNION ALL
SELECT 
  'idx_profiles_public_key_lookup index',
  COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'idx_profiles_public_key_lookup';

-- Expected: All should return 0 (objects removed)
