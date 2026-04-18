-- Add category (web2/web3) and source_name to scam_alerts
ALTER TABLE scam_alerts
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'web3' CHECK (category IN ('web2', 'web3')),
  ADD COLUMN IF NOT EXISTS source_name text;

-- Widen the threat_type constraint to accept new types from external feeds
ALTER TABLE scam_alerts DROP CONSTRAINT IF EXISTS scam_alerts_threat_type_check;

-- Back-fill existing rows
UPDATE scam_alerts SET source_name = 'manual' WHERE source_name IS NULL;
UPDATE scam_alerts SET category = 'web3' WHERE category IS NULL;

-- Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_scam_alerts_category ON scam_alerts (category, active, detected_at DESC);
