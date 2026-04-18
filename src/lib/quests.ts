/**
 * Centralised quest catalogue. All quest data, metadata, and questions
 * live here so pages can import them without the server.
 *
 * Each quest now ships with 6 questions (original 3 + 3 deeper follow-ups).
 * Scoring scales with `questions.length` — see /quest/[id]/page.tsx.
 */

import type { Lang } from "./i18n";

export type QuizOption = { pl: string; en: string };
export type QuizQuestion = {
  question: QuizOption;
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
  correctIndex: 0 | 1 | 2 | 3;
};

export type Quest = {
  id: string;
  level: 1 | 2 | 3;
  titlePl: string;
  titleEn: string;
  xp: number;
  stars: 1 | 2 | 3;
  /** Minimum 1 question; we currently ship 6 per quest. */
  questions: readonly [QuizQuestion, ...QuizQuestion[]];
  /** 1-2 sentence educational takeaway shown after each answer. */
  explainer?: QuizOption;
};

function pl_en(pl: string, en: string): QuizOption {
  return { pl, en };
}

/**
 * Short static educational takeaway per quest. Shown beneath each answer
 * when the AI coach is paused (see AI_ENABLED flag in /api/ai/explain).
 */
const EXPLAINERS: Record<string, QuizOption> = {
  "l1-blockchain": pl_en(
    "Blockchain to wspólna, publiczna księga. Transakcje są grupowane w bloki i weryfikowane przez wiele niezależnych komputerów — dlatego nikt pojedynczy nie może ich zmienić.",
    "A blockchain is a shared public ledger. Transactions are grouped into blocks and verified by many independent computers — so no single party can alter them."
  ),
  "l1-wallet": pl_en(
    "Portfel przechowuje Twoje klucze, nie tokeny. Kto ma klucze (lub seed phrase), ten kontroluje środki — nigdy nikomu ich nie udostępniaj.",
    "A wallet holds your keys, not the coins. Whoever has the keys (or seed phrase) controls the funds — never share them with anyone."
  ),
  "l1-usdc": pl_en(
    "USDC to stablecoin śledzący kurs dolara (1 USDC ≈ 1 USD). Każdy token jest pokryty rezerwami, którymi zarządza regulowana firma Circle.",
    "USDC is a stablecoin that tracks the US dollar (1 USDC ≈ 1 USD). Every token is backed by reserves managed by the regulated company Circle."
  ),
  "l1-transaction": pl_en(
    "Transakcja potrzebuje adresu odbiorcy i opłaty za gas. Walidatorzy sieci ją potwierdzają i po zatwierdzeniu nie da się jej cofnąć.",
    "A transaction needs a recipient address and a gas fee. Network validators confirm it and once confirmed it cannot be reversed."
  ),
  "l1-gas": pl_en(
    "Gas to opłata za wykonanie transakcji w sieci blockchain. Rośnie, gdy sieć jest obciążona — L2 (Base, Arbitrum) jest zwykle znacznie tańsze od Ethereum L1.",
    "Gas is the fee to run a transaction on the blockchain. It rises when the network is busy — L2s like Base and Arbitrum are typically much cheaper than Ethereum L1."
  ),
  "l2-defi": pl_en(
    "DeFi (decentralised finance) to finanse bez pośredników — smart kontrakty zastępują banki, brokerów i notariuszy. Ty zachowujesz klucze i pełną kontrolę.",
    "DeFi (decentralised finance) means finance without middlemen — smart contracts replace banks, brokers and notaries. You keep your keys and full control."
  ),
  "l2-dex": pl_en(
    "DEX (zdecentralizowana giełda) pozwala handlować bezpośrednio ze smart kontraktem — bez oddawania komuś kluczy. Przykład: Uniswap.",
    "A DEX (decentralised exchange) lets you trade directly with a smart contract — no need to hand over your keys. Example: Uniswap."
  ),
  "l2-yield": pl_en(
    "Yield to zwrot z Twojego kapitału (odsetki, nagrody za staking). Wyższy yield zwykle oznacza wyższe ryzyko — obietnice „gwarantowanych” wysokich zwrotów to czerwona flaga.",
    "Yield is the return on your capital (interest, staking rewards). Higher yield usually means higher risk — promises of “guaranteed” high returns are a red flag."
  ),
  "l2-liquidity": pl_en(
    "Pula płynności gromadzi tokeny od wielu dostawców i zasila handel na DEX-ie. Dostawcy (LP) zarabiają część opłat z transakcji w puli.",
    "A liquidity pool collects tokens from many providers to power DEX trading. Providers (LPs) earn a share of the pool's trading fees."
  ),
  "l2-smart": pl_en(
    "Smart kontrakt to kod, który sam wykonuje zapisane warunki — bez ingerencji człowieka. Jest niezmienny po wdrożeniu, dlatego audyty bezpieczeństwa są kluczowe.",
    "A smart contract is code that self-executes its rules — no human in the loop. It is immutable after deployment, which is why security audits are essential."
  ),
  "l3-il": pl_en(
    "Impermanent loss to strata względem trzymania tokenów, która powstaje, gdy ceny w puli się rozjeżdżają. Opłaty z handlu mogą ją zrównoważyć; pule stablecoin-stablecoin mają niską ekspozycję.",
    "Impermanent loss is the loss vs. simply holding, caused when pool token prices diverge. Trading fees can offset it; stablecoin-stablecoin pools have low exposure."
  ),
  "l3-rwa": pl_en(
    "Real World Assets to tokenizacja realnych aktywów (obligacji, nieruchomości) na blockchainie. Daje szerszy dostęp 24/7, ale nadal podlega ryzyku emitenta i regulacjom.",
    "Real World Assets means tokenising real-world assets (bonds, property) on-chain. It opens 24/7 access, but still carries issuer and regulatory risk."
  ),
  "l3-risk": pl_en(
    "Oceniając ryzyko patrz na: audyty, TVL, transparentność zespołu, regulatora (w Polsce — KNF). Inwestuj tylko tyle, ile możesz stracić, i dywersyfikuj.",
    "When assessing risk, check: audits, TVL, team transparency, the regulator (in Poland — KNF). Invest only what you can afford to lose, and diversify."
  ),
  "l3-rug": pl_en(
    "Rug pull to oszustwo, w którym twórcy wyciągają płynność i znikają. Czerwone flagi: anonimowy zespół, brak audytu, „gwarantowane” bardzo wysokie zwroty. DYOR = sprawdź sam zanim wejdziesz.",
    "A rug pull is a scam where the team drains the liquidity and disappears. Red flags: anonymous team, no audit, “guaranteed” very high returns. DYOR = verify it yourself before investing."
  ),
  "l3-boss": pl_en(
    "Fundamenty Skarbnika: cold wallet na większe kwoty, multisig dla wspólnego zarządzania, DYOR (Do Your Own Research) i nigdy więcej niż jesteś gotów stracić.",
    "Skarbnik's foundations: a cold wallet for bigger balances, multisig for shared custody, DYOR (Do Your Own Research) and never more than you can afford to lose."
  ),
};

