-- ============================================
-- Krypto Trac: Final Verification Checklist
-- Run this after production deployment to confirm all systems operational
-- ============================================

-- ============================================
-- 1. RETENTION POLICY VERIFICATION
-- ============================================

-- Check cleanup function exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_webhook_logs') 
    THEN '✅ PASS: cleanup_old_webhook_logs() function exists'
    ELSE '❌ FAIL: cleanup_old_webhook_logs() function missing'
  END as retention_function_status;

-- Check pg_cron extension
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
    THEN '✅ PASS: pg_cron extension enabled'
    ELSE '⚠️  WARNING: pg_cron extension not enabled - retention job will not run automatically'
  END as pg_cron_status;

-- Check cron job scheduled
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  CASE 
    WHEN active THEN '✅ PASS: Job is active'
    ELSE '❌ FAIL: Job is inactive'
  END as job_status
FROM cron.job 
WHERE jobname = 'cleanup-webhook-logs';

-- Check last run time (if available)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time,
  CASE 
    WHEN status = 'succeeded' THEN '✅ PASS: Last run succeeded'
    WHEN status = 'failed' THEN '❌ FAIL: Last run failed'
    WHEN status = 'running' THEN '⚠️  INFO: Currently running'
    ELSE '⚠️  INFO: Status: ' || status
  END as last_run_status
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-webhook-logs')
ORDER BY start_time DESC 
LIMIT 5;

-- Dry run: Count rows that would be deleted (>60 days old)
SELECT 
  COUNT(*) as rows_to_delete,
  MIN(created_at) as oldest_log,
  MAX(created_at) as newest_log_to_delete,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No logs older than 60 days'
    ELSE '⚠️  INFO: ' || COUNT(*) || ' rows would be deleted in next cleanup'
  END as dry_run_status
FROM public.webhook_logs
WHERE created_at < NOW() - INTERVAL '60 days';

-- ============================================
-- 2. PII HYGIENE VERIFICATION
-- ============================================

-- Check for PII patterns in metadata
SELECT 
  COUNT(*) as potential_pii_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No PII patterns detected'
    ELSE '❌ FAIL: ' || COUNT(*) || ' potential PII patterns found - review metadata'
  END as pii_status
FROM public.webhook_logs
WHERE metadata::text ILIKE '%card%'
   OR metadata::text ILIKE '%cvv%'
   OR metadata::text ILIKE '%ssn%'
   OR metadata::text ILIKE '%password%'
   OR metadata::text ILIKE '%secret%'
   OR metadata::text ILIKE '%token%';

-- Verify metadata only contains safe fields
SELECT 
  jsonb_object_keys(metadata) as metadata_key,
  COUNT(*) as occurrence_count
FROM public.webhook_logs
WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb
GROUP BY metadata_key
ORDER BY occurrence_count DESC;

-- Expected safe keys: stripe_event_id, stripe_customer_id, subscription_id, price_id
-- If other keys appear, review Edge Function sanitization

-- ============================================
-- 3. PARTIAL INDEX VERIFICATION
-- ============================================

-- Check partial index exists
SELECT 
  indexname,
  indexdef,
  CASE 
    WHEN indexname = 'idx_webhook_logs_recent' THEN '✅ PASS: Partial index exists'
    ELSE '❌ FAIL: Partial index missing'
  END as partial_index_status
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'webhook_logs'
  AND indexname = 'idx_webhook_logs_recent';

-- Verify partial index is used for recent queries
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;
-- Expected: Should show "Index Scan using idx_webhook_logs_recent"

-- ============================================
-- 4. TABLE STRUCTURE VERIFICATION
-- ============================================

-- Verify all required columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'webhook_logs'
ORDER BY ordinal_position;

-- Verify all indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'webhook_logs'
ORDER BY indexname;

-- ============================================
-- 5. RLS POLICY VERIFICATION
-- ============================================

-- Check RLS is enabled
SELECT 
  CASE 
    WHEN relrowsecurity THEN '✅ PASS: RLS is enabled'
    ELSE '❌ FAIL: RLS is disabled'
  END as rls_status
FROM pg_class
WHERE relname = 'webhook_logs';

-- Check policies exist
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  CASE 
    WHEN policyname = 'Service role can manage webhook logs' THEN '✅ PASS: Service role policy exists'
    ELSE '⚠️  INFO: Policy: ' || policyname
  END as policy_status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'webhook_logs';

-- ============================================
-- 6. SAMPLE DATA VERIFICATION
-- ============================================

-- Check recent webhook logs (if any)
SELECT 
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  COUNT(*) FILTER (WHERE status = 'error') as error_count,
  MIN(created_at) as oldest_log,
  MAX(created_at) as newest_log,
  AVG(duration_ms) as avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms
FROM public.webhook_logs;

-- Sample recent logs (metadata sanitized)
SELECT 
  id,
  event_type,
  user_id,
  feature,
  status,
  duration_ms,
  jsonb_object_keys(metadata) as metadata_keys,
  created_at
FROM public.webhook_logs
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  'Final Verification Complete' as status,
  NOW() as verification_timestamp,
  'Review results above for any ❌ FAIL or ⚠️  WARNING items' as next_steps;
