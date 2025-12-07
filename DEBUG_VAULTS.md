# 🐛 Debugging: Vaults Being Deleted

## Problem
When clicking "Share Vault", all existing vaults disappear from the leaderboard.

## Possible Causes

### 1. **Row Level Security (RLS) Issue**

The most likely cause is RLS policies blocking the query.

**Check in Supabase Dashboard:**
1. Go to Table Editor → vaults
2. Check if data exists
3. Try disabling RLS temporarily to test

**SQL to check:**
```sql
-- See all vaults (as admin)
SELECT * FROM vaults;

-- See public vaults (as anonymous user would)
SELECT * FROM vaults WHERE is_public = true;
```

### 2. **Service Role Key Not Set**

The cron job needs service role key to bypass RLS.

**Fix:**
1. Supabase Dashboard → Settings → API
2. Copy "service_role" key (not anon key!)
3. Add to Vercel environment variables:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 3. **Data Type Mismatch**

Tickers might be stored incorrectly.

**Check schema:**
```sql
-- Should be TEXT[] not JSONB
\d vaults
```

**If wrong type, fix with:**
```sql
ALTER TABLE vaults 
ALTER COLUMN tickers TYPE TEXT[] 
USING tickers::TEXT[];
```

### 4. **Frontend Query Issue**

Check browser console for errors.

**Debug in browser:**
```javascript
// Open console on homepage
const { data, error } = await supabase
  .from('vaults')
  .select('*')
  .eq('is_public', true);
  
console.log('Data:', data);
console.log('Error:', error);
```

## Quick Fixes

### Fix 1: Disable RLS Temporarily (Testing Only!)

```sql
ALTER TABLE vaults DISABLE ROW LEVEL SECURITY;
```

If this fixes it, the issue is with RLS policies.

**Then re-enable and fix policies:**
```sql
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

-- Make sure this policy exists:
CREATE POLICY "Anyone can view public vaults"
  ON vaults FOR SELECT
  USING (is_public = true);
```

### Fix 2: Check Supabase Client

Make sure you're using the anon key for frontend:

```typescript
// src/lib/supabase.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Fix 3: Verify Data Exists

```sql
-- Count public vaults
SELECT COUNT(*) FROM vaults WHERE is_public = true;

-- See all public vaults
SELECT 
  id,
  twitter_handle,
  is_public,
  pnl_24h,
  pnl_30d,
  pnl_all_time,
  created_at
FROM vaults 
WHERE is_public = true
ORDER BY pnl_all_time DESC;
```

## Step-by-Step Debug

### 1. Check Supabase Dashboard

1. Go to Supabase → Table Editor → vaults
2. Do you see any rows?
3. Are any `is_public = true`?
4. If yes, data exists (RLS issue)
5. If no, data is being deleted (code issue)

### 2. Check Browser Console

1. Go to homepage
2. Open DevTools (F12)
3. Look for errors
4. Check Network tab for failed requests

### 3. Check Supabase Logs

1. Supabase Dashboard → Logs
2. Look for errors around the time you clicked "Share"
3. Check for permission errors

### 4. Test Leaderboard Query

```typescript
// In browser console on homepage
const { data, error } = await window.supabase
  .from('vaults')
  .select('twitter_handle, pnl_24h, pnl_30d, pnl_all_time, updated_at')
  .eq('is_public', true)
  .order('pnl_all_time', { ascending: false })
  .limit(50);

console.log('Leaderboard data:', data);
console.log('Leaderboard error:', error);
```

## Most Likely Solution

Based on the symptoms, this is probably an **RLS policy issue**.

**Fix:**

1. Go to Supabase Dashboard
2. SQL Editor
3. Run this:

```sql
-- Drop and recreate the public viewing policy
DROP POLICY IF EXISTS "Anyone can view public vaults" ON vaults;

CREATE POLICY "Anyone can view public vaults"
  ON vaults FOR SELECT
  USING (is_public = true);

-- Verify it works
SELECT * FROM vaults WHERE is_public = true;
```

## If Data Is Actually Being Deleted

Check for:

1. **Cascade deletes** - Line 4 of schema has `ON DELETE CASCADE`
2. **Trigger functions** - Any triggers that might delete rows
3. **Application code** - Search for `.delete()` calls

```bash
# Search for delete calls
grep -r "\.delete()" src/
```

## Environment Variables Checklist

Make sure these are set in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://ppvxmfpjmyykqqqrcbvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for cron)
CRON_SECRET=your_cron_secret
```

## Contact Me With

1. Screenshot of Supabase table editor (vaults table)
2. Browser console errors
3. Supabase logs
4. Result of this query:
   ```sql
   SELECT COUNT(*), is_public FROM vaults GROUP BY is_public;
   ```

This will help identify the exact issue!
