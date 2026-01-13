-- ============================================
-- Krypto Trac: Safe NOT NULL Migration for public_key
-- This migration safely adds NOT NULL constraint with backfill
-- ============================================

-- Step 1: Check for existing NULL values
-- Run this first to see if any profiles have NULL public_key
SELECT 
  COUNT(*) as profiles_with_null_public_key,
  COUNT(DISTINCT user_id) as affected_users
FROM public.profiles
WHERE public_key IS NULL;

-- Step 2: Backfill NULL values with a placeholder (if needed)
-- Only run this if you want to set a default value for existing NULLs
-- Uncomment and modify as needed:
/*
UPDATE public.profiles
SET public_key = 'PENDING_RECOVERY_' || user_id::text
WHERE public_key IS NULL;
*/

-- Step 3: Add NOT NULL constraint
-- WARNING: This will fail if any NULL values exist
-- Only run after backfilling or confirming no NULLs exist
/*
ALTER TABLE public.profiles
  ALTER COLUMN public_key SET NOT NULL;
*/

-- Step 4: Add a check constraint to ensure public_key format (optional)
-- Validates Ed25519 public key format (64 hex characters)
/*
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_public_key_format;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_public_key_format
  CHECK (
    public_key ~ '^[0-9a-f]{64}$' OR 
    public_key LIKE 'PENDING_RECOVERY_%'
  );
*/

-- Usage Instructions:
-- 1. Run Step 1 to check for NULLs
-- 2. If NULLs exist, decide on backfill strategy (Step 2)
-- 3. After backfill, run Step 3 to add NOT NULL
-- 4. Optionally add format validation (Step 4)
