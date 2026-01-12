-- Fort Knox Security Database Schema
-- Run this migration in Supabase SQL Editor

-- 1. Store Public Keys for Ed25519 Verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_key TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_public_key ON profiles(public_key);

-- 2. Social Recovery Guardians Table
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_public_key TEXT NOT NULL,
  guardian_address TEXT, -- Optional: wallet address for external guardians
  nickname TEXT, -- User-friendly name (e.g., "My Phone", "Friend's Device")
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, guardian_user_id) -- One guardian relationship per pair
);

CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_guardians_status ON guardians(status);

-- 3. Recovery Requests (The Audit Trail)
CREATE TABLE IF NOT EXISTS recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  new_public_key TEXT NOT NULL,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'approved', 'completed', 'cancelled', 'expired')),
  threshold_met BOOLEAN DEFAULT false,
  required_signatures INTEGER DEFAULT 2, -- 2-of-3 threshold
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'), -- 7 day expiration
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recovery_requests_user_id ON recovery_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_requests_status ON recovery_requests(status);

-- 4. Recovery Signatures (Guardian Approvals)
CREATE TABLE IF NOT EXISTS recovery_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_request_id UUID REFERENCES recovery_requests(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
  signature TEXT NOT NULL, -- Ed25519 signature of the recovery request
  signed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recovery_request_id, guardian_id) -- One signature per guardian per request
);

CREATE INDEX IF NOT EXISTS idx_recovery_signatures_request_id ON recovery_signatures(recovery_request_id);
CREATE INDEX IF NOT EXISTS idx_recovery_signatures_guardian_id ON recovery_signatures(guardian_id);

-- 5. Security Audit Log (Optional but recommended)
CREATE TABLE IF NOT EXISTS security_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_hash TEXT,
  contract_address TEXT,
  security_status TEXT CHECK (security_status IN ('SAFE', 'WARNING', 'BLOCK')),
  confidence_score INTEGER, -- 0-100
  risks TEXT[], -- Array of detected risks
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audits_user_id ON security_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audits_status ON security_audits(security_status);
CREATE INDEX IF NOT EXISTS idx_security_audits_created_at ON security_audits(created_at DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Guardians
DROP POLICY IF EXISTS "Users can view their own guardians" ON guardians;
CREATE POLICY "Users can view their own guardians" 
ON guardians FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = guardian_user_id);

DROP POLICY IF EXISTS "Users can insert their own guardians" ON guardians;
CREATE POLICY "Users can insert their own guardians" 
ON guardians FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own guardians" ON guardians;
CREATE POLICY "Users can update their own guardians" 
ON guardians FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own guardians" ON guardians;
CREATE POLICY "Users can delete their own guardians" 
ON guardians FOR DELETE 
USING (auth.uid() = user_id);

-- 8. RLS Policies for Recovery Requests
DROP POLICY IF EXISTS "Users can view their recovery requests" ON recovery_requests;
CREATE POLICY "Users can view their recovery requests" 
ON recovery_requests FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Guardians can view recovery requests" ON recovery_requests;
CREATE POLICY "Guardians can view recovery requests" 
ON recovery_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM guardians 
    WHERE guardians.user_id = recovery_requests.user_id 
    AND guardians.guardian_user_id = auth.uid()
    AND guardians.status = 'active'
  )
);

DROP POLICY IF EXISTS "Users can create recovery requests" ON recovery_requests;
CREATE POLICY "Users can create recovery requests" 
ON recovery_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can update recovery requests" ON recovery_requests;
CREATE POLICY "Service role can update recovery requests" 
ON recovery_requests FOR ALL 
USING (auth.role() = 'service_role');

-- 9. RLS Policies for Recovery Signatures
DROP POLICY IF EXISTS "Guardians can sign recovery requests" ON recovery_signatures;
CREATE POLICY "Guardians can sign recovery requests" 
ON recovery_signatures FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recovery_requests
    JOIN guardians ON guardians.user_id = recovery_requests.user_id
    WHERE recovery_requests.id = recovery_signatures.recovery_request_id
    AND guardians.id = recovery_signatures.guardian_id
    AND guardians.guardian_user_id = auth.uid()
    AND guardians.status = 'active'
    AND recovery_requests.status IN ('initiated', 'pending')
  )
);

DROP POLICY IF EXISTS "Users can view recovery signatures" ON recovery_signatures;
CREATE POLICY "Users can view recovery signatures" 
ON recovery_signatures FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM recovery_requests
    WHERE recovery_requests.id = recovery_signatures.recovery_request_id
    AND recovery_requests.user_id = auth.uid()
  )
);

-- 10. RLS Policies for Security Audits
DROP POLICY IF EXISTS "Users can view their security audits" ON security_audits;
CREATE POLICY "Users can view their security audits" 
ON security_audits FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert security audits" ON security_audits;
CREATE POLICY "Service role can insert security audits" 
ON security_audits FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 11. Function to check if recovery threshold is met
CREATE OR REPLACE FUNCTION check_recovery_threshold(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  required_count INTEGER;
  signature_count INTEGER;
BEGIN
  SELECT required_signatures INTO required_count
  FROM recovery_requests
  WHERE id = request_id;
  
  SELECT COUNT(*) INTO signature_count
  FROM recovery_signatures
  WHERE recovery_request_id = request_id;
  
  RETURN signature_count >= required_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function to update recovery request status
CREATE OR REPLACE FUNCTION update_recovery_status(request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE recovery_requests
  SET 
    threshold_met = check_recovery_threshold(request_id),
    status = CASE 
      WHEN check_recovery_threshold(request_id) THEN 'approved'
      ELSE status
    END
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger to update recovery status when signature is added
CREATE OR REPLACE FUNCTION trigger_update_recovery_status()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_recovery_status(NEW.recovery_request_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_recovery_signature_added ON recovery_signatures;
CREATE TRIGGER on_recovery_signature_added
AFTER INSERT ON recovery_signatures
FOR EACH ROW
EXECUTE FUNCTION trigger_update_recovery_status();

-- 14. Comment on tables
COMMENT ON TABLE guardians IS 'Social Recovery Guardians - Users who can help recover accounts';
COMMENT ON TABLE recovery_requests IS 'Account Recovery Requests - Tracks recovery process';
COMMENT ON TABLE recovery_signatures IS 'Guardian Signatures - Guardian approvals for recovery';
COMMENT ON TABLE security_audits IS 'Security Audit Log - Records all security scans';
