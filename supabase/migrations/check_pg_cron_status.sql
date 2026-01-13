-- ============================================
-- Krypto Trac: pg_cron Status Check
-- Use this to verify cron jobs are scheduled and running
-- ============================================

-- Check if pg_cron extension is enabled
SELECT 
  extname,
  extversion,
  CASE 
    WHEN extname = 'pg_cron' THEN '✅ PASS: pg_cron extension enabled'
    ELSE '❌ FAIL: pg_cron extension not found'
  END as extension_status
FROM pg_extension
WHERE extname = 'pg_cron';

-- List all scheduled cron jobs
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
    WHEN active THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END as job_status
FROM cron.job
ORDER BY jobname;

-- Check specific jobs for webhook logs
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active,
  CASE 
    WHEN jobname = 'cleanup-webhook-logs' AND active THEN '✅ PASS: Cleanup job is active'
    WHEN jobname = 'cleanup-webhook-logs' AND NOT active THEN '❌ FAIL: Cleanup job is inactive'
    WHEN jobname = 'retry-failed-webhook-logs' AND active THEN '✅ PASS: Retry job is active'
    WHEN jobname = 'retry-failed-webhook-logs' AND NOT active THEN '❌ FAIL: Retry job is inactive'
    ELSE 'ℹ️  INFO: ' || jobname
  END as job_status
FROM cron.job
WHERE jobname IN ('cleanup-webhook-logs', 'retry-failed-webhook-logs', 'cleanup-dead-letter-logs')
ORDER BY jobname;

-- Check last run details for all jobs
SELECT 
  j.jobid,
  j.jobname,
  jrd.runid,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time,
  jrd.end_time - jrd.start_time as duration,
  CASE 
    WHEN jrd.status = 'succeeded' THEN '✅ SUCCESS'
    WHEN jrd.status = 'failed' THEN '❌ FAILED'
    WHEN jrd.status = 'running' THEN '⏳ RUNNING'
    ELSE '⚠️  ' || jrd.status
  END as run_status
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT *
  FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY start_time DESC
  LIMIT 1
) jrd ON true
WHERE j.jobname IN ('cleanup-webhook-logs', 'retry-failed-webhook-logs', 'cleanup-dead-letter-logs')
ORDER BY j.jobname, jrd.start_time DESC;

-- Check recent run history (last 10 runs per job)
SELECT 
  j.jobname,
  jrd.runid,
  jrd.status,
  jrd.start_time,
  jrd.end_time,
  jrd.end_time - jrd.start_time as duration,
  LEFT(jrd.return_message, 100) as return_message_preview
FROM cron.job j
JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE j.jobname IN ('cleanup-webhook-logs', 'retry-failed-webhook-logs', 'cleanup-dead-letter-logs')
ORDER BY jrd.start_time DESC
LIMIT 30;

-- Calculate next run times (approximate)
SELECT 
  jobname,
  schedule,
  CASE 
    WHEN schedule LIKE '% * * * *' THEN 'Every minute'
    WHEN schedule LIKE '*/% * * * *' THEN 'Every ' || SPLIT_PART(schedule, ' ', 1) || ' minutes'
    WHEN schedule LIKE '% % * * *' THEN 'Hourly'
    WHEN schedule LIKE '% % % * *' THEN 'Daily'
    WHEN schedule LIKE '% % % % *' THEN 'Monthly'
    ELSE schedule
  END as schedule_description,
  active,
  CASE 
    WHEN active THEN 'Next run: ~' || 
      CASE 
        WHEN schedule LIKE '% * * * *' THEN '1 minute'
        WHEN schedule LIKE '*/5 * * * *' THEN '5 minutes'
        WHEN schedule LIKE '0 2 * * *' THEN '2 AM UTC daily'
        WHEN schedule LIKE '0 3 * * *' THEN '3 AM UTC daily'
        ELSE 'See schedule'
      END
    ELSE 'Job is inactive'
  END as next_run_info
FROM cron.job
WHERE jobname IN ('cleanup-webhook-logs', 'retry-failed-webhook-logs', 'cleanup-dead-letter-logs')
ORDER BY jobname;

-- Summary status
SELECT 
  COUNT(*) FILTER (WHERE active) as active_jobs,
  COUNT(*) FILTER (WHERE NOT active) as inactive_jobs,
  COUNT(*) as total_jobs,
  CASE 
    WHEN COUNT(*) FILTER (WHERE NOT active) = 0 THEN '✅ PASS: All jobs are active'
    WHEN COUNT(*) FILTER (WHERE NOT active) > 0 THEN '⚠️  WARNING: Some jobs are inactive'
    ELSE '❌ FAIL: No jobs found'
  END as overall_status
FROM cron.job
WHERE jobname IN ('cleanup-webhook-logs', 'retry-failed-webhook-logs', 'cleanup-dead-letter-logs');
