import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/server/apiErrors";

const NONCE_HEADER = "x-request-nonce";
const TIMESTAMP_HEADER = "x-request-timestamp";
const MAX_TIMESTAMP_SKEW_SECONDS = 300;

function parseUnixTimestamp(value: string | null): number {
  if (!value) {
    throw new ApiError(
      400,
      `Missing ${TIMESTAMP_HEADER} header for replay protection.`
    );
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(
      400,
      `${TIMESTAMP_HEADER} must be a unix timestamp in seconds.`
    );
  }

  return Math.floor(parsed);
}

function readRequestNonce(request: Request): string {
  const nonce = request.headers.get(NONCE_HEADER)?.trim();
  if (!nonce) {
    throw new ApiError(
      400,
      `Missing ${NONCE_HEADER} header for replay protection.`
    );
  }

  if (!/^[A-Za-z0-9:_-]{16,128}$/.test(nonce)) {
    throw new ApiError(
      400,
      `${NONCE_HEADER} format is invalid (expected 16-128 URL-safe chars).`
    );
  }

  return nonce;
}

export async function assertAndConsumeRequestNonce(
  request: Request,
  supabase: SupabaseClient,
  scope: string
): Promise<void> {
  const nonce = readRequestNonce(request);
  const timestamp = parseUnixTimestamp(request.headers.get(TIMESTAMP_HEADER));
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (Math.abs(nowSeconds - timestamp) > MAX_TIMESTAMP_SKEW_SECONDS) {
    throw new ApiError(
      401,
      "Request timestamp is outside the allowed replay window."
    );
  }

  const { error } = await supabase.from("api_request_nonces").insert({
    nonce,
    scope,
    requested_at: new Date(timestamp * 1000).toISOString(),
  });

  if (!error) {
    return;
  }

  if (error.code === "23505") {
    throw new ApiError(409, "Replay detected: request nonce already used.");
  }

  throw new ApiError(500, "Failed to validate request nonce.", false);
}
