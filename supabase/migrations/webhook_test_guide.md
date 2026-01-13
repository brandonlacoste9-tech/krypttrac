# Stripe Webhook Testing Guide

## Prerequisites
- Stripe test mode enabled
- Webhook endpoint configured: `https://your-domain.com/api/webhooks/stripe`
- Webhook secret set in environment variables

## Test Flow

### 1. Create Test Checkout Session
Use Stripe CLI or Dashboard to create a test checkout:

```bash
stripe checkout sessions create \
  --success-url "https://your-domain.com/dashboard?success=true&feature=defi" \
  --cancel-url "https://your-domain.com/dashboard?canceled=true" \
  --mode subscription \
  --line-items[0][price]=price_1SosoSCzqBvMqSYF14JyKIhx \
  --line-items[0][quantity]=1 \
  --metadata[userId]=USER_UUID_HERE \
  --metadata[feature]=defi
```

### 2. Complete Checkout
- Use Stripe test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### 3. Verify Webhook Received
Check Supabase logs:
```sql
-- Check if webhook was received (if you log to a table)
SELECT * FROM stripe_webhook_events 
ORDER BY created_at DESC 
LIMIT 10;
```

### 4. Verify Profile Updated
```sql
-- Check user's add_ons array
SELECT user_id, add_ons, updated_at
FROM public.profiles
WHERE user_id = 'USER_UUID_HERE';
```

Expected result: `add_ons` should contain `['defi']`

### 5. Test Subscription Cancellation
Cancel the subscription in Stripe Dashboard, then verify:
```sql
SELECT user_id, add_ons
FROM public.profiles
WHERE user_id = 'USER_UUID_HERE';
```

Expected result: `add_ons` should no longer contain `'defi'`

## Monitoring

### Check Supabase Logs
1. Go to Supabase Dashboard → Logs
2. Filter by: `api` or `postgres`
3. Look for errors related to:
   - `add_user_addon` function calls
   - `profiles` table updates
   - Foreign key violations

### Common Issues

**Issue**: Webhook not received
- Check webhook URL is correct
- Verify webhook secret matches
- Check Stripe Dashboard → Webhooks for delivery status

**Issue**: Function permission denied
- Verify service role key is used in webhook handler
- Check function grants: `GRANT EXECUTE ON FUNCTION ... TO service_role`

**Issue**: Invalid add-on name
- Check CHECK constraint: `profiles_add_ons_allowed`
- Verify metadata.feature matches: 'core', 'defi', 'whale', 'magnum'

**Issue**: Profile not found
- Verify `user_id` in Stripe metadata matches `auth.users.id`
- Check if profile exists: `SELECT * FROM profiles WHERE user_id = '...'`
