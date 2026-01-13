# QUICK_REFERENCE.md
A 2-minute cheat-sheet for onboarding, debugging and extending Krypto Trac.

---

## 1️⃣ File List by Category

| Category | Files |
|----------|-------|
| **Security & Validation** | `lib/validation/schemas.ts`, `lib/security/rate-limiter.ts`, `lib/errors.ts` |
| **Performance** | `lib/supabase/singleton.ts`, `lib/cache/query-cache.ts`, `app/api/health/route.ts` |
| **Sensory Sync** | `components/GlobalSensorySync.tsx`, `components/SensorySync.tsx`, `components/SovereignGate.tsx`, `components/EdgeRadiance.tsx` |
| **AI Integration** | `lib/vertexAI.ts`, `lib/vertexAI/prompt-optimizer.ts` |
| **API Routes** | `app/api/sensory/trigger/route.ts`, `app/api/panic-button/route.ts`, `app/api/webhooks/stripe/route.ts` |
| **Edge Functions** | `supabase/functions/trigger-sensory-event/index.ts`, `supabase/functions/sentinel-anomaly-detection/index.ts` |
| **Tests** | `tests/unit/*.test.ts`, `tests/integration/*.test.ts`, `tests/e2e/*.spec.ts` |
| **CI** | `.github/workflows/ci.yml` |
| **Docs** | `docs/*.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_OPTIMIZATIONS.md` |
| **Configuration** | `next.config.js`, `package.json`, `vitest.config.ts` |

---

## 2️⃣ Key Metrics Table

| Metric | Target | Measured |
|--------|--------|----------|
| Sensory sync broadcast | ≤ 100ms | **60-80ms** |
| Database queries | ≤ 50ms | **10-30ms** |
| Edge Functions | ≤ 100ms | **50-150ms** |
| Health check | ≤ 500ms | **<200ms** |
| Input validation | < 5ms | **~2ms** |
| Rate limit check | < 1ms | **<1ms** |
| Cache hit rate | ≥ 70% | **Expected 80%** |

---

## 3️⃣ Quick-Start Commands

```bash
# 1️⃣ Clone & enter repo
git clone https://github.com/brandonlacoste9-tech/krypttrac.git
cd krypttrac

# 2️⃣ Install dependencies
npm install

# 3️⃣ Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# 4️⃣ Run development server
npm run dev
# → http://localhost:3000

# 5️⃣ Run tests
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only
npm run test:coverage    # Coverage report

# 6️⃣ Type check
npm run type-check

# 7️⃣ Build for production
npm run build
npm start
```

---

## 4️⃣ Checklists

### 4.1 Security Checklist
- [ ] All API routes use Zod validation (`validateInput()`)
- [ ] Rate limiting enabled on critical endpoints
- [ ] Error sanitization via `createSafeErrorResponse()`
- [ ] CSP headers configured in `next.config.js`
- [ ] Environment variables never committed (`.env.local` in `.gitignore`)
- [ ] Supabase RLS policies enabled
- [ ] Stripe webhook signature verification

### 4.2 Performance Checklist
- [ ] Connection pooling via `getSupabaseClient()`
- [ ] Query caching enabled for frequently accessed data
- [ ] Parallel operations using `Promise.all()`
- [ ] Health check endpoint responding
- [ ] Realtime subscriptions centralized (no duplicates)
- [ ] Edge Functions optimized (minimal payloads)

### 4.3 Deployment Checklist
- [ ] Environment variables configured in hosting platform
- [ ] Stripe webhook endpoint configured
- [ ] Supabase Edge Functions deployed
- [ ] All tests passing (`npm run test`)
- [ ] Type check passing (`npm run type-check`)
- [ ] Build successful (`npm run build`)
- [ ] Health check verified (`/api/health`)

---

## 5️⃣ Common Troubleshooting

