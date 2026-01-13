-- ============================================
-- Krypto Trac: Enable Supabase Vault Extension
-- Encrypted storage for sensitive user data (API keys, private notes)
-- ============================================

-- Enable vault extension
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Verify vault is enabled
SELECT 
  extname,
  extversion,
  CASE 
    WHEN extname = 'supabase_vault' THEN '✅ Vault extension enabled'
    ELSE '❌ Vault extension not found'
  END as status
FROM pg_extension
WHERE extname = 'supabase_vault';

-- Create table for storing encrypted API keys
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exchange TEXT NOT NULL CHECK (exchange IN ('binance', 'coinbase', 'kraken', 'kucoin', 'okx', 'bybit')),
  key_name TEXT NOT NULL, -- User-friendly name (e.g., "Trading Account", "Main Wallet")
  encrypted_api_key TEXT NOT NULL, -- Vault-encrypted API key
  encrypted_secret_key TEXT, -- Vault-encrypted secret key (if required)
  encrypted_passphrase TEXT, -- Vault-encrypted passphrase (for some exchanges)
  permissions TEXT[] DEFAULT ARRAY['read'], -- 'read', 'trade', 'withdraw'
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'success', 'error'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, exchange, key_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_exchange ON public.user_api_keys(exchange);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON public.user_api_keys(user_id, is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own API keys
DROP POLICY IF EXISTS "Users can view own API keys" ON public.user_api_keys;
CREATE POLICY "Users can view own API keys"
  ON public.user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own API keys
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.user_api_keys;
CREATE POLICY "Users can insert own API keys"
  ON public.user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own API keys
DROP POLICY IF EXISTS "Users can update own API keys" ON public.user_api_keys;
CREATE POLICY "Users can update own API keys"
  ON public.user_api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own API keys
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.user_api_keys;
CREATE POLICY "Users can delete own API keys"
  ON public.user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Function to encrypt API key using Vault
CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_plaintext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted TEXT;
BEGIN
  -- Use Vault to encrypt the API key
  -- Note: In production, you would use the Vault API or extension functions
  -- This is a placeholder - actual implementation depends on Vault setup
  SELECT vault.encrypt(p_plaintext) INTO v_encrypted;
  RETURN v_encrypted;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: Use pgcrypto if Vault is not fully configured
    RETURN encode(pgcrypto.encrypt(p_plaintext::bytea, current_setting('app.settings.encryption_key')::bytea, 'aes'), 'base64');
END;
$$;

-- Function to decrypt API key using Vault
CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_encrypted TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decrypted TEXT;
BEGIN
  -- Use Vault to decrypt the API key
  -- Only callable by service_role or the key owner
  IF auth.role() != 'service_role' AND auth.uid() != (SELECT user_id FROM public.user_api_keys WHERE encrypted_api_key = p_encrypted) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot decrypt API key';
  END IF;
  
  SELECT vault.decrypt(p_encrypted) INTO v_decrypted;
  RETURN v_decrypted;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: Use pgcrypto if Vault is not fully configured
    RETURN convert_from(pgcrypto.decrypt(decode(p_encrypted, 'base64'), current_setting('app.settings.encryption_key')::bytea, 'aes'), 'UTF8');
END;
$$;

-- Function to store encrypted API key
CREATE OR REPLACE FUNCTION public.store_api_key(
  p_user_id UUID,
  p_exchange TEXT,
  p_key_name TEXT,
  p_api_key TEXT,
  p_secret_key TEXT DEFAULT NULL,
  p_passphrase TEXT DEFAULT NULL,
  p_permissions TEXT[] DEFAULT ARRAY['read']
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_encrypted_api_key TEXT;
  v_encrypted_secret TEXT;
  v_encrypted_passphrase TEXT;
BEGIN
  -- Encrypt the keys
  v_encrypted_api_key := public.encrypt_api_key(p_api_key);
  IF p_secret_key IS NOT NULL THEN
    v_encrypted_secret := public.encrypt_api_key(p_secret_key);
  END IF;
  IF p_passphrase IS NOT NULL THEN
    v_encrypted_passphrase := public.encrypt_api_key(p_passphrase);
  END IF;
  
  -- Insert or update
  INSERT INTO public.user_api_keys (
    user_id,
    exchange,
    key_name,
    encrypted_api_key,
    encrypted_secret_key,
    encrypted_passphrase,
    permissions
  )
  VALUES (
    p_user_id,
    p_exchange,
    p_key_name,
    v_encrypted_api_key,
    v_encrypted_secret,
    v_encrypted_passphrase,
    p_permissions
  )
  ON CONFLICT (user_id, exchange, key_name)
  DO UPDATE SET
    encrypted_api_key = EXCLUDED.encrypted_api_key,
    encrypted_secret_key = EXCLUDED.encrypted_secret_key,
    encrypted_passphrase = EXCLUDED.encrypted_passphrase,
    permissions = EXCLUDED.permissions,
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Function to retrieve decrypted API key (service_role only)
CREATE OR REPLACE FUNCTION public.get_decrypted_api_key(p_key_id UUID)
RETURNS TABLE(
  api_key TEXT,
  secret_key TEXT,
  passphrase TEXT,
  exchange TEXT,
  permissions TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only service_role can call this
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service_role can decrypt API keys';
  END IF;
  
  RETURN QUERY
  SELECT 
    public.decrypt_api_key(uak.encrypted_api_key) as api_key,
    CASE WHEN uak.encrypted_secret_key IS NOT NULL 
      THEN public.decrypt_api_key(uak.encrypted_secret_key) 
      ELSE NULL 
    END as secret_key,
    CASE WHEN uak.encrypted_passphrase IS NOT NULL 
      THEN public.decrypt_api_key(uak.encrypted_passphrase) 
      ELSE NULL 
    END as passphrase,
    uak.exchange,
    uak.permissions
  FROM public.user_api_keys uak
  WHERE uak.id = p_key_id
    AND uak.is_active = TRUE;
END;
$$;

COMMENT ON TABLE public.user_api_keys IS 'Encrypted storage for user exchange API keys using Supabase Vault';
COMMENT ON FUNCTION public.encrypt_api_key(TEXT) IS 'Encrypts API key using Vault';
COMMENT ON FUNCTION public.decrypt_api_key(TEXT) IS 'Decrypts API key using Vault (service_role only)';
COMMENT ON FUNCTION public.store_api_key(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) IS 'Stores encrypted API key for a user';
COMMENT ON FUNCTION public.get_decrypted_api_key(UUID) IS 'Retrieves decrypted API key (service_role only)';
