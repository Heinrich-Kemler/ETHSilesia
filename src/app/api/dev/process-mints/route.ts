import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";
import { processNextPendingBadgeMintJob } from "@/lib/server/badgeMinting";

export const runtime = "nodejs";

// Dedykowany endpoint dla developerskiego testowania (bez autoryzacji CRON).
// Po wejściu w ten link, skrypt sprawdzi "poczekalnię" NFT i spróbuje wymintować jedno zadanie.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Endpoint zablokowany na produkcji." }, { status: 403 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    console.log("[DEV] Rozpoczynam poszukiwanie zadań NFT w badge_mint_jobs...");

    const job = await processNextPendingBadgeMintJob(supabase);

    if (!job) {
      return NextResponse.json({ 
        message: "Poczekalnia jest pusta. Brak odznak do wygenerowania." 
      });
    }

    return NextResponse.json({
      message: "Sukces! Znalazłem i obsłużyłem zadanie na blockchainie.",
      job
    });

  } catch (error) {
    console.error("[DEV Mint Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd podczas mintowania" },
      { status: 500 }
    );
  }
}
