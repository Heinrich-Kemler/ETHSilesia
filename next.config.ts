import type { NextConfig } from "next";

/* ──────────────────────────────────────────────────────────────────────────
 * Baseline security headers
 *
 * Applied to every route (`source: "/:path*"`). These are the low-risk,
 * broadly-compatible headers — nothing that would break Privy popups,
 * wallet extensions, or Framer Motion animations.
 *
 * Intentionally NOT including a full Content-Security-Policy here: a
 * strict CSP needs per-origin testing against Privy, WalletConnect,
 * Supabase, xAI, and Gemini, and we don't have time to verify it before
 * the pilot. Treat CSP as a post-submission hardening task.
 *
 * Header rationale:
 * - Strict-Transport-Security: force HTTPS for 2 years on this host
 *   and every subdomain. `preload` is an opt-in promise; fine here
 *   because the app is HTTPS-only in production.
 * - X-Content-Type-Options: stops MIME sniffing attacks.
 * - X-Frame-Options SAMEORIGIN: blocks third-party clickjacking while
 *   still allowing Privy's same-origin helper frames. DENY would also
 *   be acceptable but is slightly riskier against Privy SDK updates.
 * - Referrer-Policy: strip the path on cross-origin referrers so we
 *   never leak quest IDs / user hashes to outbound links.
 * - Permissions-Policy: explicitly deny browser features the app
 *   never uses. Minimises attack surface if a future dep loads a
 *   compromised iframe.
 * ────────────────────────────────────────────────────────────────────────── */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework to attackers scanning for CVEs.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
