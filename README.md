# Skarbnik — Gamified DeFi Safety Education

> Named after the legendary Silesian mine spirit who guards miners from harm,
> Skarbnik is a gamified, AI-assisted learning journey that teaches bank
> customers how to stay safe in DeFi, Web3, and everyday online finance.

**Built for:** ETH Silesia 2026 Hackathon
**First intended pilot:** PKO Bank Polski
**Status:** Demo-ready, backend hardened post-audit, production roadmap below.

---

## Why this exists

Polish banks onboard millions of retail customers into increasingly digital
financial products — but fraud losses track that growth almost linearly.
Traditional "watch this 45-minute video" compliance training does not
change customer behaviour at scale.

Skarbnik reframes the problem: **bite-sized quests → XP → on-chain badges
→ a mascot who remembers you**. A customer who has earned the Silver
Treasurer badge for spotting a fake PKO SMS flow is measurably less
likely to click one in the wild two weeks later.

The same mechanics that onboard users to Duolingo onboard retail users
to "what is a seed phrase, and why should you never type it anywhere."

---

## What's in the repo

### Product surface (`src/app/`)

- **Landing** (`/`) — hero + how-it-works + CTA, gated behind Privy auth with
  stuck-session recovery.
- **Quest hub** (`/quest`) — chapter path view with unlock progression.
- **Quest player** (`/quest/[id]`) — 6-question quiz with per-answer explainers,
  fail-retry, streak tracking, coach chat FAB.
- **Badges** (`/badges`) — ERC-1155 soulbound badges minted on Base Sepolia.
- **Leaderboard** (`/leaderboard`) — XP-ranked public board.
- **Profile** (`/profile`) — personal stats, streak, earned badges.
- **Alerts** (`/alerts`) — live feed of scam/phishing advisories scraped from
  CERT.PL + Niebezpiecznik + Cointelegraph, transformed by Grok into
  bank-customer-facing guidance.
- **Assessment** (`/assess`) — onboarding skill-level check.

### Backend (`src/app/api/`)

| Route | Purpose |
|---|---|
| `users/create`, `users/[userId]` | Privy → Supabase user sync |
| `quests/complete` | Server-gated quest completion + XP/level/streak/badge logic |
| `badges/mint` | Enqueue soulbound badge mint (async worker) |
| `ai/chat` | Coach chat: Privy-authed, Grok + Gemini RAG over a knowledge base |
| `ai/explain` | Post-answer contextual explainer via Grok |
| `alerts`, `alerts/fetch` | Scam alert feed + cron-triggered ingestion |
| `cron/sync-scams` | Daily CERT.PL RSS → Grok → `scam_alerts` (Vercel Cron 08:00) |
| `cron/send-newsletter` | Daily digest email via Resend (Vercel Cron 19:00) |
| `leaderboard` | Public XP ranking |

### Smart contracts (`contracts/`)

- **`SkarbnikBadges.sol`** — OpenZeppelin ERC-1155 with transfer blocking
  (soulbound). Owner-only minting, badge-existence checks, duplicate-ownership
  prevention.
