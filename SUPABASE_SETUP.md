# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to initialize

## 2. Run SQL Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Click "Run" to create the vaults table and policies

## 3. Enable Google OAuth
1. Go to Authentication → Providers in Supabase dashboard
2. Enable "Google" provider
3. Add your Google OAuth credentials:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

## 4. Update Environment Variables
Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

Find these values in:
- Settings → API → Project URL
- Settings → API → Project API keys → anon/public

## 5. Test Authentication
1. Run `npm run dev`
2. Create a portfolio
3. Click "Open Vault"
4. You'll be prompted to sign in with Google
5. After auth, vault will be saved to Supabase

## Database Schema

```sql
vaults
├── id (UUID, primary key)
├── user_id (UUID, foreign key to auth.users)
├── twitter_handle (TEXT)
├── tickers (JSONB)
├── weights (JSONB)
├── reasoning (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Row Level Security (RLS)
- Users can only see/edit their own vaults
- Automatic user_id association
- Secure by default

## That's it!
Your vault data is now securely stored in Supabase with Google authentication! 🚀
