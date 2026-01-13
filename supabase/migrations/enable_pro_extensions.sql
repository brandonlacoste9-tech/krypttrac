-- ============================================
-- Krypto Trac: Enable Pro Supabase Extensions
-- Enables TimescaleDB, pgvector, and other pro features
-- ============================================

-- Enable TimescaleDB (for time-series price data)
-- Note: Only available in certain regions. Check Supabase dashboard first.
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable pgvector (for AI embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_cron (for scheduled tasks)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
SELECT 
  extname,
  extversion,
  CASE 
    WHEN extname = 'timescaledb' THEN '✅ TimescaleDB enabled for time-series data'
    WHEN extname = 'vector' THEN '✅ pgvector enabled for AI embeddings'
    WHEN extname = 'pg_cron' THEN '✅ pg_cron enabled for scheduled tasks'
    ELSE '✅ ' || extname || ' enabled'
  END as status
FROM pg_extension
WHERE extname IN ('timescaledb', 'vector', 'pg_cron', 'uuid-ossp')
ORDER BY extname;
