-- Drop the check constraint that restricts values to English only
ALTER TABLE scam_alerts DROP CONSTRAINT IF EXISTS scam_alerts_threat_type_check;

-- Translate existing threat_types to Polish MVP strings
UPDATE scam_alerts 
SET threat_type = CASE 
    WHEN threat_type = 'social_engineering' THEN 'Manipulacja'
    WHEN threat_type = 'rug_pull' THEN 'Kradzież funduszy (Rug Pull)'
    WHEN threat_type = 'hack' THEN 'Atak hakerski'
    WHEN threat_type = 'fake_wallet' THEN 'Fałszywa aplikacja'
    ELSE threat_type 
END;
