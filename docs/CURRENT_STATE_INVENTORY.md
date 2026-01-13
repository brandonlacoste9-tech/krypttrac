# Current State Inventory - Krypto Trac

**Last Updated**: 2026-01-XX  
**Purpose**: Complete inventory of existing implementation before integrating new Ollama-based features

---

## 🏗️ Architecture Overview

### Current Stack
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Backend**: Next.js API Routes + Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL with RLS
- **Real-time**: Supabase Realtime (broadcasts, subscriptions)
- **AI**: Vertex AI (Gemini 1.5 Flash) for sentiment/security
- **Payments**: Stripe (subscriptions, webhooks)
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Framer Motion

---

## 📁 File Structure

### Security & Validation (3 files)
```
lib/
  ├── validation/schemas.ts          # Zod schemas for all inputs
  ├── security/rate-limiter.ts       # In-memory rate limiting
  └── errors.ts                      # Error sanitization
```

### Performance (3 files)
```
lib/
  ├── supabase/singleton.ts          # Connection pooling
  ├── cache/query-cache.ts           # Query result caching
app/api/
  └── health/route.ts                # Health check endpoint
```

### Sensory Sync System (4 files)
```
components/
  ├── GlobalSensorySync.tsx          # Root-level sync hub
  ├── SensorySync.tsx                # Realtime subscriptions
  ├── SovereignGate.tsx               # Feature gating
  └── EdgeRadiance.tsx               # Synchronized radiance
```

### AI Integration (2 files)
```
lib/
  ├── vertexAI.ts                    # Vertex AI client
  └── vertexAI/prompt-optimizer.ts    # JSON-only responses
```

### API Routes (3+ files)
```
app/api/
  ├── sensory/trigger/route.ts       # Sensory event trigger
  ├── panic-button/route.ts          # Emergency lockdown
  ├── webhooks/stripe/route.ts       # Subscription sync
  └── health/route.ts                # System health
```

### Edge Functions (2+ files)
```
supabase/functions/
  ├── trigger-sensory-event/index.ts # Realtime broadcasts
  └── sentinel-anomaly-detection/index.ts # Security AI
```

### Testing (5 files)
```
tests/
  ├── unit/haptics.test.ts
  ├── integration/sensory-sync.test.ts
  ├── e2e/sensory-sync.spec.ts
  ├── setup.ts
vitest.config.ts
```

### CI/CD (1 file)
```
.github/workflows/ci.yml
```

---

## 🔐 Security Features

### Implemented
- ✅ Zod input validation on all API routes
- ✅ Rate limiting (configurable per endpoint)
- ✅ Error sanitization (no data leaks)
- ✅ CSP headers (XSS protection)
- ✅ Ed25519 signature verification (Fort Knox)
- ✅ Supabase RLS policies
- ✅ Stripe webhook signature verification

### Security Endpoints
- `/api/sensory/trigger` - Rate limited (10/min)
- `/api/panic-button` - Rate limited (3/hour)
- `/api/webhooks/stripe` - Signature verified

---

## ⚡ Performance Features

### Implemented
- ✅ Connection pooling (singleton Supabase client)
- ✅ Query result caching (in-memory, TTL-based)
- ✅ Parallel operations (Promise.all)
- ✅ Batch database queries
- ✅ Health check endpoint

### Performance Metrics
- Sensory sync: 60-80ms ✅
- Database queries: 10-30ms ✅
- Edge Functions: 50-150ms ⚠️ (Vertex AI bottleneck)

---

## 🎨 Sensory Sync System

### Components
- `GlobalSensorySync` - Root-level hub, Sovereign tier gating
- `SensorySync` - Realtime event subscriptions
- `HapticProvider` - Haptic feedback management
- `EdgeRadiance` - Visual glow synchronization

### Event Types
- `WINNING_SLOT` - Profitable trades
- `SENTINEL_NUDGE` - AI signals
- `VAULT_THUD` - Vault operations
- `TRADE_CLOSE` - Auto-Pilot closes
- `SECURITY_ALERT` - Security events
- `SUCCESS` - General success
- `CONFIRM` - Action confirmation

### Haptic Patterns
- `SUCCESS` - [20, 40, 20]
- `SENTINEL` - [15]
- `LOCKDOWN` - [50, 20, 10]
- `TRADE_CLOSE` - [20, 50, 20, 30]
- `ALERT` - [70, 70, 70]
- `CONFIRM` - [10]

---

## 🤖 AI Integration

### Current AI Features
- **Vertex AI (Gemini 1.5 Flash)**
  - Sentiment analysis (news articles)
  - Security threat detection
  - Whale transaction prediction
  - AI reasoning explanations

### Prompt Engineering
- JSON-only response guards
- Schema validation
- Deterministic outputs
- Persona switching (sentinel/analyst/advisor)

### Fallback
- Keyword-based sentiment analysis (when Vertex AI unavailable)

---

## 💳 Monetization