- Deployed to Base Sepolia at
  [`0x7e05eDfd2509eE95170636D1A61Af7B6cb9e7902`](https://sepolia.basescan.org/address/0x7e05eDfd2509eE95170636D1A61Af7B6cb9e7902)
  (chainId `84532`).
- Metadata base URI is still a placeholder — real IPFS pinning is tracked
  in [ROADMAP.md](./ROADMAP.md).

### Database (`supabase/migrations/`)

15 migrations covering: users, quest_completions, badges, badge_mint_jobs,
chat_history, knowledge_base (vector-embedded RAG corpus), scam_alerts,
RLS hardening, public_id nonces, and an expanded 29-badge catalogue.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.2.4 (App Router, Turbopack)** | Edge-friendly, RSC for static marketing + dynamic API routes in one deploy |
| UI | **React 19.2.4 + Tailwind v4 + Framer Motion** | Motion-heavy landing, accessible component primitives |
| Auth | **Privy v3.21.3** | Email/Google login + embedded wallet — zero-friction onboarding for non-crypto users |
| DB | **Supabase (Postgres + pgvector)** | Row-level security, JWT verification, vector RAG in one managed service |
| AI | **xAI Grok + Google Gemini (embeddings)** | Grok for Polish-native chat + alert summarisation; Gemini for embedding match |
| Chain | **Base Sepolia (testnet)** | Cheap, fast, OP-stack-compatible — easy prod migration to Base mainnet |
| Contracts | **OpenZeppelin ERC-1155** | Soulbound via `_update` override, owner-gated mint |
| Email | **Resend** | Transactional reliability for the daily scam digest |
| Deploy | **Vercel + Vercel Cron** | Zero-config cron on the same platform as the app |

---

## Running locally

### Prerequisites

- Node 20 LTS (the contract pipeline warns on Node 25; the Next app
  itself runs on 20+)
- A Supabase project (free tier is fine) with migrations applied
- A Privy app (get the App ID + JWT verification key from the dashboard)
- A Base Sepolia RPC endpoint (the default public one works)
- `XAI_API_KEY` and `GEMINI_API_KEY` if you want the coach chat
- `RESEND_API_KEY` only if you plan to test the newsletter cron

### Steps

```bash
git clone https://github.com/Heinrich-Kemler/ETHSilesia.git
cd ETHSilesia
npm install
cp .env.example .env.local
# Fill in the env vars — see .env.example for the full list
npx hardhat compile                  # optional — compile contracts
npm run dev                          # http://localhost:3000
```

The dev port is locked to **3000** in `.claude/launch.json` because the
Privy OAuth redirect is allowlisted to that origin.

### Try the demo flow without filling env vars

Append `?demo=true` to any route to switch to a read-only demo user.
Bypasses Privy + Supabase entirely — useful for stage demos with flaky
conference wifi.

---

## Deploying to Vercel

1. Import the repo to Vercel.
2. Set environment variables (see [.env.example](./.env.example) for the full
   list). **All of these matter:**
    - `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_JWT_VERIFICATION_KEY`
    - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SESSION_SIGNING_SECRET` — `openssl rand -hex 32`
    - `INTERNAL_API_KEY` — `openssl rand -hex 32`
    - **`CRON_SECRET`** — required; the three cron routes fail-closed
      without it and Vercel Cron jobs will 401
    - `PRIVATE_KEY`, `BASE_SEPOLIA_RPC`, `SKARBNIK_BADGES_ADDRESS`
    - `AI_ENABLED=true` if you want the live Grok+Gemini coach
    - `XAI_API_KEY`, `GEMINI_API_KEY` when AI_ENABLED is true
    - `BASESCAN_API_KEY` for contract verification
    - `RESEND_API_KEY`, `ADMIN_EMAIL` if sending newsletters
3. The `vercel.json` schedules three cron jobs. Vercel attaches the
   `Authorization: Bearer $CRON_SECRET` header automatically.

---

## Security

The backend was audited on 2026-04-18 (parallel human + Codex review). All
Critical and High findings that were demo-blocking shipped in
[PR #13](https://github.com/Heinrich-Kemler/ETHSilesia/pull/13). Deferred
items, with rationale, are in [SECURITY.md](./SECURITY.md) and
[ROADMAP.md](./ROADMAP.md).

**Fixed pre-submission (P0 + partial P1/P2):**
- Deleted unauthenticated `/api/test-insert-user` debug endpoint.
- Inverted cron auth to fail-closed across all three cron routes.
- Hardened `/api/ai/chat`: TDZ bug, PII-free logs, unconditional auth,
  env-gated AI flag, correct DB columns.
- Server-side quest prerequisite gate in `/api/quests/complete`.
- HSTS + X-Content-Type-Options + X-Frame-Options + Referrer-Policy +
  Permissions-Policy on all routes.
- Removed `X-Powered-By` header.

**Deferred (not demo-blocking — tracked in [ROADMAP.md](./ROADMAP.md)):**
- Signed per-attempt tokens for answer verification (anti-score-tampering).
- Atomic XP update via Postgres function.
- Redis-backed distributed rate limiter.
- Full Content-Security-Policy with per-origin testing against Privy /
  WalletConnect / Supabase.
- Multisig deployer key + separate runtime minter key.
- Real IPFS pinning of the badge metadata (currently a placeholder CID).

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

---

## Roadmap (post-hackathon)

High-impact items the team is committed to shipping for a real
PKO-branded pilot. Full list with rationale in
[ROADMAP.md](./ROADMAP.md).

- **Daily quest drop** — one new topical quest per day pushed to
  every active customer, driven by the previous night's CERT.PL + RSS
  ingestion. Turns the app into a habit instead of a one-off course.
- **Push-notification nudges** for new scam advisories, streak-at-risk,
  and daily-quest release.
- **Multi-chain badge mirroring** — keep Base Sepolia for dev, mirror
  to Base mainnet for pilot and Polygon for PKO's existing loyalty
  rail integration.
- **Teacher/branch-employee dashboard** — aggregate progress view for
  PKO bank-branch staff who run in-person workshops.
- **Polish + English parity** re-enabled (currently PL-only to ship
  a focused first release).
- **Adaptive difficulty** — Gemini-scored answer quality + per-topic
  mastery graph decides the next quest.

---

## Contributing

This is an active hackathon project. If you're from PKO, CERT.PL, or
another Polish institution interested in the pilot, please open an
issue or reach us via the team contacts in the pitch deck.

---

## License

Code is MIT. Content (quest text, explainer copy, mascot art direction)
is © the Skarbnik team — talk to us before reusing.
