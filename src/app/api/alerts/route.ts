import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type ScamAlert = {
  id: string;
  title_pl: string;
  title_en: string | null;
  summary_pl: string;
  summary_en: string | null;
  threat_type: string;
  severity: "critical" | "high" | "medium" | "low";
  amount_lost_usd: number | null;
  detected_at: string;
  analogy_pl: string | null;
  analogy_en: string | null;
  protection_tips_pl: string | null;
  protection_tips_en: string | null;
  source_url: string | null;
};

// Severity ordering for sorting
const severityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("scam_alerts")
      .select(
        "id, title_pl, title_en, summary_pl, summary_en, threat_type, severity, amount_lost_usd, detected_at, analogy_pl, analogy_en, protection_tips_pl, protection_tips_en, source_url",
      )
      .eq("active", true)
      .order("detected_at", { ascending: false });

    if (error) {
      console.error("Alerts fetch error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch alerts." },
        { status: 500 },
      );
    }

    // Sort by severity (critical first), then by detected_at (newest first)
    const sorted = (data as ScamAlert[]).sort((a, b) => {
      const sa = severityOrder[a.severity] ?? 99;
      const sb = severityOrder[b.severity] ?? 99;
      if (sa !== sb) return sa - sb;
      return (
        new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
      );
    });

    return NextResponse.json(sorted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Alerts route error:", message);
    return NextResponse.json(
      { error: "Failed to fetch alerts.", details: message },
      { status: 500 },
    );
  }
}
