-- Create vaults table
CREATE TABLE IF NOT EXISTS vaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  twitter_handle TEXT,
  tickers JSONB NOT NULL,
  weights JSONB NOT NULL,
  reasoning TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  pnl_24h DECIMAL(10, 2) DEFAULT 0,
  pnl_30d DECIMAL(10, 2) DEFAULT 0,
  pnl_all_time DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS vaults_user_id_idx ON vaults(user_id);
CREATE INDEX IF NOT EXISTS vaults_created_at_idx ON vaults(created_at DESC);
CREATE INDEX IF NOT EXISTS vaults_is_public_idx ON vaults(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS vaults_pnl_all_time_idx ON vaults(pnl_all_time DESC) WHERE is_public = true;
