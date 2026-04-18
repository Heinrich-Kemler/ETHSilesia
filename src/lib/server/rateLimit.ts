import { ApiError } from "@/lib/server/apiErrors";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitParams = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

const globalStore = globalThis as typeof globalThis & {
  __skarbnikRateLimitStore?: Map<string, Bucket>;
};

function getStore(): Map<string, Bucket> {
  if (!globalStore.__skarbnikRateLimitStore) {
    globalStore.__skarbnikRateLimitStore = new Map<string, Bucket>();
  }

  return globalStore.__skarbnikRateLimitStore;
}

function requestIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  return "unknown";
}

export function assertRateLimit(request: Request, params: RateLimitParams): void {
  const { key, maxRequests, windowMs } = params;
  const store = getStore();
  const now = Date.now();
  const identity = `${key}:${requestIdentifier(request)}`;
  const bucket = store.get(identity);

  if (!bucket || bucket.resetAt <= now) {
    store.set(identity, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (bucket.count >= maxRequests) {
    throw new ApiError(
      429,
      "Too many requests. Please wait a moment and try again."
    );
  }

  bucket.count += 1;
}