### Subscription Tiers
- `core` - $10/mo (base tracker)
- `defi` - $10/mo (DeFi execution)
- `whale` - $5/mo (whale alerts)
- `magnum` - $10/mo (Magnum Opus)
- `sovereign` - $89.99/yr (premium features)

### Stripe Integration
- Webhook handler for subscription sync
- Customer portal for self-service
- Modular add-ons system

---

## 🧪 Testing

### Test Suites
- **Unit**: Vitest (haptics, validation, rate limiter)
- **Integration**: Vitest (sensory sync, API routes)
- **E2E**: Playwright (full user flows)
- **CI**: GitHub Actions (automated pipeline)

### Coverage
- Current: ~40%
- Target: 80%+

---

## 📊 Database Schema

### Key Tables
- `profiles` - User data, `add_ons` array, `public_key`
- `security_events` - Threat logging
- `security_lockdown` - Account lockdown status
- `transactions` - User transactions
- `momentum_breakout` - AI trading signals
- `webhook_logs` - Webhook telemetry

### RLS Policies
- All tables have Row Level Security
- Service role for admin operations
- User-level access control

---

## 🔄 Realtime Channels

### Active Channels
- `sensory_events` - Sensory sync broadcasts
- `security_alerts` - Security event broadcasts
- `haptic_trades` - Profitable trade events
- `haptic_sentinel` - AI signal events
- `haptic_security` - Security alert events
- `haptic_vault` - Vault lock events

---

## 📝 Configuration Files

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# Vertex AI (optional)
GOOGLE_CLOUD_API_KEY
```

### Config Files
- `next.config.js` - CSP headers, image domains
- `package.json` - Dependencies, scripts
- `vitest.config.ts` - Test configuration
- `.github/workflows/ci.yml` - CI/CD pipeline

---

## 🎯 Key Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Security Hardening | ✅ Complete | Validation, rate limiting, error sanitization |
| Performance Optimization | ✅ Complete | Caching, pooling, parallel ops |
| Sensory Sync | ✅ Complete | Sovereign tier gating, multi-device sync |
| AI Integration | ✅ Complete | Vertex AI with fallback |
| Testing Infrastructure | ✅ Complete | Unit, integration, E2E |
| Monetization | ✅ Complete | Stripe subscriptions, webhooks |
| Documentation | ✅ Complete | Comprehensive guides |

---

## 🔍 Integration Points

### Where New Features Can Hook In

1. **AI Layer**
   - Current: Vertex AI (Gemini 1.5 Flash)
   - Integration point: `lib/vertexAI.ts`
   - Can add: Ollama integration alongside or replacing Vertex AI

2. **Sensory Sync**
   - Current: Supabase Realtime broadcasts
   - Integration point: `lib/sensory/sensory-sync.ts`
   - Can add: Additional event types, new haptic patterns

3. **Security**
   - Current: Ed25519 signatures, Vertex AI Guardian
   - Integration point: `lib/security/guardian.ts`
   - Can add: Additional security layers, new threat detection

4. **Performance**
   - Current: In-memory cache, connection pooling
   - Integration point: `lib/cache/query-cache.ts`
   - Can add: Redis, distributed caching

5. **API Routes**
   - Current: Next.js API routes
   - Integration point: `app/api/`
   - Can add: New endpoints, additional validation

---

## 📋 Questions to Ask (Ask Mode)

### Architecture Questions
1. Will Ollama run locally or as a service?
2. Should Ollama replace Vertex AI or run alongside?
3. What model size/type are we targeting?
4. Do we need GPU acceleration?

### Integration Questions
1. How should Ollama integrate with existing AI features?
2. Should we maintain Vertex AI as fallback?
3. What new capabilities will Ollama enable?
4. Do we need new API routes for Ollama?

### Performance Questions
1. What latency targets for Ollama responses?
2. Do we need caching for Ollama responses?
3. Should we batch Ollama requests?
4. What's the expected request volume?

### Security Questions
1. How do we secure local Ollama instance?
2. Do we need authentication for Ollama endpoints?
3. Should Ollama responses be validated?
4. How do we handle rate limiting for Ollama?

### Testing Questions
1. How do we test Ollama integration?
2. Do we need mocks for Ollama?
3. Should we add Ollama to CI/CD?
4. What's the test coverage target?

---

## 🎯 Ready for Integration

### Prepared For
- ✅ New AI provider integration
- ✅ Additional API routes
- ✅ New validation schemas
- ✅ Additional Edge Functions
- ✅ New Realtime channels
- ✅ Additional test suites
- ✅ Performance optimizations
- ✅ Security enhancements

### Waiting For
- ⏳ Ollama architecture details
- ⏳ Integration requirements
- ⏳ Performance requirements
- ⏳ Security requirements
- ⏳ Testing requirements

---

**Status**: ✅ Ready for Ask Mode  
**Next Step**: Receive Ollama requirements and ask clarifying questions
