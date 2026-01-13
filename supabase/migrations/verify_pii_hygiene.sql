-- ============================================
-- Krypto Trac: PII Hygiene Verification
-- Ensures webhook_logs contains no sensitive Stripe data
-- ============================================

-- Check 1: Verify webhook_logs table structure
-- Should NOT contain: card numbers, CVV, full payment details, etc.
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('card_number', 'cvv', 'payment_method', 'full_payload') THEN '❌ PII RISK'
    ELSE '✅ Safe'
  END as pii_status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'webhook_logs'
ORDER BY column_name;

-- Check 2: Sample recent logs to verify no sensitive data in metadata
-- Review the metadata JSONB column to ensure it doesn't contain PII
SELECT 
  id,
  event_type,
  user_id,
  feature,
  status,
  -- Only show metadata keys, not values (to avoid exposing data)
  jsonb_object_keys(metadata) as metadata_keys,
  created_at
FROM public.webhook_logs
ORDER BY created_at DESC
LIMIT 20;

-- Check 3: Verify metadata doesn't contain sensitive patterns
-- This query checks for common PII patterns in metadata JSONB
SELECT 
  COUNT(*) as potential_pii_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No obvious PII patterns detected'
    ELSE '⚠️  WARNING: Potential PII patterns found - review metadata structure'
  END as status
FROM public.webhook_logs
WHERE metadata::text ILIKE '%card%'
   OR metadata::text ILIKE '%cvv%'
   OR metadata::text ILIKE '%ssn%'
   OR metadata::text ILIKE '%password%'
   OR metadata::text ILIKE '%secret%';

-- Recommendation: Keep metadata minimal
-- Only store: stripe_event_id, stripe_customer_id, subscription_id
-- DO NOT store: payment methods, card details, full Stripe payloads
