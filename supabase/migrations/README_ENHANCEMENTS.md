# Optional Database Enhancements

This document describes optional enhancements you can apply to improve the database schema.

## Available Enhancements

### 1. Normalize add_ons to Lowercase ✅ Recommended
**File**: `optional_enhancements.sql` (Enhancement 1)

**What it does**: Automatically converts all add-on values to lowercase to prevent mismatches like `'DeFi'` vs `'defi'`.

**When to use**: If you're concerned about case-sensitivity issues in your webhook or frontend code.

**Impact**: Low - only affects new inserts/updates, existing data is normalized on next update.

### 2. Composite Index for User + Add-ons Queries ✅ Recommended
**File**: `optional_enhancements.sql` (Enhancement 2)

**What it does**: Creates a composite GIN index on `(user_id, add_ons)` for faster queries like:
```sql
SELECT * FROM profiles 
WHERE user_id = '...' AND 'defi' = ANY(add_ons);
```

**When to use**: If you frequently query for users with specific add-ons.

**Impact**: Low - improves query performance, minimal storage overhead.

### 3. Enforce public_key NOT NULL ⚠️ Use with Caution
**File**: `optional_enhancements.sql` (Enhancement 3)

**What it does**: Makes `public_key` a required field after account recovery.

**When to use**: Only if you want to enforce that all users must have a public key after Fort Knox recovery.

**Impact**: High - will fail if any existing profiles have NULL public_key. Uncomment in the migration file to enable.

### 4. Public Key Lookup Index ✅ Recommended
**File**: `optional_enhancements.sql` (Enhancement 4)

**What it does**: Creates an index on `public_key` for faster Ed25519 signature verification lookups.

**When to use**: If you frequently look up users by their public key for signature verification.

**Impact**: Low - improves lookup performance.

### 5. Get Users with Add-on Function ✅ Recommended
**File**: `optional_enhancements.sql` (Enhancement 5)

**What it does**: Creates a helper function to get all users who have a specific add-on active.

**Usage**:
```sql
SELECT * FROM get_users_with_addon('defi');
```

**When to use**: For analytics, feature rollouts, or admin dashboards.

**Impact**: Low - adds a useful utility function.

### 6. Prevent Duplicate Add-ons ✅ Recommended
**File**: `optional_enhancements.sql` (Enhancement 6)

**What it does**: Ensures the `add_ons` array never contains duplicate values (e.g., `['defi', 'defi']`).

**When to use**: As a safety guardrail to prevent data inconsistencies.

**Impact**: Low - prevents edge cases where duplicates might occur.

## How to Apply

### Option 1: Apply All Recommended Enhancements
```sql
-- Run the entire optional_enhancements.sql file
-- This applies enhancements 1, 2, 4, 5, 6 (skips 3 which requires manual uncomment)
```

### Option 2: Apply Selectively
Copy only the enhancements you want from `optional_enhancements.sql` into Supabase SQL Editor.

## Recommended Setup

For most use cases, apply:
- ✅ Enhancement 1 (Normalize lowercase)
- ✅ Enhancement 2 (Composite index)
- ✅ Enhancement 4 (Public key index)
- ✅ Enhancement 5 (Get users function)
- ✅ Enhancement 6 (No duplicates)

Skip:
- ⚠️ Enhancement 3 (NOT NULL on public_key) - only if you want strict enforcement

## Testing After Application

Run the validation tests:
```sql
-- Test normalization
INSERT INTO profiles (user_id, add_ons) 
VALUES (gen_random_uuid(), ARRAY['DeFi', 'CORE']::text[]);
-- Should be stored as: ['defi', 'core']

-- Test duplicate prevention
INSERT INTO profiles (user_id, add_ons) 
VALUES (gen_random_uuid(), ARRAY['defi', 'defi']::text[]);
-- Should fail with: "add_ons array contains duplicate values"

-- Test get_users_with_addon function
SELECT * FROM get_users_with_addon('defi');
```

## Maintenance

If you add new add-on names:
1. Update the CHECK constraint in `kryptotrac_profiles_fort_knox.sql`
2. Re-run the constraint update
3. The normalization function will automatically handle lowercase conversion
