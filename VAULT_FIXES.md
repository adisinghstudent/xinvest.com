# 🔧 Vault Sharing & Leaderboard Fixes

## Issues Fixed

### 1. ✅ Share Vault Clearing Table
**Problem:** Every time you clicked "Share Vault", it would replace/update the existing vault instead of creating a new entry in the leaderboard.

**Root Cause:** The `saveVault` function was checking if a vault existed and updating it instead of creating new ones.

**Solution:**
- Modified `saveVault` to always insert new vaults (no more updates)
- Each "Share Vault" click now creates a new public vault entry
- Users can have multiple vaults in the leaderboard

**Code Changes:**
```typescript
// Before: Updated existing vault
if (existing) {
  await supabase.from('vaults').update(...)
}

// After: Always insert new
await supabase.from('vaults').insert(...)
```

### 2. ✅ Toggle Public/Private for Specific Vaults
**Problem:** `toggleVaultPublic` was updating ALL vaults for a user, not just the current one.

**Solution:**
- Changed `toggleVaultPublic` to accept a `vaultId` parameter
- Now only toggles the specific vault being shared
- Stores vault ID in localStorage to track which vault is active

**Code Changes:**
```typescript
// Before: Updated all user vaults
toggleVaultPublic(isPublic: boolean)

// After: Updates specific vault
toggleVaultPublic(vaultId: string, isPublic: boolean)
```

### 3. ✅ Leaderboard Shows by Default
**Problem:** You wanted the leaderboard to show on homepage when no analysis has been done.

**Status:** Already working! The leaderboard shows when:
- `!loading` - Not currently analyzing
- `tickers.length === 0` - No tickers selected yet
- `leaderboard.length > 0` - There are public vaults to display

**No changes needed** - this was already implemented correctly.

## How It Works Now

### Creating & Sharing Vaults

1. **User analyzes an account**
   - Enters @username
   - Gets portfolio suggestions
   - Clicks "Open Vault"

2. **First time sharing**
   - User clicks "Share Vault"
   - System creates NEW vault with `is_public: true`
   - Vault ID is saved to localStorage
   - Vault appears on leaderboard

3. **Toggling public/private**
   - User clicks "Share Vault" again
   - System toggles ONLY that specific vault
   - Uses stored vault ID
   - Leaderboard updates accordingly

4. **Creating multiple vaults**
   - User analyzes different account
   - Clicks "Share Vault"
   - Creates ANOTHER new vault
   - Both vaults can be public simultaneously

### Leaderboard Display

**Homepage shows leaderboard when:**
```typescript
!loading && tickers.length === 0 && leaderboard.length > 0
```

**Leaderboard features:**
- Shows top 50 public vaults
- Sorted by all-time PnL (best first)
- Displays: Username, 24h, 30d, All-time performance
- Updates in real-time when vaults are shared

## Database Schema

Your `vaults` table should have:
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- twitter_handle (text, nullable)
- tickers (text[], array of stock symbols)
- weights (jsonb, {ticker: weight})
- reasoning (text, nullable)
- is_public (boolean, default false)
- pnl_24h (numeric, nullable)
- pnl_30d (numeric, nullable)
- pnl_all_time (numeric, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

## Testing

### Test Vault Creation
1. Analyze @elonmusk
2. Click "Open Vault"
3. Click "Share Vault"
4. Check Supabase - should see 1 vault with `is_public: true`

### Test Multiple Vaults
1. Go back home
2. Analyze @cathiewood
3. Click "Open Vault"
4. Click "Share Vault"
5. Check Supabase - should see 2 vaults, both public

### Test Toggling
1. On vault page, click "Share Vault" again
2. Should say "Vault is now private"
3. Check Supabase - that specific vault should have `is_public: false`
4. Leaderboard should update (vault disappears)

### Test Leaderboard
1. Go to homepage
2. Don't enter any username
3. Should see "🏆 Public Leaderboard"
4. Should show all public vaults sorted by performance

## Migration Needed?

If you have existing vaults that were being updated, you might want to clean them up:

```sql
-- Optional: Delete old vaults if needed
DELETE FROM vaults WHERE created_at < '2025-12-07';

-- Or keep them but ensure proper structure
UPDATE vaults SET is_public = false WHERE is_public IS NULL;
```

## Files Modified

1. `/src/lib/supabase.ts`
   - `saveVault` - Always inserts new vaults
   - `toggleVaultPublic` - Takes vaultId parameter

2. `/src/app/vault/page.tsx`
   - Added `vaultId` state
   - Stores vault ID in localStorage
   - Passes vault ID to toggle function

3. `/src/app/page.tsx`
   - No changes needed (leaderboard already works)

## Summary

✅ Each "Share Vault" creates a new public vault  
✅ Multiple vaults can be public simultaneously  
✅ Toggle only affects the specific vault  
✅ Leaderboard shows by default on homepage  
✅ All vaults tracked with unique IDs  

Your leaderboard will now populate correctly with each shared vault!
