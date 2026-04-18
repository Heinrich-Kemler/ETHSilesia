-- Scam Alerts table for Skarbnik Security Feed
CREATE TABLE IF NOT EXISTS scam_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_pl text NOT NULL,
  title_en text,
  summary_pl text NOT NULL,
  summary_en text,
  threat_type text NOT NULL CHECK (threat_type IN ('phishing', 'rug_pull', 'hack', 'fake_wallet', 'social_engineering')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_url text,
  amount_lost_usd numeric,
  chains text[],
  active boolean DEFAULT true,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups of active alerts sorted by severity
CREATE INDEX IF NOT EXISTS idx_scam_alerts_active ON scam_alerts (active, severity, detected_at DESC);

-- Insert 3 evergreen alerts
INSERT INTO scam_alerts (title_pl, title_en, summary_pl, summary_en, threat_type, severity, active)
VALUES
  (
    'Phishing na frazę odzyskiwania — najczęstszy atak',
    'Seed Phrase Phishing — Most Common Attack',
    'Oszuści wysyłają fałszywe e-maile lub wiadomości, podszywając się pod MetaMask, Ledger lub inne portfele. Proszą o "weryfikację" portfela poprzez wpisanie frazy odzyskiwania (seed phrase). Ta fraza daje pełny dostęp do Twojego portfela. Nigdy nie wpisuj jej nigdzie poza pierwszą konfiguracją portfela!',
    'Scammers send fake emails or messages pretending to be MetaMask, Ledger, or other wallets asking you to ''verify'' your wallet by entering your seed phrase. Your seed phrase gives complete access to your wallet. Never enter it anywhere except when first setting up your wallet.',
    'phishing',
    'critical',
    true
  ),
  (
    'Fałszywa pomoc techniczna',
    'Fake Customer Support Scams',
    'Oszuści dołączają do grup krypto na Telegramie i Discordzie i udają pomoc techniczną. Będą prosić o Twoją frazę odzyskiwania lub klucz prywatny. Żaden prawdziwy zespół wsparcia nigdy o to nie poprosi. Nigdy!',
    'Scammers join crypto Telegram and Discord groups and pretend to be customer support. They will ask for your seed phrase or private key. No legitimate support team will ever ask for this. Ever.',
    'social_engineering',
    'critical',
    true
  ),
  (
    'Fałszywe strony z airdropami',
    'Fake Airdrop Websites',
    'Strony twierdzą, że masz nieodebrane tokeny i proszą o podłączenie portfela i podpisanie transakcji. Ta transakcja potajemnie daje im dostęp do opróżnienia Twojego portfela. Korzystaj wyłącznie z oficjalnych stron projektów!',
    'Websites claim you have unclaimed tokens and ask you to connect your wallet and sign a transaction. This transaction secretly gives them access to drain your wallet. Only interact with official project websites.',
    'phishing',
    'high',
    true
  );
