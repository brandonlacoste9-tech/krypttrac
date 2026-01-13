# Testing Non-Blocking Telemetry

## Purpose
Verify that webhook processing continues even if telemetry fails.

## Test Steps

### 1. Simulate Telemetry Failure
Temporarily break the telemetry Edge Function or database connection:

```sql
-- Option A: Drop the webhook_logs table temporarily
DROP TABLE IF EXISTS public.webhook_logs;

-- Option B: Revoke INSERT permissions
REVOKE INSERT ON public.webhook_logs FROM service_role;
```

### 2. Trigger Test Webhook
Use Stripe CLI or webhook testing tool:

```bash
stripe trigger checkout.session.completed
```

### 3. Verify Webhook Still Returns 2xx
- Check webhook response: Should return `200 OK` with `{"received": true}`
- Check Supabase: User's `add_ons` should still be updated correctly
- Check logs: Telemetry errors should be logged but not block processing

### 4. Restore Telemetry
```sql
-- Restore permissions
GRANT INSERT ON public.webhook_logs TO service_role;

-- Or recreate table
-- Run: supabase/migrations/create_webhook_logs_table.sql
```

## Expected Behavior
✅ Webhook processes successfully (2xx response)  
✅ User add_ons updated in Supabase  
✅ Telemetry errors logged but don't block  
✅ No user-facing errors

## Verification Query
```sql
-- Check that webhook processed despite telemetry failure
SELECT 
  COUNT(*) as webhook_count,
  MAX(created_at) as last_webhook
FROM public.webhook_logs
WHERE event_type = 'checkout.session.completed';
```
