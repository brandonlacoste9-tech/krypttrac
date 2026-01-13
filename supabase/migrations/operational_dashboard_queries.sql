-- ============================================
-- Krypto Trac: Operational Dashboard Queries
-- Use these for on-call monitoring and troubleshooting
-- ============================================

-- ============================================
-- 1. RECENT ERROR RATE (Last 24 Hours)
-- ============================================
SELECT 
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) FILTER (WHERE status = 'error') AS errors,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / NULLIF(COUNT(*), 0), 2) AS error_rate_pct,
  AVG(duration_ms) FILTER (WHERE status = 'error') AS avg_error_duration_ms,
  AVG(duration_ms) FILTER (WHERE status = 'success') AS avg_success_duration_ms
FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- ============================================
-- 2. SLOWEST WEBHOOKS (Last 24 Hours)
-- ============================================
SELECT 
  id,
  event_type,
  user_id,
  feature,
  status,
  duration_ms,
  error_message,
  created_at
FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY duration_ms DESC
LIMIT 20;

-- ============================================
-- 3. ERROR BREAKDOWN BY EVENT TYPE
-- ============================================
SELECT 
  event_type,
  COUNT(*) FILTER (WHERE status = 'error') AS error_count,
  COUNT(*) FILTER (WHERE status = 'success') AS success_count,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / NULLIF(COUNT(*), 0), 2) AS error_rate_pct,
  AVG(duration_ms) AS avg_duration_ms,
  MAX(duration_ms) AS max_duration_ms
FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY error_count DESC;

-- ============================================
-- 4. PERFORMANCE PERCENTILES (Last 7 Days)
-- ============================================
SELECT 
  event_type,
  COUNT(*) AS total_requests,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) AS p50_ms,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY duration_ms) AS p75_ms,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY duration_ms) AS p90_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99_ms,
  MAX(duration_ms) AS max_ms,
  AVG(duration_ms) AS avg_ms
FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND status = 'success'
GROUP BY event_type
ORDER BY p95_ms DESC;

-- ============================================
-- 5. DAILY VOLUME TREND (Last 30 Days)
-- ============================================
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS total_webhooks,
  COUNT(*) FILTER (WHERE status = 'error') AS errors,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / NULLIF(COUNT(*), 0), 2) AS error_rate_pct,
  AVG(duration_ms) AS avg_duration_ms
FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;

-- ============================================
-- 6. TOP ERROR MESSAGES (Last 24 Hours)
-- ============================================
SELECT 
  error_message,
  COUNT(*) AS occurrence_count,
  AVG(duration_ms) AS avg_duration_ms,
  MIN(created_at) AS first_occurrence,
  MAX(created_at) AS last_occurrence
FROM public.webhook_logs
WHERE status = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
  AND error_message IS NOT NULL
GROUP BY error_message
ORDER BY occurrence_count DESC
LIMIT 10;

-- ============================================
-- 7. FEATURE-SPECIFIC METRICS (Last 7 Days)
-- ============================================
SELECT 
  feature,
  COUNT(*) AS total_webhooks,
  COUNT(*) FILTER (WHERE status = 'error') AS errors,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / NULLIF(COUNT(*), 0), 2) AS error_rate_pct,
  AVG(duration_ms) AS avg_duration_ms
FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND feature IS NOT NULL
GROUP BY feature
ORDER BY total_webhooks DESC;

-- ============================================
-- 8. VOLUME ALERT CHECK (Daily Threshold)
-- ============================================
-- Use this to check if daily volume exceeds expected threshold
-- Expected: ~100-1000 webhooks/day for typical SaaS
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS daily_volume,
  CASE 
    WHEN COUNT(*) > 10000 THEN '🚨 ALERT: Volume exceeds 10k/day'
    WHEN COUNT(*) > 5000 THEN '⚠️  WARNING: Volume exceeds 5k/day'
    WHEN COUNT(*) > 1000 THEN 'ℹ️  INFO: High volume day'
    ELSE '✅ NORMAL: Volume within expected range'
  END AS volume_status
FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day DESC;

-- ============================================
-- 9. RETENTION POLICY HEALTH CHECK
-- ============================================
SELECT 
  COUNT(*) AS total_logs,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '60 days') AS logs_to_delete,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days') AS logs_to_keep,
  MIN(created_at) AS oldest_log,
  MAX(created_at) AS newest_log,
  CASE 
    WHEN COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '60 days') > 0 
    THEN '⚠️  INFO: ' || COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '60 days') || ' logs ready for cleanup'
    ELSE '✅ PASS: No logs older than 60 days'
  END AS retention_status
FROM public.webhook_logs;

-- ============================================
-- 10. REAL-TIME HEALTH CHECK (Last Hour)
-- ============================================
SELECT 
  'Last Hour Health' AS check_type,
  COUNT(*) AS total_webhooks,
  COUNT(*) FILTER (WHERE status = 'error') AS errors,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / NULLIF(COUNT(*), 0), 2) AS error_rate_pct,
  AVG(duration_ms) AS avg_duration_ms,
  MAX(duration_ms) AS max_duration_ms,
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'error') > COUNT(*) * 0.1 THEN '🚨 ALERT: Error rate > 10%'
    WHEN COUNT(*) FILTER (WHERE status = 'error') > COUNT(*) * 0.05 THEN '⚠️  WARNING: Error rate > 5%'
    WHEN AVG(duration_ms) > 5000 THEN '⚠️  WARNING: Average duration > 5s'
    ELSE '✅ HEALTHY: All metrics within normal range'
  END AS health_status
FROM public.webhook_logs
WHERE created_at > NOW() - INTERVAL '1 hour';
