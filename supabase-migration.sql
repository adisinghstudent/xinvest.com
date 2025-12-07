-- Add new columns to existing vaults table
ALTER TABLE vaults 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pnl_24h DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pnl_30d DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pnl_all_time DECIMAL(10, 2) DEFAULT 0;

-- Add policy for public vaults (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vaults' 
    AND policyname = 'Anyone can view public vaults'
  ) THEN
    CREATE POLICY "Anyone can view public vaults"
      ON vaults FOR SELECT
      USING (is_public = true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS vaults_is_public_idx ON vaults(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS vaults_pnl_all_time_idx ON vaults(pnl_all_time DESC) WHERE is_public = true;
