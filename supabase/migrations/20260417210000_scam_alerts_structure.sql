-- Add structured content columns to scam_alerts
ALTER TABLE scam_alerts 
ADD COLUMN IF NOT EXISTS protection_tips_pl text,
ADD COLUMN IF NOT EXISTS protection_tips_en text,
ADD COLUMN IF NOT EXISTS analogy_pl text,
ADD COLUMN IF NOT EXISTS analogy_en text;

-- Update the existing evergreen alerts with structured data
UPDATE scam_alerts 
SET 
  analogy_pl = 'Wyobraź sobie, że ktoś dzwoni podając się za Twój bank i prosi o Twój PIN i hasło do bankowości internetowej.',
  analogy_en = 'Imagine someone calling you pretending to be your bank and asking for your PIN and online banking password.',
  protection_tips_pl = '• Nigdy nie wpisuj swojej frazy odzyskiwania na żadnej stronie i nie podawaj jej w formularzach.\n• Ściągaj portfele tylko ze zweryfikowanych stron producentów.\n• Ignoruj wiadomości e-mail twierdzące, że z Twoim portfelem "coś jest nie tak".',
  protection_tips_en = '• Never enter your seed phrase on any website or form.\n• Only download wallets from official sources.\n• Ignore emails claiming "there is an issue with your wallet."'
WHERE threat_type = 'phishing' AND severity = 'critical';

UPDATE scam_alerts 
SET 
  analogy_pl = 'To tak, jakby na chodniku stał oszust w mundurze ochroniarza z lokalnego supermarketu – niby wygląda oficjalnie, ale jedyne co chce od Ciebie to wyciągnąć kluczyki do samochodu.',
  analogy_en = 'It''s like a scammer standing on the sidewalk in a uniform of a local supermarket security guard - looks official, but all they want is your car keys.',
  protection_tips_pl = '• Blokuj z marszu wszystkie osoby, które piszą do Ciebie w wiadomościach prywatnych na Telegramie lub Discordzie podając się za pomoc techniczną.\n• Prawdziwy pracownik supportu nigdy, pod żadnym pozorem, nie poprosi Cię o klucz prywatny lub frazę seed.\n• Szukaj pomocy na publicznych, rygorystycznie moderowanych kanałach pomocy oficjalnych Discordów/Telegramów.',
  protection_tips_en = '• Immediately block anyone DMing you on Telegram/Discord claiming to be tech support.\n• Real support will never ask for your private key or seed phrase.\n• Seek help only on strictly moderated, public official channels.'
WHERE threat_type = 'social_engineering';

UPDATE scam_alerts 
SET 
  analogy_pl = 'Odbierasz telefon, że wygrałeś darmowe wczasy na Malediwach – jedyne co musisz zrobić to podać namiotowi dane do Twojej karty debetowej i podpisać weksel "in blanco".',
  analogy_en = 'You get a call saying you won a free trip to the Maldives — all you need to do is give them your debit card details and sign a blank promissory note.',
  protection_tips_pl = '• Pamiętaj: nie ma w krypto czegoś takiego jak darmowe pieniądze. Traktuj każdy nowy token w portfelu jako złośliwe oprogramowanie (tzw. "dusting attack").\n• Nigdy nie podpinaj portfela do stron, które znalazłeś na Twitterze u influencerów krzyczących o setkach procent zysku.\n• Zawsze sprawdzaj co dokładnie podpisujesz na swoim sprzętowym/sofware''owym portfelu (czy akurat nie oddajesz uprawnień "infinite approval" dla całego kontraktu).',
  protection_tips_en = '• Remember: there is no free money in crypto. Treat every random token appearing in your wallet as malicious.\n• Never connect your wallet to random sites you found via Twitter crypto-influencers promising insane profits.\n• Always verify what transaction you are signing (watch out for "infinite approval").'
WHERE threat_type = 'phishing' AND severity = 'high';
