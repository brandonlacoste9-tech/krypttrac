-- ============================================
-- Krypto Trac: RLS & Function Permission Validation Tests
-- Run this after deployments to verify security
-- ============================================

-- Test 1: Verify CHECK constraint on add_ons
-- This should FAIL (invalid add-on name)
INSERT INTO public.profiles (user_id, add_ons)
VALUES (gen_random_uuid(), ARRAY['invalid_addon']::text[]);
-- Expected: ERROR: new row violates check constraint "profiles_add_ons_allowed"

-- Test 2: Verify valid add-on names are accepted
-- This should SUCCEED (using service role or authenticated user)
INSERT INTO public.profiles (user_id, add_ons)
VALUES (gen_random_uuid(), ARRAY['core', 'defi']::text[]);
-- Expected: Success

-- Test 3: Verify function permissions (service_role only)
-- As authenticated user, this should FAIL
SET ROLE authenticated;
SELECT add_user_addon(gen_random_uuid(), 'defi');
-- Expected: ERROR: permission denied for function add_user_addon

-- As service_role, this should SUCCEED
SET ROLE service_role;
SELECT add_user_addon(gen_random_uuid(), 'defi');
-- Expected: Success

-- Test 4: Verify RLS - User can only see their own profile
-- (This requires actual auth.uid() context, so run in application context)
-- Expected: Users can only SELECT/UPDATE their own profiles

-- Test 5: Verify GIN index is used for array queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.profiles 
WHERE add_ons @> ARRAY['defi']::text[];
-- Expected: Should show "Bitmap Index Scan" on idx_profiles_add_ons

-- Test 6: Verify foreign key constraints
-- This should FAIL (invalid user_id)
INSERT INTO public.profiles (user_id, add_ons)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, ARRAY['core']::text[]);
-- Expected: ERROR: insert or update on table "profiles" violates foreign key constraint

-- Test 7: Verify triggers update updated_at
-- Create a profile, wait 1 second, update it, check updated_at changed
INSERT INTO public.profiles (user_id, add_ons)
VALUES (gen_random_uuid(), ARRAY['core']::text[])
RETURNING id, created_at, updated_at;

-- Then update it
UPDATE public.profiles 
SET add_ons = ARRAY['core', 'defi']::text[]
WHERE id = 'INSERT_ID_HERE';
-- Expected: updated_at should be newer than created_at

-- Reset role
RESET ROLE;
