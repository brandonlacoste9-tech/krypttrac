# Sentinel Security System Guide - Krypto Trac

## 🛡️ Overview

The Vertex AI Sentinel is a proactive security system that detects threats in real-time and automatically locks accounts when "smell of danger" is detected. It goes beyond standard security to provide total architectural lockdown.

## 🎯 Security Features

### 1. **Vertex AI Anomaly Detection** 🔍

**What it does:**
- Analyzes user behavior patterns in real-time
- Detects behavioral signatures of theft
- Flags anomalies: massive withdrawals, new mixer addresses, IP changes
- Confidence scoring (0-100) for each threat

**Threat Types Detected:**
- Massive withdrawal anomalies (10x user average)
- New mixer/tumbler addresses
- IP address anomalies
- Session hijack attempts
- API key compromise patterns
- Vault breach attempts

### 2. **Automatic Lockdown** 🔒

**Trigger Conditions:**
- Critical security event detected
- AI confidence ≥ 85%
- Behavioral signature matches known attack patterns

**Lockdown Actions:**
- ✅ Clear Supabase Vault cache
- ✅ Revoke all active sessions (aal2)
- ✅ Deactivate all API keys
- ✅ Block all withdrawals
- ✅ Set `profiles.is_locked = true`

### 3. **Panic Button** 🚨

**Visual Design:**
- Magnum Gold embossed button
- Red pulsing core
- Haptic feedback on activation
- "Total Defense" branding

**Execution:**
- User-initiated total lockdown
- Immediate vault clearing
- All sessions revoked
- Requires hardware key recovery

### 4. **Recovery Mechanisms** 🔓

| Threat | Recovery Method | Cooldown |
|--------|----------------|----------|
| **IP Anomaly** | Email verification | None |
| **Unauthorized Access** | MFA re-authentication | None |
| **AI Threat (Critical)** | Hardware key + 24h cooldown | 24 hours |
| **Panic Button** | Hardware key + Support review | Manual |

## 🛠️ Setup Instructions

### Step 1: Create Security Tables

```sql
\i supabase/migrations/create_security_events_table.sql
\i supabase/migrations/integrate_sentinel_monitoring.sql
```

### Step 2: Deploy Edge Functions

```bash
supabase functions deploy sentinel-anomaly-detection
supabase functions deploy panic-button
```

### Step 3: Configure MCP (Optional)

In Cursor Settings:
1. Go to `Settings > Features > MCP Servers`
2. Add: `https://mcp.supabase.com/mcp`
3. This enables AI-assisted security policy management

### Step 4: Test Sentinel

```sql
-- Test anomaly detection
INSERT INTO transactions (user_id, coin_id, symbol, transaction_type, amount, price_usd, total_value_usd)
VALUES ('user-uuid', 'bitcoin', 'BTC', 'sell', 100, 50000, 5000000); -- Large transaction

-- Check if security event was created
SELECT * FROM security_events WHERE user_id = 'user-uuid' ORDER BY detected_at DESC;
```

## 📱 Frontend Integration

### Panic Button Component

```typescript
import PanicButton from '@/components/PanicButton'

function SecurityDashboard() {
  return (
    <div>
      <h2>Security Controls</h2>
      <PanicButton 
        onLockdown={() => {
          // Redirect to locked view
          router.push('/locked')
        }}
      />
    </div>
  )
}
```

### Security Monitoring

```typescript
import { 
  getSecurityEvents, 
  subscribeToSecurityAlerts,
  getLockdownStatus 
} from '@/lib/security/sentinel-client'

function SecurityMonitor() {
  const [events, setEvents] = useState([])
  const [lockdown, setLockdown] = useState(null)
  
  useEffect(() => {
    // Load security events
    getSecurityEvents(userId).then(setEvents)
    
    // Check lockdown status
    getLockdownStatus(userId).then(setLockdown)
    
    // Subscribe to alerts
    const channel = subscribeToSecurityAlerts(userId, (alert) => {
      if (alert.severity === 'critical') {
        // Show critical alert
        showCriticalAlert(alert.message)
        
        // Redirect to locked view
        router.push('/locked')
      }
    })
    
    return () => channel.unsubscribe()
  }, [])
  
  return (
    <div>
      <SecurityEventsList events={events} />
      {lockdown?.is_locked && <LockdownBanner status={lockdown} />}
    </div>
  )
}
```

## 🔐 Lockdown Logic

### Automatic Lockdown Flow

1. **Threat Detected** → Vertex AI analyzes activity
2. **Critical Event** → Security event logged with `severity = 'critical'`
3. **Database Trigger** → `trigger_security_lockdown()` fires
4. **Account Locked** → `lock_account()` function called
5. **Sessions Revoked** → All active sessions terminated
6. **Vault Cleared** → All encrypted secrets cleared
7. **API Keys Revoked** → All exchange API keys deactivated
8. **Realtime Broadcast** → UI updated to locked state

### Recovery Flow

1. **User Initiates Recovery** → Provides unlock code
2. **Verify Code** → `unlock_account()` validates code
3. **Hardware Key Auth** → User authenticates with hardware key
4. **Account Unlocked** → `is_locked = false`
5. **Sessions Restored** → User must re-authenticate
6. **Vault Restored** → User must re-enter API keys

## 📊 Security Analytics

### Threat Detection Rate

```sql
SELECT 
  event_type,
  COUNT(*) as event_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  AVG(ai_confidence) as avg_confidence
FROM security_events
WHERE detected_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY critical_count DESC;
```

### Lockdown Statistics

```sql
SELECT 
  locked_by,
  COUNT(*) as lock_count,
  AVG(EXTRACT(EPOCH FROM (recovery_completed_at - locked_at)) / 3600) as avg_lockdown_hours
FROM security_lockdown
WHERE recovery_completed_at IS NOT NULL
GROUP BY locked_by;
```

## 🚨 Threat Response Matrix

| Threat | Severity | Action | Recovery |
|--------|----------|--------|----------|
| **IP Anomaly** | Medium | Block IP, notify user | Email verification |
| **Massive Withdrawal** | High | Flag transaction, require MFA | MFA re-auth |
| **Session Hijack** | Critical | **Total Lockdown** | Hardware key + 24h |
| **AI Threat Detected** | Critical | **Total Lockdown** | Hardware key + 24h |
| **Panic Button** | Critical | **Total Lockdown** | Hardware key + Support |

## 🔒 Security Best Practices

1. **Monitor Regularly**: Check security events dashboard daily
2. **Test Panic Button**: Ensure users know how to activate
3. **Review Lockdowns**: Audit all lockdown events weekly
4. **Update AI Model**: Retrain Sentinel on new attack patterns
5. **Hardware Keys**: Require hardware keys for high-value accounts

## 📚 Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/mcp)
- [Vertex AI Anomaly Detection](https://cloud.google.com/vertex-ai/docs)
- [PostgreSQL Event Triggers](https://www.postgresql.org/docs/current/event-triggers.html)

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-XX  
**Maintained By**: Krypto Trac Team
