#!/usr/bin/env node
/**
 * fetch_alerts.js
 *
 * Unified security alerts pipeline — fetches from three sources, filters
 * through Grok LLM for relevance (banking/DeFi/financial fraud only),
 * then inserts summarised alerts into Supabase scam_alerts.
 *
 * Sources:
 *   1. CERT.PL RSS  (web2)   — https://moje.cert.pl/advisory_feed/advisory/feed/
 *   2. Niebezpiecznik RSS (web2) — https://niebezpiecznik.pl/feed/
 *   3. Twitter via Grok search (web3) — @PeckShieldAlert, @zachxbt + topic search
 *
 * Usage:
 *   node scripts/fetch_alerts.js                   # all sources
 *   node scripts/fetch_alerts.js --source=twitter   # twitter only
 *   node scripts/fetch_alerts.js --source=cert      # CERT.PL only
 *   node scripts/fetch_alerts.js --source=niebezpiecznik
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});
const { createClient } = require("@supabase/supabase-js");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

const XAI_API_KEY = process.env.XAI_API_KEY;
if (!XAI_API_KEY) {
  console.error("❌ Missing XAI_API_KEY in .env.local");
  process.exit(1);
}

const GROK_MODEL = "grok-4-1-fast-reasoning";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal XML → items extractor. Avoids large XML deps — our feeds are
 * simple RSS 2.0 with <item> elements.
 */
function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const tag = (name) => {
      const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
      return m ? m[1].trim().replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "") : "";
    };
    items.push({
      title: tag("title"),
      link: tag("link") || tag("guid"),
      description: tag("description").replace(/<[^>]+>/g, " ").slice(0, 1500),
      pubDate: tag("pubDate"),
    });
  }
  return items;
}

/**
 * Call Grok to determine relevance and generate summary if relevant.
 */
async function filterAndSummarise(article) {
  const prompt = `Przeanalizuj poniższy artykuł/alert bezpieczeństwa.

TYTUŁ: ${article.title}
TREŚĆ: ${article.description}
ŹRÓDŁO: ${article.source_name}
DATA: ${article.pubDate || "brak"}

Zdecyduj: czy ten artykuł jest związany z JEDNYM z poniższych tematów?
- Bankowość internetowa i mobilna (ataki phishingowe na banki, wyłudzenia danych bankowych)
- Kryptowaluty i DeFi (hacki, rug pulle, scamy, malware kradnące krypto)
- Bezpieczeństwo portfeli cyfrowych (hardware wallet, software wallet)
- Oszustwa finansowe online (wyłudzenia pieniędzy, fałszywe inwestycje)
- Ataki na giełdy i platformy finansowe
- Malware kradnące dane finansowe lub kryptowaluty

Rzeczy które NIE są relevant (odrzuć):
- Ogólne konferencje IT (np. "Admin Days")
- Ataki na autonomiczne taksówki, Stravę, blokady alkoholowe itp.
- Geopolityka (Rosja, Ukraina) chyba że bezpośrednio dotyczy kradzieży krypto
- Artykuły będące wyłącznie reklamą szkoleń

Jeśli artykuł NIE jest relevant — odpowiedz TYLKO: {"relevant": false}

Jeśli TAK — odpowiedz TYLKO czystym JSON-em (bez markdown, bez \`\`\`):
{
  "relevant": true,
  "category": "web2 lub web3 (web3 jeśli dotyczy krypto/DeFi, web2 jeśli dotyczy bankowości/tradycyjnych finansów)",
  "title_pl": "Krótki chwytliwy tytuł po polsku (max 80 znaków)",
  "title_en": "Short catchy English title (max 80 chars)",
  "summary_pl": "2-3 zdania podsumowania po polsku. Co się stało i dlaczego to ważne.",
  "summary_en": "2-3 sentence summary in English.",
  "threat_type": "phishing|hack|rug_pull|social_engineering|fake_wallet|malware|scam|supply_chain",
  "severity": "low|medium|high|critical",
  "protection_tips_pl": "• Porada 1\\n• Porada 2\\n• Porada 3",
  "protection_tips_en": "• Tip 1\\n• Tip 2\\n• Tip 3"
}`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok API error: ${res.status} – ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    console.warn("⚠️  Could not parse Grok response:", raw?.slice(0, 200));
    return { relevant: false };
  }
}

