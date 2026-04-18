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

    // 2. Build HTML Template mimicking 'Skarbnik' dark theme
    let alertsHtmlList = recentAlerts
      .map((alert) => {
        const severityColor =
          alert.severity === "critical"
            ? "#ef4444"
            : alert.severity === "high"
              ? "#f97316"
              : alert.severity === "medium"
                ? "#eab308"
                : "#38BDF8";

        const catLabel =
          alert.category === "web3"
            ? "DeFi / Web3"
            : alert.category === "web2"
              ? "Bankowość"
              : "Globalne";

        return `
        <div style="margin-bottom: 24px; padding: 24px; background: #131625; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; border-left: 4px solid ${severityColor};">
          <h3 style="margin-top: 0; margin-bottom: 12px; color: #F0F1F5; font-size: 18px; font-family: 'Cinzel', serif, Arial;">
            ${alert.title_pl}
          </h3>
          <div style="margin-bottom: 16px; font-size: 11px; font-family: 'Space Mono', monospace, Arial; text-transform: uppercase; letter-spacing: 0.1em;">
            <span style="background: rgba(201, 168, 76, 0.1); border: 1px solid rgba(201, 168, 76, 0.2); padding: 4px 8px; border-radius: 6px; margin-right: 8px; color: #C9A84C;">
              KATEGORIA: ${catLabel}
            </span>
            <span style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 6px; color: #B8BCC8;">
              TYP: ${(alert.threat_type || "").replace("_", " ")}
            </span>
          </div>
          <p style="margin: 0; color: #B8BCC8; font-size: 14px; line-height: 1.6; font-family: 'Inter', sans-serif, Arial;">
            ${alert.summary_pl}
          </p>
          ${
            alert.source_url
              ? `
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
            <a href="${alert.source_url}" style="color: #C9A84C; text-decoration: none; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif, Arial; display: inline-flex; align-items: center; justify-content: center; background: rgba(201, 168, 76, 0.1); padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(201, 168, 76, 0.2);">
              ➡️ Otwórz archiwum incydentu
            </a>
          </div>`
              : ""
          }
        </div>
      `;
      })
      .join("");

    const htmlBody = `
      <div style="font-family: 'Inter', sans-serif, Arial; background-color: #0B0E17; min-height: 100vh; padding: 40px 20px; color: #F0F1F5;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 40px;">
            <p style="margin: 0; color: #C9A84C; font-family: 'Cinzel', serif, Arial; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px;">
              SKARBNIK
            </p>
            <h1 style="color: #F0F1F5; font-family: 'Cinzel', serif, Arial; margin: 0; font-size: 28px;">
              Dzienny Raport Zagrożeń
            </h1>
            <p style="color: #6B7084; margin-top: 12px; font-size: 15px;">
              Wykryliśmy <strong><span style="color: #C9A84C;">${recentAlerts.length}</span></strong> nowe wektory ataków.
            </p>
          </div>
          
          ${alertsHtmlList}
          
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
             <p style="font-size: 12px; color: #6B7084; margin: 0; font-family: 'Space Mono', monospace, Arial; line-height: 1.6;">
               RAPORT WYGENEROWANY AUTOMATYCZNIE PRZEZ SYSTEM SKARBNIKA<br/>
               <a href="https://ethsilesia.pl" style="color: #6B7084; text-decoration: underline;">https://ethsilesia.pl</a>
             </p>
          </div>
        </div>
      </div>
    `;

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
