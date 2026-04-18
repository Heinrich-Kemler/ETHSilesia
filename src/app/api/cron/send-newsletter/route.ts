import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  // ── Auth: Vercel Cron sends CRON_SECRET in Authorization header ──
  // Fail CLOSED: if CRON_SECRET is unset, every caller is rejected. Previously
  // the wrapping `if (cronSecret)` made the endpoint publicly triggerable when
  // the env var was missing — an attacker could force expensive Resend sends.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[send-newsletter] ⛔ Unauthorized request blocked");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("❌ Missing RESEND_API_KEY");
    return NextResponse.json(
      { error: "Missing Resend API Key" },
      { status: 500 },
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL || "delivered@resend.dev"; // W darmowym planie Resend wysyłaj tylko na zweryfikowany email

  const supabase = getSupabaseAdminClient();
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    console.log(`[newsletter] ${msg}`);
  };

  try {
    // 1. Fetch alerts from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateLimit = yesterday.toISOString();

    log(`🔍 Wyszukiwanie alertów od ${dateLimit}...`);

    const { data: recentAlerts, error } = await supabase
      .from("scam_alerts")
      .select(
        "title_pl, summary_pl, category, severity, threat_type, detected_at, source_url",
      )
      .eq("active", true)
      .gte("detected_at", dateLimit)
      .order("severity", { ascending: true }); // Ustawienie od najbardziej krytycznych (critical -> high -> medium)

    if (error) throw error;

    if (!recentAlerts || recentAlerts.length === 0) {
      log(
        "ℹ️ Brak nowych alertów w ciągu ostatnich 24 godzin. Pomijam wysyłkę.",
      );
      return NextResponse.json({ ok: true, message: "No new alerts", logs });
    }

    log(
      `✅ Znaleziono ${recentAlerts.length} nowych oszustw. Budowanie HTML...`,
    );

    // 2. Build HTML template — "PKO ledger" light theme
    //
    // Mirrors the app's light-mode design system (see globals.css):
    //   --bg-primary:  #F6F1E7  (cream paper)
    //   --bg-card:     #FFFFFF
    //   --gold:        #2A5BB8  (PKO navy, primary accent)
    //   --gold-dim:    #1A3E7A  (deeper press tone)
    //   --flame:       #B87333  (warm amber, kept for high severity)
    //   --accent-red:  #E30613  (PKO flag red, critical severity)
    //   --cyan:        #0369A1  (sky-700, medium severity)
    //   --text-*:      #1A1A24 / #3D4156 / #6B6E7A
    //   --border:      rgba(0,0,0,0.08)
    //
    // Fonts: Cinzel for headings, Space Mono for labels, Inter for
    // body — all with robust serif / monospace / sans fallbacks
    // because Gmail/Outlook strip webfont <link> rels. The Google
    // Fonts <link> in <head> lifts Apple Mail / iOS Mail / Thunderbird
    // to the real typefaces; everywhere else we land on Georgia /
    // Courier / Arial, which is still on-brand.
    //
    // Layout is table-based for Outlook compatibility, but uses
    // CSS for padding/border because Outlook 2013+ handles it fine.

    // ── Palette ──────────────────────────────────────────────────
    const COLOR = {
      bg: "#F6F1E7",
      card: "#FFFFFF",
      elevated: "#FAF7EE",
      textPrimary: "#1A1A24",
      textSecondary: "#3D4156",
      textMuted: "#6B6E7A",
      border: "rgba(0,0,0,0.08)",
      borderStrong: "rgba(0,0,0,0.14)",
      navy: "#2A5BB8", // --gold in light mode
      navyDim: "#1A3E7A",
      navyTint: "rgba(42,91,184,0.08)",
      navyBorder: "rgba(42,91,184,0.22)",
      flame: "#B87333",
      flameTint: "rgba(184,115,51,0.10)",
      flameBorder: "rgba(184,115,51,0.28)",
      cyan: "#0369A1",
      cyanTint: "rgba(3,105,161,0.10)",
      cyanBorder: "rgba(3,105,161,0.25)",
      red: "#E30613",
      redTint: "rgba(227,6,19,0.08)",
      redBorder: "rgba(227,6,19,0.30)",
    };

    // ── Font stacks ─────────────────────────────────────────────
    const FONT_HEADING = `'Cinzel', 'Georgia', 'Times New Roman', serif`;
    const FONT_BODY = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;
    const FONT_MONO = `'Space Mono', 'Courier New', Courier, monospace`;

    // ── Severity helpers ────────────────────────────────────────
    const severityPalette = (
      severity: string | null | undefined,
    ): {
      accent: string;
      tint: string;
      border: string;
      label: string;
    } => {
      switch (severity) {
        case "critical":
          return {
            accent: COLOR.red,
            tint: COLOR.redTint,
            border: COLOR.redBorder,
            label: "KRYTYCZNY",
          };
        case "high":
          return {
            accent: COLOR.flame,
            tint: COLOR.flameTint,
            border: COLOR.flameBorder,
            label: "WYSOKI",
          };
        case "medium":
          return {
            accent: COLOR.cyan,
            tint: COLOR.cyanTint,
            border: COLOR.cyanBorder,
            label: "ŚREDNI",
          };
        default:
          return {
            accent: COLOR.textMuted,
            tint: "rgba(107,110,122,0.08)",
            border: "rgba(107,110,122,0.22)",
            label: "NISKI",
          };
      }
    };

    const categoryLabel = (cat: string | null | undefined): string => {
      if (cat === "web3") return "DEFI / WEB3";
      if (cat === "web2") return "BANKOWOŚĆ";
      return "GLOBALNE";
    };

    // ── Escape user-supplied strings ────────────────────────────
    // scam_alerts content is curated by our own cron, but HTML-escape
    // defensively so a bad feed can't inject markup into inboxes.
    const esc = (s: string | null | undefined): string =>
      (s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    // ── Alert card renderer ─────────────────────────────────────
    const alertsHtmlList = recentAlerts
      .map((alert) => {
        const sev = severityPalette(alert.severity);
        const catLabel = categoryLabel(alert.category);
        const threat = (alert.threat_type || "").replace(/_/g, " ").trim();

        const sourceButton = alert.source_url
          ? `
          <tr>
            <td style="padding-top:20px;">
              <a
                href="${esc(alert.source_url)}"
                style="
                  display:inline-block;
                  font-family:${FONT_MONO};
                  font-size:11px;
                  font-weight:700;
                  text-transform:uppercase;
                  letter-spacing:0.14em;
                  text-decoration:none;
                  color:#FFFFFF;
                  background:${COLOR.navy};
                  padding:10px 18px;
                  border-radius:8px;
                  border:1px solid ${COLOR.navy};
                "
              >
                Otwórz źródło &rarr;
              </a>
            </td>
          </tr>`
          : "";

        return `
        <tr>
          <td style="padding:0 0 16px 0;">
            <table
              role="presentation"
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                background:${COLOR.card};
                border:1px solid ${COLOR.border};
                border-left:4px solid ${sev.accent};
                border-radius:12px;
              "
            >
              <tr>
                <td style="padding:22px 24px 24px 24px;">
                  <!-- chips row -->
                  <div style="margin-bottom:14px; line-height:1.8;">
                    <span style="
                      display:inline-block;
                      font-family:${FONT_MONO};
                      font-size:10px;
                      font-weight:700;
                      text-transform:uppercase;
                      letter-spacing:0.16em;
                      color:${sev.accent};
                      background:${sev.tint};
                      border:1px solid ${sev.border};
                      padding:4px 9px;
                      border-radius:6px;
                      margin-right:6px;
                    ">${sev.label}</span>
                    <span style="
                      display:inline-block;
                      font-family:${FONT_MONO};
                      font-size:10px;
                      font-weight:700;
                      text-transform:uppercase;
                      letter-spacing:0.16em;
                      color:${COLOR.navy};
                      background:${COLOR.navyTint};
                      border:1px solid ${COLOR.navyBorder};
                      padding:4px 9px;
                      border-radius:6px;
                      margin-right:6px;
                    ">${esc(catLabel)}</span>
                    ${
                      threat
                        ? `<span style="
                      display:inline-block;
                      font-family:${FONT_MONO};
                      font-size:10px;
                      font-weight:700;
                      text-transform:uppercase;
                      letter-spacing:0.16em;
                      color:${COLOR.textSecondary};
                      background:${COLOR.elevated};
                      border:1px solid ${COLOR.border};
                      padding:4px 9px;
                      border-radius:6px;
                    ">${esc(threat)}</span>`
                        : ""
                    }
                  </div>

                  <!-- title -->
                  <h3 style="
                    margin:0 0 10px 0;
                    font-family:${FONT_HEADING};
                    font-weight:700;
                    font-size:20px;
                    line-height:1.25;
                    letter-spacing:-0.01em;
                    color:${COLOR.textPrimary};
                  ">${esc(alert.title_pl)}</h3>

                  <!-- summary -->
                  <p style="
                    margin:0;
                    font-family:${FONT_BODY};
                    font-size:14px;
                    line-height:1.6;
                    color:${COLOR.textSecondary};
                  ">${esc(alert.summary_pl)}</p>

                  <!-- optional source button -->
                  <table
                    role="presentation"
                    cellpadding="0"
                    cellspacing="0"
                    style="margin-top:2px;"
                  >
                    ${sourceButton}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
      })
      .join("");

    const todayLabel = new Date().toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const htmlBody = `<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>Skarbnik · Raport Zagrożeń</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
      rel="stylesheet"
    />
    <style>
      /* Reset a few defaults so Outlook / Gmail don't add unwanted spacing. */
      body, table, td, p, h1, h2, h3, a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table, td { border-collapse: collapse; }
      body { margin: 0 !important; padding: 0 !important; background: ${COLOR.bg}; }
      a { color: ${COLOR.navy}; }
      /* Narrow-screen polish — most clients respect this. */
      @media only screen and (max-width: 620px) {
        .container { width: 100% !important; padding: 20px 12px !important; }
        .card-pad  { padding: 20px 18px !important; }
        .h1-email  { font-size: 24px !important; }
      }
    </style>
  </head>
  <body style="
    margin:0;
    padding:0;
    background:${COLOR.bg};
    color:${COLOR.textPrimary};
    font-family:${FONT_BODY};
  ">
    <!-- Hidden preheader — shows as preview text in the inbox list. -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; visibility:hidden;">
      ${recentAlerts.length} ${recentAlerts.length === 1 ? "nowe zagrożenie" : "nowych zagrożeń"} · ${esc(todayLabel)}
    </div>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background:${COLOR.bg};"
    >
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table
            role="presentation"
            class="container"
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="width:600px; max-width:600px; background:${COLOR.bg};"
          >
            <!-- HEADER CARD -->
            <tr>
              <td
                class="card-pad"
                style="
                  background:${COLOR.card};
                  border:1px solid ${COLOR.border};
                  border-radius:14px;
                  padding:32px 32px 28px 32px;
                "
              >
                <!-- mono strap -->
                <p style="
                  margin:0 0 14px 0;
                  font-family:${FONT_MONO};
                  font-size:10px;
                  font-weight:700;
                  color:${COLOR.navy};
                  text-transform:uppercase;
                  letter-spacing:0.22em;
                ">
                  SKARBNIK &middot; SYSTEM OSTRZEŻEŃ
                </p>

                <!-- title -->
                <h1 class="h1-email" style="
                  margin:0 0 12px 0;
                  font-family:${FONT_HEADING};
                  font-weight:700;
                  font-size:30px;
                  line-height:1.1;
                  letter-spacing:-0.01em;
                  color:${COLOR.textPrimary};
                  text-transform:uppercase;
                ">
                  Dzienny Raport Zagrożeń
                </h1>

                <!-- subtitle + count pill -->
                <p style="
                  margin:0;
                  font-family:${FONT_BODY};
                  font-size:15px;
                  line-height:1.55;
                  color:${COLOR.textSecondary};
                ">
                  Wykryliśmy
                  <span style="
                    display:inline-block;
                    font-family:${FONT_MONO};
                    font-weight:700;
                    font-size:13px;
                    color:#FFFFFF;
                    background:${COLOR.navy};
                    padding:2px 10px;
                    border-radius:6px;
                    margin:0 4px;
                    letter-spacing:0.06em;
                  ">${recentAlerts.length}</span>
                  ${recentAlerts.length === 1 ? "nowy wektor ataku" : "nowych wektorów ataku"}
                  w ciągu ostatnich 24 godzin.
                </p>

                <!-- date strap -->
                <p style="
                  margin:16px 0 0 0;
                  font-family:${FONT_MONO};
                  font-size:10px;
                  font-weight:700;
                  color:${COLOR.textMuted};
                  text-transform:uppercase;
                  letter-spacing:0.2em;
                ">
                  ${esc(todayLabel)}
                </p>
              </td>
            </tr>

            <!-- SPACING -->
            <tr><td style="height:24px; line-height:24px; font-size:0;">&nbsp;</td></tr>

            <!-- ALERT CARDS -->
            ${alertsHtmlList}

            <!-- ORNAMENT DIVIDER -->
            <tr>
              <td style="padding:8px 0 24px 0;" align="center">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:80px; height:1px; background:${COLOR.borderStrong};">&nbsp;</td>
                    <td style="padding:0 10px;">
                      <span style="
                        display:inline-block;
                        width:6px;
                        height:6px;
                        background:${COLOR.navy};
                        transform:rotate(45deg);
                      ">&nbsp;</span>
                    </td>
                    <td style="width:80px; height:1px; background:${COLOR.borderStrong};">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="padding:0 24px 8px 24px;">
                <p style="
                  margin:0 0 10px 0;
                  font-family:${FONT_MONO};
                  font-size:10px;
                  font-weight:700;
                  color:${COLOR.textMuted};
                  text-transform:uppercase;
                  letter-spacing:0.2em;
                  line-height:1.6;
                ">
                  Raport wygenerowany automatycznie przez system Skarbnika
                </p>
                <p style="
                  margin:0;
                  font-family:${FONT_BODY};
                  font-size:13px;
                  color:${COLOR.textMuted};
                ">
                  <a
                    href="https://ethsilesia.pl"
                    style="color:${COLOR.navy}; text-decoration:none; font-weight:600;"
                  >ethsilesia.pl</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    // 3. Send via Resend raw REST API
    log(`📨 Wysyłanie emaila...`);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ostrzeżenia Bezpieczeństwa <onboarding@resend.dev>", // Twój przypisany domenowy alias
        to: [adminEmail],
        subject: `[Raport] Wykryto ${recentAlerts.length} nowe oszustwa (${new Date().toLocaleDateString("pl-PL")})`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      log(`❌ Błąd wysyłania: ${errorText}`);
      throw new Error(`Resend responded with ${res.status}: ${errorText}`);
    }

    const json = await res.json();
    log(`✅ Email wysłany pomyślnie! ID: ${json.id}`);

    return NextResponse.json({ ok: true, message: "Newsletter sent", logs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    log(`💀 Fatal error: ${msg}`);
    return NextResponse.json({ ok: false, error: msg, logs }, { status: 500 });
  }
}
