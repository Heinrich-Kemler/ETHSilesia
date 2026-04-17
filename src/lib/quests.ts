/**
 * Centralised quest catalogue. All quest data, metadata, and questions
 * live here so pages can import them without the server.
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
  questions: [QuizQuestion, QuizQuestion, QuizQuestion];
};

function pl_en(pl: string, en: string): QuizOption {
  return { pl, en };
}

/** Helper to make a 3-question quest. */
function q(
  id: string,
  level: 1 | 2 | 3,
  titlePl: string,
  titleEn: string,
  xp: number,
  stars: 1 | 2 | 3,
  questions: [QuizQuestion, QuizQuestion, QuizQuestion]
): Quest {
  return { id, level, titlePl, titleEn, xp, stars, questions };
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