// ---------------------------------------------------------------------------
// Source 1: CERT.PL
// ---------------------------------------------------------------------------

async function fetchCertPL() {
  console.log("\n📥 [CERT.PL] Pobieranie feedu RSS...");
  try {
    const res = await fetch("https://moje.cert.pl/advisory_feed/advisory/feed/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseRssItems(xml);
    console.log(`   Znaleziono ${items.length} artykułów`);
    return items.map((item) => ({
      ...item,
      source_name: "cert_pl",
      source_url: item.link,
    }));
  } catch (err) {
    console.error("❌ [CERT.PL] Błąd:", err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source 2: Niebezpiecznik
// ---------------------------------------------------------------------------

async function fetchNiebezpiecznik() {
  console.log("\n📥 [Niebezpiecznik] Pobieranie feedu RSS...");
  try {
    const res = await fetch("https://niebezpiecznik.pl/feed/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseRssItems(xml);
    console.log(`   Znaleziono ${items.length} artykułów`);
    return items.map((item) => ({
      ...item,
      source_name: "niebezpiecznik",
      source_url: item.link,
    }));
  } catch (err) {
    console.error("❌ [Niebezpiecznik] Błąd:", err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source 3: Twitter via Grok search
// ---------------------------------------------------------------------------

async function fetchTwitterAlerts() {
  console.log("\n📥 [Twitter/Grok] Wyszukiwanie alertów krypto...");
  try {
    const prompt = `Search Twitter/X for the most important DeFi and crypto security alerts from the last 24 hours. Focus on:
- Tweets from @PeckShieldAlert, @zachxbt, @SlowMist_Team, @CertiKAlert
- Any major DeFi hack, exploit, rug pull, or scam reported in the last 24h
- Include the tweet URL/link for each finding

Return ONLY a JSON array (no markdown, no \`\`\`). Each element:
{
  "title": "Short description of the incident",
  "description": "2-3 sentence summary of what happened",
  "source_url": "https://x.com/... (direct tweet link if available, otherwise best source link)",
  "pubDate": "approximate date/time",
  "severity": "low|medium|high|critical",
  "amount_lost_usd": null or number
}

If there are no significant incidents in the last 24h, return an empty array: []`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Grok API error: ${res.status} – ${err}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();

    let tweets;
    try {
      tweets = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) tweets = JSON.parse(match[0]);
      else {
        console.warn("⚠️  Could not parse Grok Twitter response");
        return [];
      }
    }

    if (!Array.isArray(tweets)) return [];

    console.log(`   Znaleziono ${tweets.length} alertów z Twittera`);
    return tweets.map((t) => ({
      title: t.title || "Crypto Alert",
      description: t.description || t.title || "",
      source_url: t.source_url || null,
      pubDate: t.pubDate || new Date().toISOString(),
      source_name: "twitter",
      // Twitter alerts are pre-filtered for crypto, so they're already relevant
      _prefiltered: true,
      _severity: t.severity || "medium",
      _amount: t.amount_lost_usd || null,
    }));
  } catch (err) {
    console.error("❌ [Twitter/Grok] Błąd:", err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Process Twitter alerts (already filtered by Grok search, just need summary)
// ---------------------------------------------------------------------------

async function summariseTwitterAlert(article) {
  const prompt = `Podsumuj poniższe zdarzenie bezpieczeństwa krypto/DeFi.

TYTUŁ: ${article.title}
TREŚĆ: ${article.description}

Odpowiedz TYLKO czystym JSON-em (bez markdown, bez \`\`\`):
{
  "title_pl": "Krótki chwytliwy tytuł po polsku (max 80 znaków)",
  "title_en": "Short catchy English title (max 80 chars)",
  "summary_pl": "2-3 zdania podsumowania po polsku.",
  "summary_en": "2-3 sentence summary in English.",
  "threat_type": "phishing|hack|rug_pull|social_engineering|fake_wallet|malware|scam|supply_chain",
  "severity": "${article._severity || "medium"}",
  "protection_tips_pl": "• Porada 1\\n• Porada 2\\n• Porada 3",
  "protection_tips_en": "• Tip 1\\n• Tip 2\\n• Tip 3"
}`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.2,
    }),
  });

  if (!res.ok) throw new Error(`Grok API error: ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse Twitter summary");
  }
}

// ---------------------------------------------------------------------------
// Dedup helper
// ---------------------------------------------------------------------------

async function isDuplicate(sourceUrl, titleFragment) {
  if (sourceUrl) {
    const { data } = await supabase
      .from("scam_alerts")
      .select("id")
      .eq("source_url", sourceUrl)
      .limit(1);
    if (data && data.length > 0) return true;
  }
  if (titleFragment && titleFragment.length > 10) {
    const { data } = await supabase
      .from("scam_alerts")
      .select("id")
      .or(`title_pl.ilike.%${titleFragment.slice(0, 40)}%,title_en.ilike.%${titleFragment.slice(0, 40)}%`)
      .limit(1);
    if (data && data.length > 0) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main() {
  const sourceArg = process.argv.find((a) => a.startsWith("--source="));
  const sourceFilter = sourceArg ? sourceArg.split("=")[1] : "all";

  console.log("🔍 Skarbnik Alert Pipeline");
  console.log(`   Źródło: ${sourceFilter}`);
  console.log(`   Model: ${GROK_MODEL}\n`);

  let articles = [];

  // Collect from sources
  if (sourceFilter === "all" || sourceFilter === "cert") {
    articles.push(...(await fetchCertPL()));
  }
  if (sourceFilter === "all" || sourceFilter === "niebezpiecznik") {
    articles.push(...(await fetchNiebezpiecznik()));
  }
  if (sourceFilter === "all" || sourceFilter === "twitter") {
    articles.push(...(await fetchTwitterAlerts()));
  }

  console.log(`\n📊 Łącznie ${articles.length} artykułów do przetworzenia.\n`);

  let inserted = 0;
  let filtered = 0;
  let skipped = 0;

  for (const article of articles) {
    // Check dedup
    const dup = await isDuplicate(article.source_url, article.title);
    if (dup) {
      console.log(`⏭️  Duplikat: ${article.title?.slice(0, 60)}...`);
      skipped++;
      continue;
    }

    try {
      let summary;

      if (article._prefiltered) {
        // Twitter alerts are already relevant (Grok search filtered them)
        console.log(`🐦 [Twitter] Summing up: ${article.title?.slice(0, 60)}...`);
        summary = await summariseTwitterAlert(article);
        summary.category = "web3";
      } else {
        // RSS articles need LLM relevance check
        console.log(`🤖 Filtrowanie: ${article.title?.slice(0, 60)}...`);
        summary = await filterAndSummarise(article);

        if (!summary.relevant) {
          console.log(`   ❌ Odrzucone (nie dotyczy finansów/krypto)`);
          filtered++;
          continue;
        }
        console.log(`   ✅ Relevant → ${summary.category} / ${summary.threat_type}`);
      }

      // Insert into Supabase
      const { error } = await supabase.from("scam_alerts").insert({
        title_pl: summary.title_pl,
        title_en: summary.title_en || null,
        summary_pl: summary.summary_pl,
        summary_en: summary.summary_en || null,
        threat_type: summary.threat_type || "scam",
        severity: summary.severity || "medium",
        source_url: article.source_url || null,
        amount_lost_usd: article._amount || null,
        protection_tips_pl: summary.protection_tips_pl || null,
        protection_tips_en: summary.protection_tips_en || null,
        category: summary.category || "web2",
        source_name: article.source_name,
        active: true,
      });

      if (error) {
        console.error(`   ❌ Błąd zapisu:`, error.message);
      } else {
        console.log(`   💾 Zapisано: ${summary.title_pl}`);
        inserted++;
      }

      // Rate limit pause
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err) {
      console.error(`   ❌ Błąd przetwarzania: ${err.message}`);
    }
  }

  console.log(`\n📋 Podsumowanie:`);
  console.log(`   ✅ Nowych alertów: ${inserted}`);
  console.log(`   ❌ Odfiltrowanych (nie-finansowe): ${filtered}`);
  console.log(`   ⏭️  Duplikatów: ${skipped}`);
}

main().catch(console.error);
