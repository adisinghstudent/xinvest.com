# 🔧 Supabase Configuration for Production

## Problem
Your Supabase auth is redirecting to `http://localhost:3000` instead of your production URL `https://xinvest-com.vercel.app`.

## Solution: Update Supabase Redirect URLs

### Step 1: Go to Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**

### Step 2: Add Production URL

In the **Redirect URLs** section, add:

```
https://xinvest-com.vercel.app/**
```

**Important:** Make sure to include the `/**` at the end to allow all paths.

### Step 3: Update Site URL

Set the **Site URL** to:
```
https://xinvest-com.vercel.app
```

### Step 4: Complete Configuration

Your URL Configuration should look like this:

**Site URL:**
```
https://xinvest-com.vercel.app
```

**Redirect URLs (one per line):**
```
http://localhost:3000/**
https://xinvest-com.vercel.app/**
```

Keep localhost for local development, add production for deployed app.

## Environment Variables

Make sure your production environment (Vercel) has these variables set:

### In Vercel Dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add these:

```
NEXT_PUBLIC_SUPABASE_URL=https://ppvxmfpjmyykqqqrcbvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### For Google OAuth (GCP Console):

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:

```
https://ppvxmfpjmyykqqqrcbvx.supabase.co/auth/v1/callback
```

This is your Supabase callback URL (not your app URL).

## Testing

After making these changes:

1. Clear your browser cache
2. Go to https://xinvest-com.vercel.app
3. Try signing in with Google
4. You should be redirected back to your production URL

## Quick Reference

**Your URLs:**
- Production App: `https://xinvest-com.vercel.app`
- Supabase Project: `https://ppvxmfpjmyykqqqrcbvx.supabase.co`
- Supabase Auth Callback: `https://ppvxmfpjmyykqqqrcbvx.supabase.co/auth/v1/callback`

**What to add where:**

| Service | Setting | Value |
|---------|---------|-------|
| Supabase | Site URL | `https://xinvest-com.vercel.app` |
| Supabase | Redirect URLs | `https://xinvest-com.vercel.app/**` |
| GCP Console | Authorized redirect URIs | `https://ppvxmfpjmyykqqqrcbvx.supabase.co/auth/v1/callback` |
| Vercel | Environment Variables | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

## Chrome Extension Update

Also update the extension to use production URL:

In `/dist/content.js`, line ~382, change:
```javascript
window.open('http://localhost:3000/vault', '_blank');
```

To:
```javascript
window.open('https://xinvest-com.vercel.app/vault', '_blank');
```

Then reload the extension in Chrome.
