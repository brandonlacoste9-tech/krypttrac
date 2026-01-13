-- ============================================
-- Krypto Trac: Storage Buckets for CDN Caching
-- Caches IPFS/NFT images and project logos for fast loading
-- ============================================

-- Note: Storage buckets are typically created via Supabase Dashboard or API
-- This SQL file documents the bucket structure and policies

-- Bucket: nft-cache
-- Purpose: Cache NFT images from IPFS
-- Public: Yes (served via CDN)
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- Bucket: token-logos
-- Purpose: Cache token/coin logos
-- Public: Yes (served via CDN)
-- File size limit: 2MB
-- Allowed MIME types: image/png, image/jpeg, image/svg+xml

-- Bucket: project-assets
-- Purpose: Cache project metadata and assets
-- Public: Yes (served via CDN)
-- File size limit: 5MB
-- Allowed MIME types: image/*, application/json

-- Table to track cached assets
CREATE TABLE IF NOT EXISTS public.cached_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('nft', 'token_logo', 'project_asset')),
  source_url TEXT NOT NULL, -- Original IPFS/HTTP URL
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  bucket_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  ipfs_hash TEXT, -- IPFS CID if applicable
  metadata JSONB DEFAULT '{}',
  cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  UNIQUE(source_url, asset_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cached_assets_source_url ON public.cached_assets(source_url);
CREATE INDEX IF NOT EXISTS idx_cached_assets_storage_path ON public.cached_assets(storage_path);
CREATE INDEX IF NOT EXISTS idx_cached_assets_ipfs_hash ON public.cached_assets(ipfs_hash);
CREATE INDEX IF NOT EXISTS idx_cached_assets_asset_type ON public.cached_assets(asset_type);

-- Enable RLS
ALTER TABLE public.cached_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read cached assets (public CDN)
DROP POLICY IF EXISTS "Cached assets are publicly readable" ON public.cached_assets;
CREATE POLICY "Cached assets are publicly readable"
  ON public.cached_assets FOR SELECT
  USING (true);

-- RLS Policy: Only service_role can manage cached assets
DROP POLICY IF EXISTS "Service role can manage cached assets" ON public.cached_assets;
CREATE POLICY "Service role can manage cached assets"
  ON public.cached_assets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to get or create cached asset URL
CREATE OR REPLACE FUNCTION public.get_cached_asset_url(
  p_source_url TEXT,
  p_asset_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cached_asset RECORD;
  v_storage_url TEXT;
  v_supabase_url TEXT := current_setting('app.settings.supabase_url', true);
BEGIN
  -- Check if already cached
  SELECT * INTO v_cached_asset
  FROM public.cached_assets
  WHERE source_url = p_source_url
    AND asset_type = p_asset_type;
  
  IF v_cached_asset IS NOT NULL THEN
    -- Update access stats
    UPDATE public.cached_assets
    SET 
      last_accessed_at = NOW(),
      access_count = access_count + 1
    WHERE id = v_cached_asset.id;
    
    -- Return CDN URL
    RETURN v_supabase_url || '/storage/v1/object/public/' || 
           v_cached_asset.bucket_name || '/' || v_cached_asset.storage_path;
  END IF;
  
  -- Not cached - return original URL
  -- Edge Function should handle caching
  RETURN p_source_url;
END;
$$;

-- Function to register cached asset
CREATE OR REPLACE FUNCTION public.register_cached_asset(
  p_source_url TEXT,
  p_asset_type TEXT,
  p_storage_path TEXT,
  p_bucket_name TEXT,
  p_file_name TEXT,
  p_mime_type TEXT DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL,
  p_ipfs_hash TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.cached_assets (
    asset_type,
    source_url,
    storage_path,
    bucket_name,
    file_name,
    mime_type,
    file_size,
    ipfs_hash,
    metadata
  )
  VALUES (
    p_asset_type,
    p_source_url,
    p_storage_path,
    p_bucket_name,
    p_file_name,
    p_mime_type,
    p_file_size,
    p_ipfs_hash,
    p_metadata
  )
  ON CONFLICT (source_url, asset_type)
  DO UPDATE SET
    storage_path = EXCLUDED.storage_path,
    bucket_name = EXCLUDED.bucket_name,
    file_name = EXCLUDED.file_name,
    mime_type = EXCLUDED.mime_type,
    file_size = EXCLUDED.file_size,
    cached_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

COMMENT ON TABLE public.cached_assets IS 'Tracks assets cached in Supabase Storage for CDN delivery';
COMMENT ON FUNCTION public.get_cached_asset_url(TEXT, TEXT) IS 'Returns cached asset CDN URL or original URL if not cached';
COMMENT ON FUNCTION public.register_cached_asset(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, JSONB) IS 'Registers a cached asset in the database';
