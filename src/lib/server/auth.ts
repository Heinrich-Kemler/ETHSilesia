import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { importSPKI, jwtVerify, type JWTPayload } from "jose";
import { ApiError } from "@/lib/server/apiErrors";

export type PrivyAuthContext = {
  privyId: string;
  sessionId: string | null;
};

const PRIVY_ISSUER = "privy.io";
const SKARBNIK_SESSION_COOKIE = "skarbnik_auth";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ApiError(
      500,
      `Missing required server environment variable: ${name}.`,
      false
    );
  }

  return value;
}

function secureEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) {
    return null;
  }

  const bearerPrefix = "Bearer ";
  if (!authorization.startsWith(bearerPrefix)) {
    return null;
  }

  const token = authorization.slice(bearerPrefix.length).trim();
  return token.length > 0 ? token : null;
}

function payloadToContext(payload: JWTPayload): PrivyAuthContext {
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new ApiError(401, "Invalid auth token payload.");
  }

  const sessionId =
    payload.sid && typeof payload.sid === "string" ? payload.sid : null;

  return {
    privyId: payload.sub,
    sessionId,
  };
}

async function verifyPrivyJwt(token: string): Promise<PrivyAuthContext> {
  const privyAppId = getRequiredEnv("NEXT_PUBLIC_PRIVY_APP_ID");
  const verificationKey = getRequiredEnv("PRIVY_JWT_VERIFICATION_KEY").replace(
    /\\n/g,
    "\n"
  );
  const key = await importSPKI(verificationKey, "ES256");
  try {
    const verification = await jwtVerify(token, key, {
      issuer: PRIVY_ISSUER,
      audience: privyAppId,
    });

    return payloadToContext(verification.payload);
  } catch {
    throw new ApiError(401, "Invalid or expired Privy access token.");
  }
}

function getSessionSigningSecret(optional: true): string | null;
function getSessionSigningSecret(optional?: false): string;
function getSessionSigningSecret(optional = false): string | null {
  const secret = process.env.SESSION_SIGNING_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (optional) {
    return null;
  }

  throw new ApiError(
    500,
    "Missing required server environment variable: SESSION_SIGNING_SECRET.",
    false
  );
}

function signSessionPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function buildSessionToken(privyId: string): string {
  const secret = getSessionSigningSecret();
  const encodedPrivyId = Buffer.from(privyId, "utf8").toString("base64url");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${encodedPrivyId}.${expiresAt}`;
  const signature = signSessionPayload(payload, secret);
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): PrivyAuthContext | null {
  const secret = getSessionSigningSecret(true);
  if (!secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedPrivyId, expiresAtRaw, providedSignature] = parts;
  const payload = `${encodedPrivyId}.${expiresAtRaw}`;
  const expectedSignature = signSessionPayload(payload, secret);

  if (!secureEquals(providedSignature, expectedSignature)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const privyId = Buffer.from(encodedPrivyId, "base64url").toString("utf8");
  if (!privyId) {
    return null;
  }

  return {
    privyId,
    sessionId: null,
  };
}

export async function requirePrivyAuth(request: Request): Promise<PrivyAuthContext> {
  // 1) Prefer a fresh bearer token from the caller.
  const bearerToken = parseBearerToken(request);
  if (bearerToken) {
    return verifyPrivyJwt(bearerToken);
  }

  const cookieStore = await cookies();

  // 2) Accept Privy's own auth cookie if the app is configured to use it.
  const privyToken = cookieStore.get("privy-token")?.value?.trim();
  if (privyToken) {
    return verifyPrivyJwt(privyToken);
  }

  // 3) Fall back to our signed server cookie issued after successful login sync.
  const sessionToken = cookieStore.get(SKARBNIK_SESSION_COOKIE)?.value?.trim();
  if (sessionToken) {
    const sessionContext = verifySessionToken(sessionToken);
    if (sessionContext) {
      return sessionContext;
    }
  }

  throw new ApiError(
    401,
    "Authentication required. Include a valid Privy access token."
  );
}

export function assertPrivyOwnership(
  authContext: PrivyAuthContext,
  expectedPrivyId: string
): void {
  const normalizedExpected = expectedPrivyId.trim();
  if (!normalizedExpected || authContext.privyId !== normalizedExpected) {
    throw new ApiError(403, "You are not authorized to access this resource.");
  }
}

export function requireInternalApiKey(request: Request): void {
  const expectedKey = getRequiredEnv("INTERNAL_API_KEY");
  const providedKey = request.headers.get("x-internal-api-key")?.trim();

  if (!providedKey || !secureEquals(providedKey, expectedKey)) {
    throw new ApiError(401, "Internal API key is missing or invalid.");
  }
}

export function setSkarbnikSessionCookie(
  response: NextResponse,
  privyId: string
): void {
  const token = buildSessionToken(privyId);
  response.cookies.set({
    name: SKARBNIK_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