/** Helper to make a quest. */
function q(
  id: string,
  level: 1 | 2 | 3,
  titlePl: string,
  titleEn: string,
  xp: number,
  stars: 1 | 2 | 3,
  questions: readonly [QuizQuestion, ...QuizQuestion[]],
  explainer?: QuizOption
): Quest {
  return {
    id,
    level,
    titlePl,
    titleEn,
    xp,
    stars,
    questions,
    explainer: explainer ?? EXPLAINERS[id],
  };
}

/* ==============================================================
   LEVEL 1 QUESTS
   ============================================================== */
export const QUESTS: Quest[] = [
  q(
    "l1-blockchain",
    1,
    "Czym jest blockchain?",
    "What is a blockchain?",
    50,
    1,
    [
      {
        question: pl_en("Blockchain to...", "A blockchain is..."),
        options: [
          pl_en("Centralna baza danych banku", "A bank's central database"),
          pl_en(
            "Zdecentralizowany rejestr transakcji",
            "A decentralised transaction ledger"
          ),
          pl_en("Aplikacja mobilna", "A mobile application"),
          pl_en("Rodzaj kryptowaluty", "A type of cryptocurrency"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Kto może zobaczyć transakcje na blockchainie?",
          "Who can see transactions on a blockchain?"
        ),
        options: [
          pl_en("Tylko nadawca i odbiorca", "Only the sender and receiver"),
          pl_en("Tylko banki", "Only banks"),
          pl_en(
            "Wszyscy — blockchain jest publiczny",
            "Everyone — the blockchain is public"
          ),
          pl_en("Tylko rząd", "Only the government"),
        ],
        correctIndex: 2,
      },
      {
        question: pl_en(
          "Co oznacza 'blok' w blockchain?",
          "What does 'block' mean in a blockchain?"
        ),
        options: [
          pl_en("Zablokowana transakcja", "A blocked transaction"),
          pl_en("Zapis grupy transakcji", "A record of a group of transactions"),
          pl_en("Błąd w systemie", "A system error"),
          pl_en("Rodzaj portfela", "A kind of wallet"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Co oznacza 'zdecentralizowany'?",
          "What does 'decentralised' mean?"
        ),
        options: [
          pl_en("Kontrolowany przez jedną firmę", "Controlled by one company"),
          pl_en(
            "Rozproszony między wielu uczestników",
            "Distributed across many participants"
          ),
          pl_en("Zablokowany przez rząd", "Blocked by the government"),
          pl_en("Przechowywany w chmurze Amazon", "Stored on Amazon cloud"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Pierwszą znaną kryptowalutą blockchain był...",
          "The first well-known blockchain cryptocurrency was..."
        ),
        options: [
          pl_en("Ethereum", "Ethereum"),
          pl_en("Bitcoin", "Bitcoin"),
          pl_en("Dogecoin", "Dogecoin"),
          pl_en("Litecoin", "Litecoin"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Co zapewnia bezpieczeństwo blockchainu?",
          "What secures a blockchain?"
        ),
        options: [
          pl_en("Kryptografia i konsensus sieci", "Cryptography and network consensus"),
          pl_en("Program antywirusowy", "An antivirus program"),
          pl_en("Hasło administratora", "An admin password"),
          pl_en("SMS potwierdzający", "A confirmation SMS"),
        ],
        correctIndex: 0,
      },
    ]
  ),
  q(
    "l1-wallet",
    1,
    "Twój pierwszy portfel",
    "Your first wallet",
    50,
    1,
    [
      {
        question: pl_en(
          "Portfel kryptowalutowy przechowuje...",
          "A crypto wallet stores..."
        ),
        options: [
          pl_en("Kryptowaluty bezpośrednio", "Cryptocurrencies directly"),
          pl_en("Klucze do twoich środków", "Keys to your funds"),
          pl_en("Hasła", "Passwords"),
          pl_en("Dane osobowe", "Personal data"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Co NIGDY nie należy robić z frazą seed?",
          "What should you NEVER do with your seed phrase?"
        ),
        options: [
          pl_en("Zapisywać na papierze", "Write it on paper"),
          pl_en("Przechowywać w sejfie", "Keep it in a safe"),
          pl_en("Podawać innym osobom", "Share it with others"),
          pl_en("Zapamiętywać", "Memorise it"),
        ],
        correctIndex: 2,
      },
      {
        question: pl_en("Hot wallet to...", "A hot wallet is..."),
        options: [
          pl_en("Portfel w wysokiej temperaturze", "A wallet at high temperature"),
          pl_en(
            "Portfel podłączony do internetu",
            "A wallet connected to the internet"
          ),
          pl_en("Portfel sprzętowy", "A hardware wallet"),
          pl_en("Portfel bankowy", "A bank wallet"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Klucz prywatny daje Ci...",
          "A private key gives you..."
        ),
        options: [
          pl_en("Dostęp do WiFi", "Access to WiFi"),
          pl_en(
            "Pełną kontrolę nad środkami w portfelu",
            "Full control over the wallet's funds"
          ),
          pl_en("Darmowe tokeny co miesiąc", "Free tokens every month"),
          pl_en("Zniżkę w sklepie", "A shop discount"),
        ],
        correctIndex: 1,
      },
      {
        // Polish learners don't universally recognise the English
        // idiom, so the PL version leads with a natural Polish
        // translation and parenthesises the original (which they'll
        // still see repeated in crypto Twitter / exchanges). EN
        // keeps the canonical form unchanged.
        question: pl_en(
          "„Nie twoje klucze — nie twoje monety” (ang. 'Not your keys, not your coins') oznacza...",
          "'Not your keys, not your coins' means..."
        ),
        options: [
          pl_en(
            "Jeśli ktoś inny trzyma klucze, nie kontrolujesz środków",
            "If someone else holds your keys, you don't control the funds"
          ),
          pl_en("Trzeba mieć klucze od mieszkania", "You need keys to your apartment"),
          pl_en("Zapłać więcej za bezpieczeństwo", "Pay more for security"),
          pl_en("Musisz mieć wiele portfeli", "You need multiple wallets"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Najbezpieczniejszy backup frazy seed to...",
          "The safest backup of your seed phrase is..."
        ),
        options: [
          pl_en("Zdjęcie w telefonie", "A photo on your phone"),
          pl_en("Email do samego siebie", "An email to yourself"),
          pl_en("Zapis na papierze w sejfie", "Written on paper in a safe"),
          pl_en("Publikacja na X/Twitterze", "Posted on X/Twitter"),
        ],
        correctIndex: 2,
      },
    ]
  ),
  q(
    "l1-usdc",
    1,
    "USDC — stabilna kryptowaluta",
    "USDC — the stable cryptocurrency",
    75,
    1,
    [
      {
        question: pl_en("Czym jest USDC?", "What is USDC?"),
        options: [
          pl_en("Token gamingowy", "A gaming token"),
          pl_en("Stablecoin powiązany z dolarem", "A dollar-pegged stablecoin"),
          pl_en("Akcja spółki", "A company share"),
          pl_en("Polska waluta cyfrowa", "A Polish digital currency"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Ile zwykle wynosi cena 1 USDC?",
          "What is 1 USDC usually worth?"
        ),
        options: [
          pl_en("Około 1 USD", "About 1 USD"),
          pl_en("Około 1 PLN", "About 1 PLN"),
          pl_en("Około 100 USD", "About 100 USD"),
          pl_en("Zmienna — jak Bitcoin", "Variable — like Bitcoin"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Co zabezpiecza wartość USDC?",
          "What backs the value of USDC?"
        ),
        options: [
          pl_en("Nic — jest losowe", "Nothing — it's random"),
          pl_en(
            "Rezerwy w dolarach i obligacjach",
            "Reserves in dollars and bonds"
          ),
          pl_en("Góra złota", "A mountain of gold"),
          pl_en("Mining", "Mining"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en("Kto emituje USDC?", "Who issues USDC?"),
        options: [
          pl_en("Circle", "Circle"),
          pl_en("Bitcoin Foundation", "Bitcoin Foundation"),
          pl_en("Polski rząd", "The Polish government"),
          pl_en("Apple", "Apple"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Dlaczego stablecoiny są popularne w DeFi?",
          "Why are stablecoins popular in DeFi?"
        ),
        options: [
          pl_en("Bo są bezwartościowe", "Because they're worthless"),
          pl_en(
            "Stabilna wartość do handlu i oszczędzania",
            "Stable value for trading and saving"
          ),
          pl_en("Bo dają 1000% APY", "Because they offer 1000% APY"),
          pl_en("Bo są w pełni anonimowe", "Because they are fully anonymous"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Co oznacza, że stablecoin 'tracił peg'?",
          "What does it mean when a stablecoin 'loses its peg'?"
        ),
        options: [
          pl_en("Nic szczególnego", "Nothing special"),
          pl_en(
            "Jego cena odbiega od 1 USD — ryzyko dla użytkowników",
            "Its price diverges from 1 USD — a risk to holders"
          ),
          pl_en("Staje się Bitcoinem", "It becomes Bitcoin"),
          pl_en("Rząd go odkupuje", "The government buys it back"),
        ],
        correctIndex: 1,
      },
    ]
  ),
  q(
    "l1-transaction",
    1,
    "Jak działa transakcja?",
    "How does a transaction work?",
    75,
    2,
    [
      {
        question: pl_en(
          "Kto potwierdza transakcję w blockchainie?",
          "Who confirms a transaction on the blockchain?"
        ),
        options: [
          pl_en("Bank centralny", "The central bank"),
          pl_en("Walidatorzy sieci", "Network validators"),
          pl_en("Sąd", "A court"),
          pl_en("Użytkownik sam", "The user themself"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Ile minut zajmuje typowo transakcja na Ethereum?",
          "How long does a typical Ethereum transaction take?"
        ),
        options: [
          pl_en("Od sekund do kilku minut", "Seconds to a few minutes"),
          pl_en("Kilka dni", "A few days"),
          pl_en("Tydzień", "A week"),
          pl_en("Miesiąc", "A month"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Czy transakcję można cofnąć po zatwierdzeniu?",
          "Can a transaction be reversed after confirmation?"
        ),
        options: [
          pl_en("Tak, w każdej chwili", "Yes, at any time"),
          pl_en("Nie — jest nieodwracalna", "No — it's irreversible"),
          pl_en("Tylko za opłatą", "Only for a fee"),
          pl_en("Tylko w weekendy", "Only on weekends"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Do wysłania transakcji potrzebujesz...",
          "To send a transaction you need..."
        ),
        options: [
          pl_en("Konta w banku", "A bank account"),
          pl_en(
            "Adresu odbiorcy i środków na gas",
            "The recipient address and funds for gas"
          ),
          pl_en("Dowodu osobistego", "A national ID"),
          pl_en("Zgody notariusza", "A notary's approval"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Co to jest adres blockchain?",
          "What is a blockchain address?"
        ),
        options: [
          pl_en("Mieszkanie w Warszawie", "An apartment in Warsaw"),
          pl_en(
            "Publiczny identyfikator konta on-chain",
            "A public on-chain account identifier"
          ),
          pl_en("Numer IP komputera", "A computer's IP address"),
          pl_en("Adres email", "An email address"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Transakcja w statusie 'pending' oznacza...",
          "A transaction in 'pending' state means..."
        ),
        options: [
          pl_en("Została anulowana", "It was cancelled"),
          pl_en(
            "Czeka na potwierdzenie w sieci",
            "It is waiting for network confirmation"
          ),
          pl_en("Nie istnieje", "It doesn't exist"),
          pl_en("Została zwrócona", "It was refunded"),
        ],
        correctIndex: 1,
      },
    ]
  ),
  q(
    "l1-gas",
    1,
    "Co to jest gas fee?",
    "What is a gas fee?",
    100,
    2,
    [
      {
        question: pl_en("Gas fee to...", "A gas fee is..."),
        options: [
          pl_en("Opłata za paliwo samochodowe", "A fuel fee for cars"),
          pl_en(
            "Opłata za wykonanie transakcji w sieci",
            "A fee for executing a transaction on the network"
          ),
          pl_en("Opłata bankowa", "A bank fee"),
          pl_en("Podatek państwowy", "A government tax"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Od czego zależy wysokość gas fee?",
          "What determines the gas fee amount?"
        ),
        options: [
          pl_en("Od pogody", "The weather"),
          pl_en(
            "Od złożoności i ruchu w sieci",
            "Transaction complexity and network congestion"
          ),
          pl_en("Od wieku użytkownika", "User age"),
          pl_en("Od ceny dolara", "The dollar price"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Kto dostaje gas fee?",
          "Who receives the gas fee?"
        ),
        options: [
          pl_en("Google", "Google"),
          pl_en("Walidatorzy / górnicy sieci", "Network validators / miners"),
          pl_en("Rząd", "The government"),
          pl_en("Nikt — jest spalany", "Nobody — it is burned"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Jak zwykle obniżyć gas fee?",
          "How can you usually reduce a gas fee?"
        ),
        options: [
          pl_en(
            "Wysyłać w godzinach szczytu",
            "Send during peak hours"
          ),
          pl_en(
            "Wybrać mniej obciążony moment w sieci",
            "Pick a less busy moment on the network"
          ),
          pl_en("Wymienić komputer", "Replace your computer"),
          pl_en("Zadzwonić do Ethereum", "Call Ethereum"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Na jakiej warstwie gas jest zwykle znacznie tańszy niż Ethereum L1?",
          "Where is gas typically much cheaper than Ethereum L1?"
        ),
        options: [
          pl_en("Na Księżycu", "On the moon"),
          pl_en(
            "Na rozwiązaniach L2 (Base, Arbitrum, Optimism)",
            "On L2 rollups (Base, Arbitrum, Optimism)"
          ),
          pl_en("W banku", "At a bank"),
          pl_en("Nigdzie", "Nowhere"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Co to jest 'gas limit'?",
          "What is a 'gas limit'?"
        ),
        options: [
          pl_en(
            "Maksymalna ilość gazu, którą jesteś gotów zapłacić za transakcję",
            "The maximum amount of gas you're willing to spend on a transaction"
          ),
          pl_en("Limit wieku użytkownika", "A user age limit"),
          pl_en("Limit litrów paliwa", "A fuel volume limit"),
          pl_en("Limit transakcji dziennie", "A daily transaction cap"),
        ],
        correctIndex: 0,
      },
    ]
  ),

  /* ============================================================
     LEVEL 2 QUESTS
     ============================================================ */
  q(
    "l2-defi",
    2,
    "Czym jest DeFi?",
    "What is DeFi?",
    100,
    2,
    [
      {
        question: pl_en("DeFi to...", "DeFi is..."),
        options: [
          pl_en(
            "Tradycyjne finanse z bankiem",
            "Traditional finance with a bank"
          ),
          pl_en(
            "Zdecentralizowane finanse na blockchainie",
            "Decentralised finance on a blockchain"
          ),
          pl_en("Rodzaj giełdy NYSE", "A type of NYSE exchange"),
          pl_en("Fundusz emerytalny", "A pension fund"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Co zastępuje pośrednika w DeFi?",
          "What replaces the middleman in DeFi?"
        ),
        options: [
          pl_en("Smart kontrakty", "Smart contracts"),
          pl_en("Notariusz", "A notary"),
          pl_en("Bank centralny", "The central bank"),
          pl_en("Prawnik", "A lawyer"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Które z tych to aplikacje DeFi?",
          "Which of these are DeFi apps?"
        ),
        options: [
          pl_en("Aave, Uniswap, Compound", "Aave, Uniswap, Compound"),
          pl_en("Facebook, Instagram, TikTok", "Facebook, Instagram, TikTok"),
          pl_en("PKO, Santander, mBank", "PKO, Santander, mBank"),
          pl_en("Netflix, Spotify, YouTube", "Netflix, Spotify, YouTube"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en("TVL w DeFi oznacza...", "TVL in DeFi means..."),
        options: [
          pl_en(
            "Wartość zablokowaną w protokole (Total Value Locked)",
            "Total Value Locked in the protocol"
          ),
          pl_en("Czas do wypłaty", "Time until withdrawal"),
          pl_en("Typ tokena", "A token type"),
          pl_en("Rodzaj audytu", "A type of audit"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Największa zaleta DeFi nad tradycyjnymi finansami?",
          "Biggest advantage of DeFi over traditional finance?"
        ),
        options: [
          pl_en("Wyższe opłaty", "Higher fees"),
          pl_en(
            "Dostępność 24/7 bez pośrednika",
            "24/7 access without a middleman"
          ),
          pl_en("Wolniejsze rozliczenia", "Slower settlement"),
          pl_en("Więcej papierologii", "More paperwork"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "'Non-custodial' znaczy, że...",
          "'Non-custodial' means..."
        ),
        options: [
          pl_en(
            "Ktoś inny trzyma Twoje środki",
            "Someone else holds your funds"
          ),
          pl_en(
            "Ty posiadasz klucze i masz pełną kontrolę",
            "You hold the keys and have full control"
          ),
          pl_en("Zarządza tym państwo", "The state manages it"),
          pl_en("Portfel zawsze offline", "A wallet that is always offline"),
        ],
        correctIndex: 1,
      },
    ]
  ),
  q(
    "l2-dex",
    2,
    "DEX vs CEX",
    "DEX vs CEX",
    100,
    2,
    [
      {
        question: pl_en("DEX to...", "A DEX is..."),
        options: [
          pl_en("Zdecentralizowana giełda", "A decentralised exchange"),
          pl_en("Scentralizowana giełda", "A centralised exchange"),
          pl_en("Bank online", "An online bank"),
          pl_en("Rodzaj tokena", "A kind of token"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Największa różnica między DEX a CEX?",
          "Biggest difference between DEX and CEX?"
        ),
        options: [
          pl_en("Kolor logo", "Logo colour"),
          pl_en(
            "Na DEX trzymasz swoje klucze",
            "On a DEX you keep your own keys"
          ),
          pl_en("CEX są tańsze", "CEX is cheaper"),
          pl_en("Nie ma różnicy", "No difference"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Przykład DEX to...",
          "An example of a DEX is..."
        ),
        options: [
          pl_en("Coinbase", "Coinbase"),
          pl_en("Binance", "Binance"),
          pl_en("Uniswap", "Uniswap"),
          pl_en("PayPal", "PayPal"),
        ],
        correctIndex: 2,
      },
      {
        question: pl_en("AMM w DEX-ach oznacza...", "AMM on DEXes stands for..."),
        options: [
          pl_en("Automated Market Maker", "Automated Market Maker"),
          pl_en("Anti-Money Machine", "Anti-Money Machine"),
          pl_en("Auto-Mined Money", "Auto-Mined Money"),
          pl_en("Asset Management Method", "Asset Management Method"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en("Slippage to...", "Slippage is..."),
        options: [
          pl_en("Typ tokena", "A token type"),
          pl_en(
            "Różnica między oczekiwaną a rzeczywistą ceną wymiany",
            "The difference between the expected and actual swap price"
          ),
          pl_en("Opłata sieci", "A network fee"),
          pl_en("Rodzaj portfela", "A kind of wallet"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Na DEX transakcje wykonują...",
          "On a DEX, transactions are executed by..."
        ),
        options: [
          pl_en("Pracownicy giełdy", "Exchange staff"),
          pl_en("Smart kontrakty", "Smart contracts"),
          pl_en("Prezes giełdy", "The exchange's CEO"),
          pl_en("Bank Rezerw Federalnych", "The Federal Reserve"),
        ],
        correctIndex: 1,
      },
    ]
  ),
  q(
    "l2-yield",
    2,
    "Yield — jak zarabiać?",
    "Yield — how to earn?",
    150,
    3,
    [
      {
        question: pl_en(
          "Yield w DeFi oznacza...",
          "Yield in DeFi means..."
        ),
        options: [
          pl_en("Stratę", "A loss"),
          pl_en(
            "Zwrot z kapitału (odsetki, nagrody)",
            "Return on capital (interest, rewards)"
          ),
          pl_en("Nazwę tokena", "A token's name"),
          pl_en("Podatek", "A tax"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "APY oznacza...",
          "APY stands for..."
        ),
        options: [
          pl_en("Annual Percentage Yield", "Annual Percentage Yield"),
          pl_en("Always Pay Yourself", "Always Pay Yourself"),
          pl_en("Asset Pool Yield", "Asset Pool Yield"),
          pl_en("Active Personal Yield", "Active Personal Yield"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Wysokie APY zwykle oznacza...",
          "Very high APY usually means..."
        ),
        options: [
          pl_en("Zerowe ryzyko", "Zero risk"),
          pl_en("Wyższe ryzyko", "Higher risk"),
          pl_en("Brak dostępu", "No access"),
          pl_en("Spam", "Spam"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en("Staking to...", "Staking is..."),
        options: [
          pl_en("Odlewanie tokenów", "Casting new tokens"),
          pl_en(
            "Blokowanie tokenów dla bezpieczeństwa sieci i nagród",
            "Locking tokens to secure the network and earn rewards"
          ),
          pl_en("Kupowanie tokenów za gotówkę", "Buying tokens with cash"),
          pl_en("Usuwanie tokenów", "Deleting tokens"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Główna różnica między APR a APY?",
          "Main difference between APR and APY?"
        ),
        options: [
          pl_en("Żadna — to to samo", "None — they are the same"),
          pl_en(
            "APY uwzględnia procent składany, APR nie",
            "APY includes compound interest, APR does not"
          ),
          pl_en("APR jest zawsze wyższy", "APR is always higher"),
          pl_en("Różne waluty", "Different currencies"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Która obietnica powinna zapalić czerwoną lampkę?",
          "Which promise should raise a red flag?"
        ),
        options: [
          pl_en("5% APY w stablecoin poolu", "5% APY in a stablecoin pool"),
          pl_en(
            "Historyczny, stabilny zwrot",
            "Historically stable returns"
          ),
          pl_en(
            "Gwarantowane 1000% APY bez ryzyka",
            "Guaranteed 1000% APY with no risk"
          ),
          pl_en("Transparentna tokenomika", "Transparent tokenomics"),
        ],
        correctIndex: 2,
      },
    ]
  ),
  q(
    "l2-liquidity",
    2,
    "Płynność i pule",
    "Liquidity pools",
    150,
    3,
    [
      {
        question: pl_en(
          "Pula płynności to...",
          "A liquidity pool is..."
        ),
        options: [
          pl_en("Basen w hotelu", "A hotel pool"),
          pl_en(
            "Zbiór tokenów używany do handlu na DEX",
            "A collection of tokens used to trade on a DEX"
          ),
          pl_en("Fundusz inwestycyjny", "An investment fund"),
          pl_en("Konto bankowe", "A bank account"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Kto zapewnia płynność puli?",
          "Who provides the liquidity to a pool?"
        ),
        options: [
          pl_en("Rząd", "The government"),
          pl_en("Użytkownicy (liquidity providers)", "Users (liquidity providers)"),
          pl_en("Bank centralny", "The central bank"),
          pl_en("Nikt", "No one"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Co dostają dostawcy płynności?",
          "What do liquidity providers receive?"
        ),
        options: [
          pl_en("Podziękowania", "A thank-you note"),
          pl_en("Część opłat transakcyjnych", "A share of trading fees"),
          pl_en("Diamenty", "Diamonds"),
          pl_en("Akcje giełdowe", "Stock shares"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "LP Token reprezentuje...",
          "An LP token represents..."
        ),
        options: [
          pl_en("Twój udział w puli płynności", "Your share of the liquidity pool"),
          pl_en("NFT psa", "A dog NFT"),
          pl_en("Hasło do konta", "An account password"),
          pl_en("Bilet lotniczy", "A plane ticket"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "W puli AMM stosunek tokenów jest...",
          "In an AMM pool, the token ratio is..."
        ),
        options: [
          pl_en("Stały na zawsze", "Fixed forever"),
          pl_en(
            "Regulowany przez arbitraż i handel",
            "Regulated by arbitrage and trading"
          ),
          pl_en("Ustalany przez rząd", "Set by the government"),
          pl_en("Całkowicie losowy", "Completely random"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Pule z bardzo niskim TVL są...",
          "Pools with very low TVL are..."
        ),
        options: [
          pl_en("Najbezpieczniejsze", "The safest"),
          pl_en(
            "Bardziej podatne na manipulację ceny i duży slippage",
            "More prone to price manipulation and large slippage"
          ),
          pl_en("Zawsze opłacalne", "Always profitable"),
          pl_en("Nieczynne", "Always offline"),
        ],
        correctIndex: 1,
      },
    ]
  ),
  q(
    "l2-smart",
    2,
    "Smart kontrakty",
    "Smart contracts",
    200,
    3,
    [
      {
        question: pl_en(
          "Smart kontrakt to...",
          "A smart contract is..."
        ),
        options: [
          pl_en("Umowa notarialna", "A notarised agreement"),
          pl_en(
            "Program wykonujący się automatycznie na blockchainie",
            "A program that self-executes on the blockchain"
          ),
          pl_en("Dokument papierowy", "A paper document"),
          pl_en("Aplikacja bankowa", "A bank app"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Najpopularniejszy język smart kontraktów to...",
          "The most popular smart-contract language is..."
        ),
        options: [
          pl_en("JavaScript", "JavaScript"),
          pl_en("Python", "Python"),
          pl_en("Solidity", "Solidity"),
          pl_en("Polski", "Polish"),
        ],
        correctIndex: 2,
      },
      {
        question: pl_en(
          "Czy smart kontrakt da się zmienić po wdrożeniu?",
          "Can a smart contract be changed after deployment?"
        ),
        options: [
          pl_en("Tak — kiedy tylko chcę", "Yes — whenever I want"),
          pl_en(
            "Zwykle nie — kod jest niezmienny",
            "Usually not — the code is immutable"
          ),
          pl_en("Tylko w niedzielę", "Only on Sundays"),
          pl_en("Zmienia się sam", "It changes itself"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Na którym blockchainie powstały pierwsze popularne smart kontrakty?",
          "Which blockchain pioneered popular smart contracts?"
        ),
        options: [
          pl_en("Bitcoin", "Bitcoin"),
          pl_en("Ethereum", "Ethereum"),
          pl_en("Dogecoin", "Dogecoin"),
          pl_en("Cardano", "Cardano"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Po co wykonuje się audyty smart kontraktów?",
          "Why are smart-contract audits performed?"
        ),
        options: [
          pl_en("Dla estetyki", "For aesthetics"),
          pl_en(
            "Aby wykryć błędy i podatności zanim stracą użytkownicy",
            "To find bugs and vulnerabilities before users lose funds"
          ),
          pl_en("Dla wzrostu PKB", "To grow GDP"),
          pl_en("Po to by płacić podatki", "In order to pay taxes"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Znanym historycznym atakiem na smart kontrakt jest...",
          "A famous historical smart-contract exploit is..."
        ),
        options: [
          pl_en("Przecena w sklepie", "A store discount"),
          pl_en(
            "Atak na The DAO w 2016 roku",
            "The DAO hack of 2016"
          ),
          pl_en("Bankructwo Lehman Brothers", "Lehman Brothers' bankruptcy"),
          pl_en("Awaria systemu ZUS", "A ZUS system outage"),
        ],
        correctIndex: 1,
      },
    ]
  ),

  /* ============================================================
     LEVEL 3 QUESTS
     ============================================================ */
  q(
    "l3-il",
    3,
    "Impermanent loss",
    "Impermanent loss",
    200,
    3,
    [
      {
        question: pl_en(
          "Impermanent loss dotyczy...",
          "Impermanent loss affects..."
        ),
        options: [
          pl_en("Stakerów", "Stakers"),
          pl_en("Dostawców płynności", "Liquidity providers"),
          pl_en("Górników", "Miners"),
          pl_en("Wszystkich użytkowników", "All users"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Impermanent loss zdarza się, gdy...",
          "Impermanent loss happens when..."
        ),
        options: [
          pl_en(
            "Ceny tokenów w puli zmienią się",
            "Prices of pool tokens change"
          ),
          pl_en("Rośnie gas fee", "Gas fee rises"),
          pl_en("Pada deszcz", "It rains"),
          pl_en("Zamyka się giełda", "The exchange closes"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Czy IL może zostać wyrównany?",
          "Can IL be offset?"
        ),
        options: [
          pl_en("Tak — opłatami transakcyjnymi z puli", "Yes — by pool trading fees"),
          pl_en("Nigdy", "Never"),
          pl_en("Tylko przez sąd", "Only via court"),
          pl_en("Przez modlitwę", "Through prayer"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Dlaczego IL jest 'impermanent'?",
          "Why is IL called 'impermanent'?"
        ),
        options: [
          pl_en("Bo zawsze znika", "Because it always disappears"),
          pl_en(
            "Bo może zniknąć, jeśli ceny wrócą do wartości początkowych",
            "Because it can vanish if prices return to their starting values"
          ),
          pl_en("Bo zakazał go rząd", "Because the government banned it"),
          pl_en("Bo nie istnieje", "Because it doesn't exist"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "IL jest największy, gdy...",
          "IL is largest when..."
        ),
        options: [
          pl_en("Ceny są stabilne", "Prices are stable"),
          pl_en(
            "Jedna cena mocno rośnie lub spada względem drugiej",
            "One price moves sharply up or down relative to the other"
          ),
          pl_en("Nie ma handlu w puli", "There is no trading in the pool"),
          pl_en("Token zmienia nazwę", "The token is renamed"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Jak ograniczyć ekspozycję na IL?",
          "How can you reduce IL exposure?"
        ),
        options: [
          pl_en(
            "Używając pul stablecoin–stablecoin (np. USDC/DAI)",
            "By using stablecoin–stablecoin pools (e.g. USDC/DAI)"
          ),
          pl_en("Wybierając memecoin pule", "By picking memecoin pools"),
          pl_en("Dodając więcej dźwigni", "By adding more leverage"),
          pl_en("Usuwając portfel", "By deleting the wallet"),
        ],
        correctIndex: 0,
      },
    ]
  ),
  q(
    "l3-rwa",
    3,
    "Real World Assets",
    "Real World Assets",
    250,
    3,
    [
      {
        question: pl_en(
          "RWA w krypto to...",
          "RWA in crypto is..."
        ),
        options: [
          pl_en("Tokenizacja aktywów z realnego świata", "Tokenisation of real-world assets"),
          pl_en("Nowy blockchain", "A new blockchain"),
          pl_en("Rodzaj portfela", "A type of wallet"),
          pl_en("Podatek", "A tax"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Przykład RWA to...",
          "An example of RWA is..."
        ),
        options: [
          pl_en(
            "Tokenizowane obligacje skarbowe",
            "Tokenised treasury bonds"
          ),
          pl_en("Mem w internecie", "An internet meme"),
          pl_en("Zdjęcie psa", "A dog photo"),
          pl_en("Plik MP3", "An MP3 file"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Zaletą RWA jest...",
          "A benefit of RWA is..."
        ),
        options: [
          pl_en("Większa dostępność i płynność", "Greater access and liquidity"),
          pl_en("Brak regulacji", "No regulation"),
          pl_en("Nielimitowana emisja", "Unlimited issuance"),
          pl_en("Brak ryzyka", "No risk"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Główna korzyść dla inwestora tradycyjnego?",
          "The main benefit for a traditional investor?"
        ),
        options: [
          pl_en(
            "Dostęp do większej liczby aktywów 24/7 z mniejszymi progami",
            "Access to more assets 24/7 with lower entry thresholds"
          ),
          pl_en("Całkowity brak regulacji", "Total deregulation"),
          pl_en("Stuprocentowa anonimowość", "100% anonymity"),
          pl_en("Brak opodatkowania", "No taxation"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Kto zwykle tokenizuje obligacje?",
          "Who typically tokenises bonds?"
        ),
        options: [
          pl_en("Użytkownicy anonimowych forów", "Anonymous forum users"),
          pl_en(
            "Regulowane instytucje finansowe",
            "Regulated financial institutions"
          ),
          pl_en("Twórcy memów", "Meme creators"),
          pl_en("Artyści NFT", "NFT artists"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Największe ryzyko RWA to...",
          "The biggest risk of RWA is..."
        ),
        options: [
          pl_en("Zbyt niskie APY", "APY being too low"),
          pl_en(
            "Ryzyko emitenta (off-chain) i regulacyjne",
            "Issuer (off-chain) and regulatory risk"
          ),
          pl_en("Brak memów", "A shortage of memes"),
          pl_en("Za mały wybór kolorów", "Too few colour options"),
        ],
        correctIndex: 1,
      },
    ]
  ),
  q(
    "l3-risk",
    3,
    "Jak ocenić ryzyko?",
    "How to assess risk?",
    300,
    3,
    [
      {
        question: pl_en(
          "Co warto sprawdzić przed inwestycją w protokół DeFi?",
          "What should you check before investing in a DeFi protocol?"
        ),
        options: [
          pl_en("Audyty smart kontraktów", "Smart contract audits"),
          pl_en("Kolor logo", "Logo colour"),
          pl_en("Imię założyciela", "Founder's first name"),
          pl_en("Nic — wchodzę all-in", "Nothing — I go all in"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "TVL to...",
          "TVL stands for..."
        ),
        options: [
          pl_en("Total Value Locked", "Total Value Locked"),
          pl_en("Top Verified Ledger", "Top Verified Ledger"),
          pl_en("Trade Volume Limit", "Trade Volume Limit"),
          pl_en("Token Validity Level", "Token Validity Level"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Diversyfikacja to...",
          "Diversification is..."
        ),
        options: [
          pl_en(
            "Rozkładanie ryzyka między aktywami",
            "Spreading risk across multiple assets"
          ),
          pl_en("Wkładanie wszystkiego w jeden token", "Putting everything into one token"),
          pl_en("Ignorowanie ryzyka", "Ignoring risk"),
          pl_en("Sprzedawanie na stracie", "Selling at a loss"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Który polski regulator zajmuje się nadzorem rynku finansowego?",
          "Which Polish regulator oversees the financial market?"
        ),
        options: [
          pl_en("ZUS", "ZUS"),
          pl_en("KNF (Komisja Nadzoru Finansowego)", "KNF (Polish FSA)"),
          pl_en("MSZ", "MSZ"),
          pl_en("Lasy Państwowe", "State Forests"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Rozsądna zasada 'position sizing' to...",
          "A sensible 'position sizing' rule is..."
        ),
        options: [
          pl_en("Wszystko na jedną kartę", "All in on one bet"),
          pl_en(
            "Inwestuj tylko tyle, ile jesteś w stanie stracić",
            "Invest only what you can afford to lose"
          ),
          pl_en("Zawsze na kredyt", "Always on credit"),
          pl_en("Minimum 50% portfela w jednym tokenie", "Minimum 50% of portfolio in one token"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Wiarygodne źródła audytów smart kontraktów to...",
          "Reputable sources for smart-contract audits are..."
        ),
        options: [
          pl_en("Anonimowe konta na X", "Anonymous accounts on X"),
          pl_en(
            "Renomowane firmy: OpenZeppelin, CertiK, Trail of Bits",
            "Reputable firms: OpenZeppelin, CertiK, Trail of Bits"
          ),
          pl_en("Losowe TikToki", "Random TikToks"),
          pl_en("Grupa na Telegramie", "A Telegram group"),
        ],
        correctIndex: 1,
      },
    ]
  ),
  q(
    "l3-rug",
    3,
    "Rug pull — jak rozpoznać?",
    "Rug pull — how to spot one?",
    300,
    3,
    [
      {
        question: pl_en(
          "Rug pull to...",
          "A rug pull is..."
        ),
        options: [
          pl_en(
            "Oszustwo, gdy twórcy wyciągają płynność",
            "A scam where creators drain the liquidity"
          ),
          pl_en("Rodzaj stakingu", "A kind of staking"),
          pl_en("Nowy token", "A new token"),
          pl_en("Polityka rządu", "A government policy"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Czerwona flaga rug pulla to...",
          "A red flag of a rug pull is..."
        ),
        options: [
          pl_en("Anonimowy zespół bez audytu", "Anonymous team with no audit"),
          pl_en("Duży TVL i audyty", "Large TVL and audits"),
          pl_en("Otwarty kod", "Open source code"),
          pl_en("Transparentne tokenomics", "Transparent tokenomics"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Jak się chronić?",
          "How do you protect yourself?"
        ),
        options: [
          pl_en(
            "DYOR — Do Your Own Research",
            "DYOR — Do Your Own Research"
          ),
          pl_en("Inwestować od razu", "Invest instantly"),
          pl_en("Kopiować nieznanych influencerów", "Copy unknown influencers"),
          pl_en("Ignorować audyty", "Ignore audits"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Rug pull najczęściej dotyczy...",
          "Rug pulls most often affect..."
        ),
        options: [
          pl_en(
            "Dużych, audytowanych protokołów z długą historią",
            "Large, audited protocols with long track records"
          ),
          pl_en(
            "Nowych, nieaudytowanych memecoinów",
            "New, unaudited memecoins"
          ),
          pl_en("Bitcoina", "Bitcoin"),
          pl_en("Euro", "The euro"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "'Soft rug' to...",
          "A 'soft rug' is..."
        ),
        options: [
          pl_en("Rodzaj NFT", "A type of NFT"),
          pl_en(
            "Stopniowe porzucanie projektu przez zespół",
            "A team slowly abandoning the project"
          ),
          pl_en("Delikatne ogłoszenie partnerstwa", "A soft partnership announcement"),
          pl_en("Dywan z IKEA", "A rug from IKEA"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Do weryfikacji tokena przydają się m.in...",
          "Useful tools to verify a token include..."
        ),
        options: [
          pl_en("Google Docs", "Google Docs"),
          pl_en(
            "Etherscan, DEXScreener, raporty audytów",
            "Etherscan, DEXScreener, audit reports"
          ),
          pl_en("Wikipedia i nic więcej", "Wikipedia only"),
          pl_en("Archiwum Allegro", "The Allegro archive"),
        ],
        correctIndex: 1,
      },
    ]
  ),
  q(
    "l3-boss",
    3,
    "Wyzwanie Skarbnika",
    "Skarbnik Challenge",
    500,
    3,
    [
      {
        question: pl_en(
          "Prawdziwa decentralizacja wymaga...",
          "True decentralisation requires..."
        ),
        options: [
          pl_en("Wielu niezależnych walidatorów", "Many independent validators"),
          pl_en("Jednego dużego providera", "One big provider"),
          pl_en("Zarządu spółki", "A board of directors"),
          pl_en("Centralnego serwera", "A central server"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Cold wallet to...",
          "A cold wallet is..."
        ),
        options: [
          pl_en(
            "Portfel offline, bezpieczniejszy od hot",
            "An offline wallet, safer than a hot wallet"
          ),
          pl_en("Portfel z Bitcoinem tylko", "A BTC-only wallet"),
          pl_en("Portfel w Antarktyce", "A wallet in Antarctica"),
          pl_en("Zmrożone konto", "A frozen account"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "Najważniejsza zasada DYOR to...",
          "The most important DYOR rule is..."
        ),
        options: [
          pl_en(
            "Nigdy nie inwestuj więcej niż możesz stracić",
            "Never invest more than you can lose"
          ),
          pl_en("Zawsze wchodź z dźwignią 100x", "Always use 100x leverage"),
          pl_en("Słuchaj tylko influencerów", "Only listen to influencers"),
          pl_en("Ignoruj ryzyko", "Ignore the risk"),
        ],
        correctIndex: 0,
      },
      {
        question: pl_en(
          "BLIK to typowo...",
          "BLIK is typically..."
        ),
        options: [
          pl_en("Kryptowaluta", "A cryptocurrency"),
          pl_en(
            "Polski system płatności mobilnych",
            "A Polish mobile payment system"
          ),
          pl_en("Giełda DEX", "A DEX"),
          pl_en("Rozwiązanie L2", "An L2 rollup"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Portfel wielopodpisowy (multisig)...",
          "A multisig wallet..."
        ),
        options: [
          pl_en("Wymaga tylko jednego podpisu", "Needs just one signature"),
          pl_en(
            "Wymaga wielu podpisów do zatwierdzenia transakcji",
            "Requires multiple signatures to approve a transaction"
          ),
          pl_en("Nie istnieje", "Does not exist"),
          pl_en("Działa tylko z Bitcoinem", "Only works with Bitcoin"),
        ],
        correctIndex: 1,
      },
      {
        question: pl_en(
          "Ostateczna złota zasada Skarbnika to...",
          "Skarbnik's ultimate golden rule is..."
        ),
        options: [
          pl_en("Kup wszystko co widzisz", "Buy everything you see"),
          pl_en(
            "Zawsze DYOR i bezpieczeństwo przede wszystkim",
            "Always DYOR and security first"
          ),
          pl_en("Podążaj za FOMO", "Follow the FOMO"),
          pl_en("Nie włączaj 2FA", "Skip 2FA"),
        ],
        correctIndex: 1,
      },
    ]
  ),
];

export function getQuestsByLevel(level: 1 | 2 | 3): Quest[] {
  return QUESTS.filter((q) => q.level === level);
}

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function questTitle(q: Quest, lang: Lang): string {
  return lang === "pl" ? q.titlePl : q.titleEn;
}

/* ==============================================================
   SEQUENTIAL-UNLOCK HELPERS

   Unlock rule: a quest is playable when *its predecessor* in the
   flat QUESTS array is complete. The first quest is always open.

   Why not gate by user level? The L1 XP total (350) is below the
   L2 threshold (500), so level-based locking would trap players
   after finishing Level 1 — they'd need extra XP from elsewhere
   to see any L2 quest. Chaining by completion avoids that cliff
   and matches the Duolingo-style mental model the chapter path
   already teaches visually.
   ============================================================== */

/** Returns the id of the quest immediately before `questId`, or null
 *  if `questId` is the first entry (or unknown). */
export function getPreviousQuestId(questId: string): string | null {
  const idx = QUESTS.findIndex((q) => q.id === questId);
  if (idx <= 0) return null;
  return QUESTS[idx - 1].id;
}

/** True iff `questId` is playable given the set of already-completed
 *  quest ids. The first quest is always unlocked. Unknown ids return
 *  false so a stray URL can't bypass the gate. */
export function isQuestUnlocked(
  questId: string,
  completedQuests: readonly string[]
): boolean {
  const idx = QUESTS.findIndex((q) => q.id === questId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  const prev = QUESTS[idx - 1];
  return completedQuests.includes(prev.id);
}

/* ==============================================================
   LEVEL / XP HELPERS
   ============================================================== */
// Level thresholds (cumulative total XP required to reach a level).
// L1: 0 XP, L2: 500 XP, L3: 1500 XP, MAX: 3000 XP.
export const LEVEL_THRESHOLDS = [0, 500, 1500, 3000] as const;

export function xpProgress(totalXp: number): {
  level: 1 | 2 | 3 | 4;
  into: number;
  needed: number;
  percent: number;
} {
  let level: 1 | 2 | 3 | 4 = 1;
  if (totalXp >= 3000) level = 4;
  else if (totalXp >= 1500) level = 3;
  else if (totalXp >= 500) level = 2;
  else level = 1;

  if (level === 4) {
    return { level, into: totalXp - 3000, needed: 0, percent: 100 };
  }
  const lower = LEVEL_THRESHOLDS[level - 1];
  const upper = LEVEL_THRESHOLDS[level];
  const into = totalXp - lower;
  const needed = upper - lower;
  const percent = Math.min(100, Math.round((into / needed) * 100));
  return { level, into, needed, percent };
}

export function levelNameKey(level: 1 | 2 | 3 | 4): "levelGreen" | "levelSilver" | "levelGold" {
  if (level <= 1) return "levelGreen";
  if (level === 2) return "levelSilver";
  return "levelGold";
}
