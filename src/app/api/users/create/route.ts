import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type CreateUserBody = {
  privyId?: string;
  walletAddress?: string;
  email?: string;
  /** Optional: set starting level/XP from an assessment (new users only). */
  level?: number;
  initialXP?: number;
  language?: "pl" | "en";
};

function generateUsername(walletAddress: string, email?: string): string {
  if (email && email.includes("@")) {
    const [localPart] = email.split("@");
    if (localPart.trim().length > 0) {
      return localPart.trim().slice(0, 24);
    }
  }

  const cleanedAddress = walletAddress.toLowerCase();
  return `user_${cleanedAddress.slice(2, 8)}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateUserBody;

    const privyId = body.privyId?.trim();
    const walletAddress = body.walletAddress?.trim();
    const email = body.email?.trim();

    if (!privyId || !walletAddress) {
      return NextResponse.json(
        { error: "privyId and walletAddress are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Look up existing user — if they exist we preserve their progress
    // and only refresh last_active. Assessment-provided level/XP only
    // apply when we're creating a brand-new row.
    const { data: existing, error: lookupError } = await supabase
      .from("users")
      .select("id, total_xp, level")
      .eq("privy_id", privyId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { error: "Failed to look up user.", details: lookupError.message },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();

    if (existing) {
      // Existing user: just bump last_active (and language if provided).
      const updatePayload: Record<string, unknown> = { last_active: nowIso };
      if (body.language === "pl" || body.language === "en") {
        updatePayload.language = body.language;
      }
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to refresh user.", details: updateError.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ user: updated, created: false });
    }

    const lvl =
      typeof body.level === "number" && body.level >= 1 && body.level <= 4
        ? Math.floor(body.level)
        : 1;
    const xp =
      typeof body.initialXP === "number" && body.initialXP >= 0
        ? Math.floor(body.initialXP)
        : 0;
    const lang = body.language === "en" ? "en" : "pl";

    const payload = {
      privy_id: privyId,
      wallet_address: walletAddress.toLowerCase(),
      google_email: email || null,
      username: generateUsername(walletAddress, email),
      level: lvl,
      total_xp: xp,
      language: lang,
      last_active: nowIso,
    };

    const { data, error } = await supabase
      .from("users")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create user.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data, created: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create user.", details: message },
      { status: 500 }
    );
  }
}
