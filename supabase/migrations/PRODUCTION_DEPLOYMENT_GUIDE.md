# Production Deployment Guide - Webhook Telemetry

## 🚀 Pre-Deployment Checklist

### 1. Database Migrations
- [ ] Run `create_webhook_logs_table.sql` in Supabase SQL Editor
- [ ] Run `create_dead_letter_table.sql` (optional but recommended)
- [ ] Verify all migrations applied successfully

### 2. Edge Function Deployment
```bash
# Deploy webhook telemetry function
supabase functions deploy webhook-telemetry

# Verify function is accessible
curl -X POST https://[project-ref].supabase.co/functions/v1/webhook-telemetry \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","status":"success","duration_ms":100}'
```

### 3. Environment Variables
Ensure these are set in your hosting platform (Vercel/Netlify):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 4. pg_cron Extension
Verify pg_cron is enabled in Supabase:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

If not enabled, enable it in Supabase Dashboard → Database → Extensions

## ✅ Post-Deployment Verification

### Step 1: Run Final Verification Checklist
```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/final_verification_checklist.sql
```

**Expected Results:**
- ✅ All retention functions exist
- ✅ pg_cron jobs scheduled
- ✅ No PII patterns detected
- ✅ Partial index exists and is used
- ✅ RLS policies active

### Step 2: Check pg_cron Status
```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/check_pg_cron_status.sql
```

**Expected Results:**
- ✅ `cleanup-webhook-logs` job is active (runs daily at 2 AM UTC)
- ✅ `retry-failed-webhook-logs` job is active (runs every 5 minutes)
- ✅ `cleanup-dead-letter-logs` job is active (runs daily at 3 AM UTC)

### Step 3: Test Webhook End-to-End

1. **Trigger Test Checkout:**
   ```bash
   # Use Stripe CLI
   stripe trigger checkout.session.completed
   ```

2. **Verify Webhook Processed:**
   - Check webhook returns `200 OK`
   - Check user's `add_ons` updated in Supabase
   - Check `webhook_logs` table has entry

3. **Verify Telemetry:**
   ```sql
   SELECT * FROM webhook_logs 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   
   **Expected:**
   - Entry with `event_type = 'checkout.session.completed'`
   - `status = 'success'`
   - `metadata` contains only safe fields (stripe_event_id, etc.)
   - No PII in metadata

4. **Verify Partial Index Usage:**
   ```sql
   EXPLAIN (ANALYZE, BUFFERS)
   SELECT * FROM webhook_logs
   WHERE created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC
   LIMIT 10;
   ```
   
   **Expected:** Should show "Index Scan using idx_webhook_logs_recent"

### Step 4: Test Non-Blocking Behavior

1. **Simulate Telemetry Failure:**
   ```sql
   -- Temporarily drop table
   DROP TABLE public.webhook_logs;
   ```

2. **Trigger Webhook:**
   ```bash
   stripe trigger checkout.session.completed
   ```

3. **Verify:**
   - ✅ Webhook still returns `200 OK`
   - ✅ User's `add_ons` still updated
   - ✅ Error logged to console (non-blocking)

4. **Restore Table:**
   ```sql
   -- Recreate table
   \i supabase/migrations/create_webhook_logs_table.sql
   ```

## 📊 Monitoring Setup

### Daily Health Checks

Run these queries daily (or set up automated alerts):

```sql
-- Run operational dashboard queries
\i supabase/migrations/operational_dashboard_queries.sql
```

**Key Metrics to Monitor:**
1. **Error Rate** - Should be < 1%
2. **Average Duration** - Should be < 500ms
3. **Daily Volume** - Alert if > 10k/day
4. **Dead-Letter Queue** - Check for stuck retries

### Alert Thresholds

| Metric | Warning | Critical |
|-------|---------|----------|
| Error Rate | > 5% | > 10% |
| Avg Duration | > 1s | > 5s |
| Daily Volume | > 5k | > 10k |
| Dead-Letter Count | > 100 | > 500 |

### Automated Monitoring (Optional)

Set up alerts in your monitoring tool (e.g., Datadog, New Relic) to query:
```sql
-- Error rate check
SELECT 
  COUNT(*) FILTER (WHERE status = 'error') * 100.0 / COUNT(*) as error_rate_pct
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## 🔧 Troubleshooting

### Issue: pg_cron Jobs Not Running

**Check:**
```sql
SELECT * FROM cron.job WHERE jobname = 'cleanup-webhook-logs';
```

**Fix:**
1. Verify pg_cron extension is enabled
2. Check job is active: `UPDATE cron.job SET active = true WHERE jobname = 'cleanup-webhook-logs';`
3. Manually trigger: `SELECT cron.schedule('cleanup-webhook-logs', '0 2 * * *', 'SELECT public.cleanup_old_webhook_logs()');`

### Issue: Dead-Letter Queue Growing

**Check:**
```sql
SELECT COUNT(*), status FROM dead_letter_webhook_logs GROUP BY status;
```

**Fix:**
1. Manually retry: `SELECT * FROM public.retry_failed_webhook_logs();`
2. Check for database connection issues
3. Review failure reasons: `SELECT failure_reason, COUNT(*) FROM dead_letter_webhook_logs GROUP BY failure_reason;`

### Issue: Partial Index Not Used

**Check:**
```sql
EXPLAIN SELECT * FROM webhook_logs WHERE created_at > NOW() - INTERVAL '7 days';
```

**Fix:**
1. Verify index exists: `SELECT * FROM pg_indexes WHERE indexname = 'idx_webhook_logs_recent';`
2. Recreate if needed: `DROP INDEX idx_webhook_logs_recent; CREATE INDEX idx_webhook_logs_recent ON webhook_logs(created_at DESC) WHERE created_at > NOW() - INTERVAL '14 days';`

## 📝 Maintenance Tasks

### Weekly
- Review error rates and slow queries
- Check dead-letter queue size
- Verify retention policy is working

### Monthly
- Review PII hygiene (run `verify_pii_hygiene.sql`)
- Check index usage statistics
- Review and optimize slow queries

### Quarterly
- Review retention period (currently 60 days)
- Adjust alert thresholds if needed
- Review and update operational queries

## 🎯 Success Criteria

Your deployment is successful when:

1. ✅ All verification checks pass
2. ✅ pg_cron jobs are scheduled and running
3. ✅ Test webhook creates log entry with sanitized metadata
4. ✅ Partial index is used for recent queries
5. ✅ Telemetry failures don't block webhook processing
6. ✅ Retention policy deletes logs > 60 days old
7. ✅ Dead-letter queue retries failed logs successfully

## 📚 Reference Files

- `final_verification_checklist.sql` - Complete verification script
- `operational_dashboard_queries.sql` - Monitoring queries
- `check_pg_cron_status.sql` - Cron job status checks
- `verify_pii_hygiene.sql` - PII verification
- `test_non_blocking_telemetry.md` - Non-blocking test guide
- `create_dead_letter_table.sql` - Dead-letter queue setup

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-XX  
**Maintained By**: Krypto Trac Team
