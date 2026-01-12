-- Migration: Add add_ons column to profiles table
-- Run this in Supabase SQL Editor

-- Add add_ons column as TEXT array
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS add_ons TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add constraint to validate add-on values
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_add_ons;

ALTER TABLE profiles
ADD CONSTRAINT valid_add_ons CHECK (
  array_length(add_ons, 1) IS NULL OR 
  add_ons <@ ARRAY['core', 'defi', 'whale']::TEXT[]
);

-- Create index on add_ons for fast queries
CREATE INDEX IF NOT EXISTS idx_profiles_add_ons ON profiles USING GIN (add_ons);

-- Update RLS policy to allow service role to update profiles
-- (Service role bypasses RLS by default, but this ensures compatibility)

-- Allow authenticated users to update their own profile's add_ons
DROP POLICY IF EXISTS "Users can update own add_ons" ON profiles;

CREATE POLICY "Users can update own add_ons"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to safely append add-on (idempotent)
CREATE OR REPLACE FUNCTION add_user_addon(user_id UUID, addon TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    add_ons = CASE 
      WHEN NOT (add_ons @> ARRAY[addon]) 
      THEN array_append(add_ons, addon)
      ELSE add_ons
    END,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to safely remove add-on
CREATE OR REPLACE FUNCTION remove_user_addon(user_id UUID, addon TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    add_ons = array_remove(add_ons, addon),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