| Symptom | Likely Cause | Fix |
|--------|--------------|-----|
| **Sensory sync not working** | User doesn't have Sovereign tier | Check `add_ons` array includes `'sovereign'` |
| **Rate limit errors (429)** | Too many requests | Wait for rate limit window to reset, check `X-RateLimit-Reset` header |
| **Vertex AI returns non-JSON** | Prompt missing JSON guard | Use `optimizePromptForJSON()` from `lib/vertexAI/prompt-optimizer.ts` |
| **Realtime subscription duplicates** | Multiple `HapticProvider` instances | Ensure single `HapticProvider` in root layout |
| **Cache not working** | TTL expired or cache cleared | Check cache TTL, use `cache.invalidate()` to clear |
| **Health check fails** | Database/Realtime/Edge Function down | Check Supabase dashboard, verify Edge Functions deployed |
| **Type errors** | TypeScript strict mode | Run `npm run type-check` to identify issues |

---

## 6️⃣ Extending the Stack

| What you want | Where to edit |
|---------------|---------------|
| **Add new API route** | Create `app/api/[route]/route.ts`, add Zod schema in `lib/validation/schemas.ts`, add rate limit config |
| **Add new sensory event type** | Update `SensoryEventType` in `lib/sensory/sensory-sync.ts`, add to `sensoryEventSchema` |
| **Add new haptic pattern** | Add to `HapticPattern` in `lib/haptics/casino-haptics.ts`, update `HapticEvents` |
| **Add new subscription tier** | Add to `AddOn` type in `lib/subscriptionStore.ts`, update Stripe price IDs |
| **Add new Vertex AI prompt** | Use `createDeterministicPrompt()` from `lib/vertexAI/prompt-optimizer.ts` |
| **Add new Edge Function** | Create `supabase/functions/[name]/index.ts`, deploy via Supabase CLI |
| **Add new test** | Create in `tests/unit/`, `tests/integration/`, or `tests/e2e/` |

---

## 7️⃣ Key Functions Reference

### Input Validation
```typescript
import { validateInput, sensoryEventSchema } from '@/lib/validation/schemas'
const validated = validateInput(sensoryEventSchema, body)
```

### Rate Limiting
```typescript
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limiter'
const limit = checkRateLimit(userId, RATE_LIMITS.SENSORY_EVENT)
if (!limit.allowed) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

### Query Caching
```typescript
import { cache, cacheKeys } from '@/lib/cache/query-cache'
const data = await cache.get(
  cacheKeys.securityScore(userId),
  () => fetchSecurityScore(userId),
  5000 // 5 second TTL
)
```

### Global Radiance
```typescript
import { useRadiance } from '@/components/GlobalSensorySync'
const { state, setState } = useRadiance()
setState('active') // Updates all EdgeRadiance components
```

### Sensory Event Broadcast
```typescript
import { broadcastSensoryEvent } from '@/lib/sensory/sensory-sync'
await broadcastSensoryEvent({
  type: 'WINNING_SLOT',
  userId: user.id,
  metadata: { amount: 1250 },
  timestamp: new Date().toISOString(),
})
```

### Safe Error Response
```typescript
import { createSafeErrorResponse } from '@/lib/errors'
return NextResponse.json(
  createSafeErrorResponse(error, 'checkout', 'PAYMENT_FAILED'),
  { status: 500 }
)
```

---

## 8️⃣ Environment Variables Reference

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Required)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Vertex AI (Optional - fallback to keyword-based)
GOOGLE_CLOUD_API_KEY=your-vertex-ai-key

# App Configuration (Optional)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 9️⃣ Contact & Contribution

* **Repo:** `https://github.com/brandonlacoste9-tech/krypttrac`
* **Issue tracker:** Use GitHub Issues – label with `bug`, `enhancement`, or `performance`
* **Pull requests:** Ensure all tests pass, type-check passes, and documentation updated

**Contributors** are encouraged to:
- Add unit tests for new functions
- Update benchmarks for performance-critical changes
- Follow the existing code style and patterns
- Update documentation for new features

---

### Happy hacking! 🎉

You now have a **single-source of truth** for the entire system, a **quick-start guide** and **checklists** that keep the architecture secure and performant. For deeper dives, see the full documentation in `docs/` and root-level markdown files.
