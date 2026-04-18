import { NextResponse } from "next/server";
import Parser from "rss-parser";
import OpenAI from "openai";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 120; // RSS fetch + multiple Grok calls

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a single RSS item from CERT.PL feed */
interface CertRssItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
}

/** JSON object Grok must return (matches scam_alerts columns) */
interface GrokScamOutput {
  title_pl: string;
  title_en: string;
  summary_pl: string;
  summary_en: string;
  threat_type: string;
  severity: "low" | "medium" | "high" | "critical";
  protection_tips_pl: string;
  protection_tips_en: string;
  analogy_pl: string;
  analogy_en: string;
  category: "web2" | "web3" | "global";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CERT_RSS_URL = "https://moje.cert.pl/advisory_feed/advisory/feed/";
const GROK_MODEL = "grok-4-1-fast-reasoning";
const DEFAULT_CHAINS = ["PKO BP", "Ethereum"];

// ---------------------------------------------------------------------------
// Grok client (OpenAI SDK → xAI)
// ---------------------------------------------------------------------------

function getGrokClient(): OpenAI {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "❌ Missing XAI_API_KEY in environment. Add it to .env.local and Vercel dashboard.",
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });
}

// ---------------------------------------------------------------------------
// Grok prompt — transforms raw RSS item into structured scam alert
// ---------------------------------------------------------------------------

function buildGrokPrompt(title: string, content: string): string {
  return `Jesteś głównym specjalistą ds. cyberbezpieczeństwa w polskim banku (PKO BP).
Przeanalizuj poniższy alert bezpieczeństwa z CERT.PL i wygeneruj z niego wpis do systemu ostrzeżeń dla dorosłych klientów banku.

TWOJE WYTYCZNE JĘZYKOWE:
1. Używaj języka wysoce PROFESJONALNEGO, oficjalnego i poważnego.
2. CAŁKOWITY ZAKAZ używania slangu i młodzieżowych potocyzmów (NIGDY nie używaj słów typu: "legitny", "apka", "scam" - pisz "autentyczny", "aplikacja", "oszustwo").
3. Twój ton to ton ostrzegawczy, urzędowy/bankowy.

TYTUŁ ALERTU: ${title}
TREŚĆ ALERTU: ${content}

Odpowiedź MUSI być czystym obiektem JSON (bez markdown, bez komentarzy) o następującej strukturze:

{
  "title_pl": "Krótki, chwytliwy tytuł po polsku (max 100 znaków)",
  "title_en": "Short, catchy English title (max 100 chars)",
  "summary_pl": "Podsumowanie 2-3 zdania po polsku. Wyjaśnij co się stało i dlaczego jest to groźne dla klientów banku.",
  "summary_en": "2-3 sentence summary in English.",
  "threat_type": "JEDNO z: phishing | hack | social_engineering | malware | scam | fake_wallet | rug_pull | supply_chain",
  "category": "JEDNO z: global (ogólne oszustwa internetowe, phishing na kuriera/ZUS), web2 (bezpośrednie oszustwa na bankowość i finanse), web3 (kryptowaluty, DeFi, portfele cyfrowe)",
  "severity": "JEDNO z: low | medium | high | critical",
  "protection_tips_pl": "• Porada 1 dla klienta banku\\n• Porada 2\\n• Porada 3",
  "protection_tips_en": "• Tip 1 for bank customer\\n• Tip 2\\n• Tip 3",
  "analogy_pl": "Analogia do tradycyjnej bankowości dla klienta PKO BP, np. porównanie do kradzieży kluczy do sejfu, fałszywego urzędnika bankowego, podrobionego dokumentu w oddziale itp. 1-2 zdania.",
  "analogy_en": "Same analogy in English. 1-2 sentences."
}

WAŻNE:
- Analogia MUSI odwoływać się do realiów klienta tradycyjnego banku (PKO BP), żeby laik mógł zrozumieć zagrożenie.
- Porady muszą być konkretne i akcjonalne.
- Jeśli alert nie dotyczy bezpieczeństwa finansowego/bankowego/krypto, i tak go przetwórz, ale ustaw severity na "low".`;
}

