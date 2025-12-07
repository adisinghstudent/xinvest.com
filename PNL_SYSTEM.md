# 📊 PnL Calculation System

## Overview

The leaderboard now shows **real performance data** calculated from actual stock prices using the Yahoo Finance API.

## How It Works

### 1. **Automatic Calculation on Share**

When a user clicks "Share Vault":
1. Vault is created/updated in database
2. System immediately calculates PnL for:
   - **24h**: Last 2 data points
   - **30d**: Last ~30 days of data
   - **All Time**: From vault creation to now
3. PnL values are stored in database
4. Leaderboard displays real performance

### 2. **Periodic Updates (Cron Job)**

**Schedule:** Every 6 hours  
**Endpoint:** `/api/cron-update-pnl`

Updates all public vaults automatically:
- Fetches latest stock data
- Recalculates weighted PnL
- Updates database
- Leaderboard reflects new values

### 3. **PnL Calculation Formula**

```typescript
// For each ticker in portfolio:
tickerPnL = ((endPrice - startPrice) / startPrice) * 100

// Weighted portfolio PnL:
portfolioPnL = Σ (tickerPnL × weight / 100)
```

**Example:**
```
Portfolio:
- TSLA: 20% weight, +5% gain = +1.0%
- NVDA: 30% weight, +10% gain = +3.0%
- AAPL: 50% weight, +2% gain = +1.0%

Total PnL = 1.0 + 3.0 + 1.0 = +5.0%
```

## API Endpoints

### POST `/api/update-pnl`

Calculate PnL for a specific vault.

**Request:**
```json
{
  "vaultId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "pnl": {
    "pnl_24h": 2.5,
    "pnl_30d": 15.3,
    "pnl_all_time": 45.7
  }
}
```

### GET `/api/cron-update-pnl`

Update all public vaults (called by Vercel Cron).

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "message": "PnL update complete",
  "total": 10,
  "successful": 9,
  "failed": 1,
  "updates": [...]
}
```

## Vercel Cron Setup

### 1. Configure Cron Job

File: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron-update-pnl",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Schedule:** `0 */6 * * *` = Every 6 hours  
**Times:** 12am, 6am, 12pm, 6pm UTC

### 2. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
CRON_SECRET=your-random-secret-here
NEXT_PUBLIC_APP_URL=https://xinvest-com.vercel.app
```

Generate secret:
```bash
openssl rand -base64 32
```

### 3. Deploy

```bash
git add vercel.json
git commit -m "Add PnL cron job"
git push
```

Vercel will automatically set up the cron job.

## Manual Trigger

You can manually trigger PnL updates:

### Via API
```bash
curl -X GET https://xinvest-com.vercel.app/api/cron-update-pnl \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Via Browser
1. Go to: `https://xinvest-com.vercel.app/api/cron-update-pnl`
2. Check console for results
3. Refresh leaderboard to see updates

## Database Schema

Ensure your `vaults` table has these columns:

```sql
ALTER TABLE vaults
ADD COLUMN IF NOT EXISTS pnl_24h NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pnl_30d NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pnl_all_time NUMERIC DEFAULT 0;
```

## Testing

### 1. Test Single Vault Update

```bash
# Get a vault ID from Supabase
curl -X POST https://xinvest-com.vercel.app/api/update-pnl \
  -H "Content-Type: application/json" \
  -d '{"vaultId":"YOUR_VAULT_ID"}'
```

### 2. Test Cron Job

```bash
curl -X GET https://xinvest-com.vercel.app/api/cron-update-pnl \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Verify Leaderboard

1. Go to homepage
2. Check leaderboard shows real PnL values
3. Values should be non-zero if stocks have moved

## Monitoring

### Check Cron Logs

Vercel Dashboard → Deployments → Functions → `cron-update-pnl`

### Check Database

```sql
SELECT 
  twitter_handle,
  pnl_24h,
  pnl_30d,
  pnl_all_time,
  updated_at
FROM vaults
WHERE is_public = true
ORDER BY pnl_all_time DESC;
```

## Troubleshooting

### PnL shows 0%

**Causes:**
1. No stock data available yet
2. Vault just created (needs first update)
3. API rate limiting

**Solution:**
- Wait for next cron run (6 hours)
- Or manually trigger update

### Cron not running

**Check:**
1. `vercel.json` is in root directory
2. Deployed to Vercel (not local)
3. `CRON_SECRET` environment variable set

### Calculation seems wrong

**Debug:**
1. Check console logs in `/api/update-pnl`
2. Verify ticker data is fetching correctly
3. Check portfolio weights sum to 100%

## Performance

- **Single vault**: ~2-5 seconds
- **10 vaults**: ~20-50 seconds
- **Rate limiting**: Yahoo Finance has limits
- **Optimization**: Cron runs during low-traffic hours

## Future Enhancements

- [ ] Cache stock data to reduce API calls
- [ ] Add intraday updates (hourly)
- [ ] Historical PnL tracking (daily snapshots)
- [ ] Email notifications for top performers
- [ ] Webhook for real-time updates

---

**Files Created:**
- `/src/app/api/update-pnl/route.ts` - Single vault PnL update
- `/src/app/api/cron-update-pnl/route.ts` - Batch update all vaults
- `/vercel.json` - Cron configuration
- `PNL_SYSTEM.md` - This documentation
