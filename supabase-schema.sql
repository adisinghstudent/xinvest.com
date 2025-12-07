-- Create vaults table
CREATE TABLE IF NOT EXISTS vaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  twitter_handle TEXT,
  tickers JSONB NOT NULL,
  weights JSONB NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own vaults
CREATE POLICY "Users can view own vaults"
  ON vaults FOR SELECT
  USING (auth.uid() = user_id);

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