// ---------------------------------------------------------------------------
// GET handler — Vercel Cron triggers GET requests
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  // ── Auth: Vercel Cron sends CRON_SECRET in Authorization header ──
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[sync-scams] ⛔ Unauthorized request blocked");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getSupabaseAdminClient();
  const grok = getGrokClient();
  const parser = new Parser<Record<string, unknown>, CertRssItem>();

  const stats = { fetched: 0, skipped: 0, inserted: 0, errors: 0 };
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    console.log(`[sync-scams] ${msg}`);
  };

  try {
    // ── Step 1: Fetch RSS ──
    log("📥 Fetching CERT.PL RSS feed...");
    const feed = await parser.parseURL(CERT_RSS_URL);
    stats.fetched = feed.items.length;
    log(`✅ Fetched ${stats.fetched} items from CERT.PL`);

    if (stats.fetched === 0) {
      log("⚠️ No items in feed — nothing to process.");
      return NextResponse.json({ ok: true, stats, logs });
    }

    // ── Step 2-4: Process each item ──
    for (const item of feed.items) {
      const sourceUrl = item.link ?? "";
      const title = item.title ?? "Untitled";
      const content = item.contentSnippet || item.content || "";
      const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

      if (!sourceUrl) {
        log(`⏭️ Skipping item without link: "${title}"`);
        stats.skipped++;
        continue;
      }

      // ── Step 2: Deduplication ──
      try {
        const { data: existing, error: lookupError } = await supabase
          .from("scam_alerts")
          .select("id")
          .eq("source_url", sourceUrl)
          .limit(1);

        if (lookupError) {
          log(`❌ Dedup lookup failed for "${title}": ${lookupError.message}`);
          stats.errors++;
          continue;
        }

        if (existing && existing.length > 0) {
          log(`⏭️ Duplicate (already in DB): "${title}"`);
          stats.skipped++;
          continue;
        }
      } catch (err) {
        log(
          `❌ Dedup error: ${err instanceof Error ? err.message : "unknown"}`,
        );
        stats.errors++;
        continue;
      }

      // ── Step 3: AI Transformation via Grok ──
      let scamData: GrokScamOutput;
      try {
        log(`🤖 Sending to Grok: "${title.slice(0, 60)}..."`);

        const completion = await grok.chat.completions.create({
          model: GROK_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a cybersecurity expert for a Polish bank. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: buildGrokPrompt(title, content.slice(0, 2000)),
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000,
          temperature: 0.2,
        });

        const rawContent = completion.choices[0]?.message?.content?.trim();
        if (!rawContent) {
          log(`❌ Grok returned empty response for "${title}"`);
          stats.errors++;
          continue;
        }

        scamData = JSON.parse(rawContent) as GrokScamOutput;
        log(
          `✅ Grok classified: ${scamData.threat_type} / ${scamData.severity}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        log(`❌ Grok error for "${title}": ${msg}`);
        stats.errors++;
        continue;
      }

      // ── Step 4: Supabase Insert ──
      try {
        const row = {
          title_pl: scamData.title_pl,
          title_en: scamData.title_en,
          summary_pl: scamData.summary_pl,
          summary_en: scamData.summary_en,
          threat_type: scamData.threat_type,
          severity: scamData.severity,
          protection_tips_pl: scamData.protection_tips_pl,
          protection_tips_en: scamData.protection_tips_en,
          analogy_pl: scamData.analogy_pl,
          analogy_en: scamData.analogy_en,
          source_url: sourceUrl,
          detected_at: pubDate,
          amount_lost_usd: 0,
          chains: DEFAULT_CHAINS,
          active: true,
          category: scamData.category || "global",
          source_name: "cert_pl",
        };

        const { error: insertError } = await supabase
          .from("scam_alerts")
          .insert(row);

        if (insertError) {
          log(`❌ DB insert failed: ${insertError.message}`);
          stats.errors++;
        } else {
          log(`💾 Inserted: "${scamData.title_pl}"`);
          stats.inserted++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        log(`❌ Insert error: ${msg}`);
        stats.errors++;
      }

      // Rate limit — 1.2s between Grok calls
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    log(`💀 Fatal error: ${msg}`);
    return NextResponse.json(
      { ok: false, error: msg, stats, logs },
      { status: 500 },
    );
  }

  log(
    `📋 Done: ${stats.inserted} inserted, ${stats.skipped} skipped, ${stats.errors} errors (of ${stats.fetched} total)`,
  );
  return NextResponse.json({ ok: true, stats, logs });
}
