import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  assertPrivyOwnership,
  requirePrivyAuth,
  setSkarbnikSessionCookie,
} from "@/lib/server/auth";
import { assertRateLimit } from "@/lib/server/rateLimit";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type CreateUserBody = {
  privyId?: string;
  walletAddress?: string;
  email?: string;
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
    assertRateLimit(request, {
      key: "users-create",
      maxRequests: 40,
      windowMs: 10 * 60 * 1000,
    });

    const auth = await requirePrivyAuth(request);
    const body = (await request.json()) as CreateUserBody;

    const privyId = body.privyId?.trim();
    const walletAddress = body.walletAddress?.trim();
    const email = body.email?.trim();

    if (!privyId || !walletAddress) {
      throw new ApiError(400, "privyId and walletAddress are required.");
    }

    assertPrivyOwnership(auth, privyId);

    if (!ethers.isAddress(walletAddress)) {
      throw new ApiError(400, "walletAddress must be a valid EVM address.");
    }

    const normalizedWalletAddress = walletAddress.toLowerCase();
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
      throw new ApiError(500, "Failed to look up user.", false);
    }

    const nowIso = new Date().toISOString();

    if (existing) {
      // Existing user: just bump last_active (and language if provided).
      const updatePayload: Record<string, unknown> = {
        last_active: nowIso,
        wallet_address: normalizedWalletAddress,
      };
      if (body.language === "pl" || body.language === "en") {
        updatePayload.language = body.language;
      }
      if (email) {
        updatePayload.google_email = email;
      }
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError) {
        throw new ApiError(500, "Failed to refresh user.", false);
      }
      // Issue/refresh our signed session cookie after verified Privy auth.
      const response = NextResponse.json({ user: updated, created: false });
      setSkarbnikSessionCookie(response, auth.privyId);
      return response;
    }

    const lang = body.language === "en" ? "en" : "pl";

    const payload = {
      privy_id: privyId,
      wallet_address: normalizedWalletAddress,
      google_email: email || null,
      username: generateUsername(walletAddress, email),
      // Never trust client-provided progression state during signup.
      level: 1,
      total_xp: 0,
      language: lang,
      last_active: nowIso,
    };

    const { data, error } = await supabase
      .from("users")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (error) {
      // Obsługa Race-Condition: Jeśli 4 requesty uderzą z frontu naraz, pierwszy tworzy usera, 
      // a reszta dostaje błąd unikalności (23505). Zwracamy wtedy sukces pobierając istniejący już wpis.
      if (error.code === '23505') {
        const { data: latestExisting } = await supabase
          .from("users")
          .select("*")
          .eq("privy_id", privyId)
          .single();
          
        if (latestExisting) {
          const response = NextResponse.json({ user: latestExisting, created: false });
          setSkarbnikSessionCookie(response, auth.privyId);
          return response;
        }
      }
      throw new ApiError(500, "Failed to create user.", false);
    }

    // Issue/refresh our signed session cookie after verified Privy auth.
    const response = NextResponse.json({ user: data, created: true });
    setSkarbnikSessionCookie(response, auth.privyId);
    return response;
  } catch (error) {
    const apiError = toApiError(error, "Failed to create user.");
    if (apiError.status >= 500) {
      logServerError("api/users/create", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage ? apiError.message : "Failed to create user.",
      },
      { status: apiError.status }
    );
  }
}
