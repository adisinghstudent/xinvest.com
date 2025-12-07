-- Updated vaults table schema
-- Run this migration to fix the tickers/weights storage

-- Drop existing table if you want to start fresh (WARNING: deletes all data)
-- DROP TABLE IF EXISTS vaults CASCADE;

-- Create vaults table with proper array/jsonb types
CREATE TABLE IF NOT EXISTS vaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  twitter_handle TEXT,
  tickers TEXT[] NOT NULL,  -- Changed from JSONB to TEXT[] for array of strings
  weights JSONB NOT NULL,   -- Kept as JSONB for {ticker: weight} object
  reasoning TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  pnl_24h DECIMAL(10, 2) DEFAULT 0,
  pnl_30d DECIMAL(10, 2) DEFAULT 0,
  pnl_all_time DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists, alter columns instead:
-- ALTER TABLE vaults ALTER COLUMN tickers TYPE TEXT[] USING tickers::TEXT[];

-- Enable Row Level Security
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own vaults" ON vaults;
DROP POLICY IF EXISTS "Anyone can view public vaults" ON vaults;
DROP POLICY IF EXISTS "Users can insert own vaults" ON vaults;
DROP POLICY IF EXISTS "Users can update own vaults" ON vaults;
DROP POLICY IF EXISTS "Users can delete own vaults" ON vaults;

-- Policy: Users can view own vaults
CREATE POLICY "Users can view own vaults"
  ON vaults FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Anyone can view public vaults (for leaderboard)
CREATE POLICY "Anyone can view public vaults"
  ON vaults FOR SELECT
  USING (is_public = true);

-- Policy: Users can insert their own vaults
CREATE POLICY "Users can insert own vaults"
  ON vaults FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own vaults
CREATE POLICY "Users can update own vaults"
  ON vaults FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own vaults
CREATE POLICY "Users can delete own vaults"
  ON vaults FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS vaults_user_id_idx ON vaults(user_id);
CREATE INDEX IF NOT EXISTS vaults_created_at_idx ON vaults(created_at DESC);
CREATE INDEX IF NOT EXISTS vaults_is_public_idx ON vaults(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS vaults_pnl_all_time_idx ON vaults(pnl_all_time DESC) WHERE is_public = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vaults_updated_at ON vaults;

CREATE TRIGGER update_vaults_updated_at
    BEFORE UPDATE ON vaults
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
