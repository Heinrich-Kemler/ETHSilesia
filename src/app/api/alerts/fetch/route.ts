import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 120; // RSS + LLM calls can take a minute

/**
 * GET /api/alerts/fetch
 *
 * Triggered by Vercel Cron (which uses GET) or manually. Fetches alerts
 * from external sources, filters via Grok LLM, and inserts relevant
 * ones into Supabase.
 *
 * Secured by CRON_SECRET — Vercel automatically sends this header
 * for scheduled cron jobs.
 *
 * Query params:
 *   ?source=twitter|cert|niebezpiecznik|all (default: all)
 */

const XAI_API_KEY = process.env.XAI_API_KEY;
const GROK_MODEL = "grok-4-1-fast-reasoning";

// ---------------------------------------------------------------------------
// RSS Parser (same as in scripts/fetch_alerts.js)
// ---------------------------------------------------------------------------

function parseRssItems(xml: string) {
  const items: {
    title: string;
    link: string;
    description: string;
    pubDate: string;
  }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const tag = (name: string) => {
      const m = block.match(
        new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"),
      );
      return m
        ? m[1]
            .trim()
            .replace(/^<!\[CDATA\[/, "")
            .replace(/\]\]>$/, "")
        : "";
    };
    items.push({
      title: tag("title"),
      link: tag("link") || tag("guid"),
      description: tag("description")
        .replace(/<[^>]+>/g, " ")
        .slice(0, 1500),
      pubDate: tag("pubDate"),
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Grok helpers
// ---------------------------------------------------------------------------

async function callGrok(
  messages: { role: string; content: string }[],
  maxTokens = 800,
) {
  if (!XAI_API_KEY) throw new Error("Missing XAI_API_KEY");
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

function parseJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/[\[{][\s\S]*[\]}]/);
    if (m) return JSON.parse(m[0]);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Relevance filter prompt
// ---------------------------------------------------------------------------

async function filterArticle(
  title: string,
  description: string,
  sourceName: string,
) {
  const prompt = `Przeanalizuj artykuł bezpieczeństwa.

TYTUŁ: ${title}
TREŚĆ: ${description.slice(0, 1200)}
ŹRÓDŁO: ${sourceName}

Czy dotyczy: oszustw internetowych, bankowości, oszustw finansowych, kryptowalut, DeFi, portfeli cyfrowych, malware kradnącego pieniądze/krypto?
Odrzuć: konferencje IT, autonomiczne pojazdy, geopolitykę, reklamy szkoleń.

WYTYCZNE: Pisz językiem w 100% profesjonalnym, oficjalnym, bankowym. ZAKAZ slangu ("legitny", "apka", "scam" -> zastąp: "autentyczny", "aplikacja", "oszustwo"). Jesteś analitykiem ds. bezpieczeństwa instytucji finansowej.

Jeśli NIE relevant: {"relevant": false}
Jeśli TAK (TYLKO czysty JSON):
{
  "relevant": true,
  "category": "web2 lub web3",
  "title_pl": "max 80 znaków",
  "title_en": "max 80 chars",
  "summary_pl": "2-3 zdania",
  "summary_en": "2-3 sentences",
  "threat_type": "phishing|hack|rug_pull|social_engineering|fake_wallet|malware|scam|supply_chain",
  "severity": "low|medium|high|critical",
  "protection_tips_pl": "• Porada 1\\n• Porada 2",
  "protection_tips_en": "• Tip 1\\n• Tip 2"
}`;
  const raw = await callGrok([{ role: "user", content: prompt }]);
  return parseJson(raw) ?? { relevant: false };
}

// ---------------------------------------------------------------------------
// Crypto News via RSS (Cointelegraph)
// ---------------------------------------------------------------------------

async function fetchCryptoRss() {
  try {
    const res = await fetch("https://cointelegraph.com/rss");
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRssItems(xml);
    return items.map((i) => ({
      title: i.title,
      description: i.description,
      source_url: i.link,
      source_name: "cointelegraph",
      pubDate: i.pubDate,
    }));
  } catch (e) {
    return [];
  }
}

async function summariseCryptoArticle(title: string, description: string) {
  const prompt = `Podsumuj zdarzenie krypto/DeFi ("hack", "scam", "exploit"). Jeśli artykuł NIE dotyczy ataku czy oszustwa (np. to zwykły news o rynku), zwróć {"relevant": false}. Jesteś starszym analitykiem ds. bezpieczeństwa wielkiego banku. Pisz PROFESJONALNIE, poważnie i oficjalnie. ZAKAZ używania slangu i potocyzmów. TYTUŁ: ${title} TREŚĆ: ${description}
Odpowiedz TYLKO JSON:
{"relevant":true, "title_pl":"...","title_en":"...","summary_pl":"...","summary_en":"...","threat_type":"hack|scam|rug_pull|phishing|malware|supply_chain","severity":"medium|high|critical","protection_tips_pl":"• ...","protection_tips_en":"• ..."}`;
  const raw = await callGrok([{ role: "user", content: prompt }], 600);
  return parseJson(raw);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Auth: Vercel sends Authorization header for cron, or check CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") ?? "all";

  const supabase = getSupabaseAdminClient();
  const results = { inserted: 0, filtered: 0, skipped: 0, errors: 0 };
  const logs: string[] = [];

  const log = (msg: string) => {
    logs.push(msg);
    console.log(msg);
  };

  try {
    // --- RSS sources (cert, niebezpiecznik) ---
    type RssArticle = {
      title: string;
      description: string;
      source_url: string;
      source_name: string;
      pubDate: string;
    };
    const rssArticles: RssArticle[] = [];

    if (source === "all" || source === "cert") {
      log("[CERT.PL] Fetching...");
      const res = await fetch(
        "https://moje.cert.pl/advisory_feed/advisory/feed/",
      );
      if (res.ok) {
        const items = parseRssItems(await res.text());
        rssArticles.push(
          ...items.map((i) => ({
            ...i,
            source_url: i.link,
            source_name: "cert_pl",
          })),
        );
        log(`[CERT.PL] ${items.length} items`);
      }
    }

    if (source === "all" || source === "niebezpiecznik") {
      log("[Niebezpiecznik] Fetching...");
      const res = await fetch("https://niebezpiecznik.pl/feed/");
      if (res.ok) {
        const items = parseRssItems(await res.text());
        rssArticles.push(
          ...items.map((i) => ({
            ...i,
            source_url: i.link,
            source_name: "niebezpiecznik",
          })),
        );
        log(`[Niebezpiecznik] ${items.length} items`);
      }
    }

    // Process RSS articles through LLM filter
    for (const art of rssArticles) {
      // Dedup
      if (art.source_url) {
        const { data: existing } = await supabase
          .from("scam_alerts")
          .select("id")
          .eq("source_url", art.source_url)
          .limit(1);
        if (existing && existing.length > 0) {
          results.skipped++;
          continue;
        }
      }

      try {
        const summary = await filterArticle(
          art.title,
          art.description,
          art.source_name,
        );
        if (!summary.relevant) {
          results.filtered++;
          continue;
        }

        const { error } = await supabase.from("scam_alerts").insert({
          title_pl: summary.title_pl,
          title_en: summary.title_en || null,
          summary_pl: summary.summary_pl,
          summary_en: summary.summary_en || null,
          threat_type: summary.threat_type || "scam",
          severity: summary.severity || "medium",
          source_url: art.source_url || null,
          protection_tips_pl: summary.protection_tips_pl || null,
          protection_tips_en: summary.protection_tips_en || null,
          category: summary.category || "web2",
          source_name: art.source_name,
          active: true,
        });
        if (error) {
          log(`DB error: ${error.message}`);
          results.errors++;
        } else {
          results.inserted++;
          log(`Inserted: ${summary.title_pl}`);
        }
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {
        log(`Error: ${e instanceof Error ? e.message : "unknown"}`);
        results.errors++;
      }
    }

    // --- Crypto Web3 source (Cointelegraph RSS instead of Tweeter hallucination) ---
    if (
      source === "all" ||
      source === "cointelegraph" ||
      source === "twitter"
    ) {
      log("[Crypto RSS] Fetching Cointelegraph...");
      const cryptoArticles = await fetchCryptoRss();
      log(`[Crypto RSS] ${cryptoArticles.length} articles found`);

      for (const art of cryptoArticles) {
        if (art.source_url) {
          const { data: existing } = await supabase
            .from("scam_alerts")
            .select("id")
            .eq("source_url", art.source_url)
            .limit(1);
          if (existing && existing.length > 0) {
            results.skipped++;
            continue;
          }
        }

        try {
          const summary = await summariseCryptoArticle(
            art.title,
            art.description || "",
          );
          if (!summary || !summary.relevant) {
            results.filtered++;
            continue;
          }

          const { error } = await supabase.from("scam_alerts").insert({
            title_pl: summary.title_pl,
            title_en: summary.title_en || null,
            summary_pl: summary.summary_pl,
            summary_en: summary.summary_en || null,
            threat_type: summary.threat_type || "hack",
            severity: summary.severity || "high",
            source_url: art.source_url || null,
            protection_tips_pl: summary.protection_tips_pl || null,
            protection_tips_en: summary.protection_tips_en || null,
            category: "web3",
            source_name: "cointelegraph",
            active: true,
          });
          if (error) {
            log(`DB error: ${error.message}`);
            results.errors++;
          } else {
            results.inserted++;
            log(`Inserted Crypto Alert: ${summary.title_pl}`);
          }
          await new Promise((r) => setTimeout(r, 1000));
        } catch (e) {
          log(`Error: ${e instanceof Error ? e.message : "unknown"}`);
          results.errors++;
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    log(`Fatal: ${msg}`);
    return NextResponse.json({ error: msg, results, logs }, { status: 500 });
  }

  log(
    `Done: ${results.inserted} inserted, ${results.filtered} filtered, ${results.skipped} skipped, ${results.errors} errors`,
  );
  return NextResponse.json({ ok: true, results, logs });
}
