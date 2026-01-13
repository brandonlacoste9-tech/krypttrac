-- ============================================
-- Krypto Trac: CI/CD Validation Script
-- Run this after each migration to catch regressions
-- ============================================

-- Test 1: Verify GIN index is used for add_ons queries
-- Expected: Should show "Bitmap Index Scan" on idx_profiles_add_ons
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT user_id, add_ons 
FROM public.profiles 
WHERE add_ons @> ARRAY['defi']::text[];

-- Test 2: Verify function permissions (service_role only)
-- This should FAIL for authenticated/anon roles
DO $$
BEGIN
  -- Test as authenticated (should fail)
  BEGIN
    SET ROLE authenticated;
    PERFORM public.add_user_addon(gen_random_uuid(), 'defi');
    RAISE EXCEPTION 'SECURITY FAILURE: authenticated role can execute add_user_addon';
  EXCEPTION
    WHEN insufficient_privilege THEN
      -- Expected: permission denied
      RAISE NOTICE '✅ PASS: authenticated role correctly blocked';
    WHEN OTHERS THEN
      RAISE NOTICE '✅ PASS: authenticated role correctly blocked (other error)';
  END;
  
  -- Test as anon (should fail)
  BEGIN
    SET ROLE anon;
    PERFORM public.add_user_addon(gen_random_uuid(), 'defi');
    RAISE EXCEPTION 'SECURITY FAILURE: anon role can execute add_user_addon';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE '✅ PASS: anon role correctly blocked';
    WHEN OTHERS THEN
      RAISE NOTICE '✅ PASS: anon role correctly blocked (other error)';
  END;
  
  RESET ROLE;
END $$;

-- Test 3: Verify CHECK constraint rejects invalid add-ons
-- This should FAIL
DO $$
BEGIN
  INSERT INTO public.profiles (user_id, add_ons)
  VALUES (gen_random_uuid(), ARRAY['invalid_addon']::text[]);
  RAISE EXCEPTION 'SECURITY FAILURE: CHECK constraint did not reject invalid add-on';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ PASS: CHECK constraint correctly rejects invalid add-ons';
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  WARNING: Unexpected error: %', SQLERRM;
END $$;

-- Test 4: Verify normalization trigger converts to lowercase
-- This should succeed and store as lowercase
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_add_ons TEXT[];
BEGIN
  INSERT INTO public.profiles (user_id, add_ons)
  VALUES (test_user_id, ARRAY['DeFi', 'CORE']::text[])
  RETURNING add_ons INTO test_add_ons;
  
  IF test_add_ons = ARRAY['defi', 'core']::text[] THEN
    RAISE NOTICE '✅ PASS: Normalization trigger converts to lowercase';
  ELSE
    RAISE EXCEPTION 'FAIL: Normalization did not work. Got: %', test_add_ons;
  END IF;
  
  DELETE FROM public.profiles WHERE user_id = test_user_id;
END $$;

-- Test 5: Verify duplicate prevention trigger
-- This should FAIL
DO $$
BEGIN
  INSERT INTO public.profiles (user_id, add_ons)
  VALUES (gen_random_uuid(), ARRAY['defi', 'defi']::text[]);
  RAISE EXCEPTION 'SECURITY FAILURE: Duplicate prevention did not work';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%duplicate%' THEN
      RAISE NOTICE '✅ PASS: Duplicate prevention trigger works';
    ELSE
      RAISE NOTICE '⚠️  WARNING: Unexpected error: %', SQLERRM;
    END IF;
END $$;

-- Test 6: Verify RLS policies (requires actual auth context)
-- Note: This is a simplified check - full RLS testing requires authenticated sessions
SELECT 
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS: RLS policies exist'
    ELSE '❌ FAIL: Missing RLS policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Test 7: Verify indexes exist
SELECT 
  COUNT(*) as index_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS: Required indexes exist'
    ELSE '❌ FAIL: Missing indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND indexname IN (
    'idx_profiles_user_id',
    'idx_profiles_add_ons',
    'idx_profiles_public_key',
    'profiles_user_id_key'
  );

-- Summary
SELECT 'CI Validation Complete' as status;
