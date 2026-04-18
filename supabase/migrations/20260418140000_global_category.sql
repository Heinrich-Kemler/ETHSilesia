-- Add global category
ALTER TABLE scam_alerts DROP CONSTRAINT IF EXISTS scam_alerts_category_check;
ALTER TABLE scam_alerts ADD CONSTRAINT scam_alerts_category_check CHECK (category IN ('web2', 'web3', 'global'));
