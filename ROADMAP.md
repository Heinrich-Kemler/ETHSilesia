# Skarbnik Roadmap

This document is our honest picture of where the product goes after the
ETH Silesia 2026 hackathon submission. It covers three horizons:

- **Now** — what exists on `main` today.
- **Next** — what we commit to ship if/when we secure a pilot
  (PKO Bank Polski is the first target).
- **Later** — directional bets we want to try but that need data or
  partners before we invest.

Every "Next" item has an owner-ready design sketch. Nothing on the
"Next" list is speculative — each is scoped enough that an engineer
could pick it up on day one of a pilot phase.

Security-specific deferred items live in [SECURITY.md](./SECURITY.md);
this doc focuses on product and platform.

---

## Now (shipped, on `main`)

- **Gamified quest journey** — 3 levels, 6 questions per quest, per-answer
  explainers, fail-retry, streaks.
- **Privy auth + embedded wallet** — email/Google login, zero-friction
  onboarding for non-crypto users.
- **Soulbound badges on Base Sepolia** — 29-badge catalogue, ERC-1155,
  transfer-blocked.
- **AI coach** — Grok + Gemini RAG over a knowledge base, opt-in via
  `AI_ENABLED=true`.
- **Live scam alert feed** — daily CERT.PL ingest, 6-hour Cointelegraph
  ingest, Grok-transformed into bank-customer-facing guidance.
- **Daily email digest** — Resend-powered 19:00 Europe/Warsaw newsletter.
- **Leaderboard, profile, alerts, assessment surfaces.**
- **Polish-only UI** for a focused first release (EN strings retained
  for rehydration).

---

## Next (committed if the pilot signs)

### 1. Daily quest drop
**Owner bucket:** Content + Backend
**ETA:** Pilot week 2

The app is currently a finite course — complete all quests, you're
done. For retention we need **one new quest per day**, tied to a
topical hook. The pipeline:

1. Nightly (02:00 Europe/Warsaw) job picks the top CERT.PL + crypto-alert
   item from the last 24 hours' `scam_alerts` table.
2. Grok transforms it into a 6-question quest using the same
   bank-professional tone prompt we already use for alert copy.
3. A human editor (us during pilot, PKO ops in prod) approves or rewrites
   the draft in a lightweight admin UI before it goes live at 07:00.
4. Push notification + in-app badge: "Nowy quest — Phishing 2026-04-18".
5. Users who complete the day's quest within 24 h earn a **Gazeta Skarbnika**
   streak badge, reinforcing daily habit.

Why this matters: converts Skarbnik from "a course" to "a daily checkin
habit" — the same shape as Duolingo, Wordle, or a morning news briefing.

### 2. Push-notification nudges
**Owner bucket:** Mobile/PWA + Backend
**ETA:** Pilot week 3

Ship as a PWA first (Web Push API) to skip the App Store review loop.
Three notification types:

- **Alert push** (severity ≥ high) — new high-severity scam in the user's
  region.
- **Streak-at-risk** — 20:00 local time if the user has a >3-day streak
  and hasn't played today.
- **Daily-quest release** — 07:00 local time, today's new quest is live.

Opt-in by default off; explicit toggle in profile. GDPR consent captured
on first toggle.

### 3. Teacher / branch-employee dashboard
**Owner bucket:** Frontend + Backend
**ETA:** Pilot week 4

PKO runs in-person customer workshops at branches. Give branch
employees a read-only aggregate dashboard:

- How many customers at this branch have completed Level 1? Level 2?
- Which topics have the lowest completion rates (i.e., hardest quests
  locally) — so workshops can focus on real pain points.
- Distribution of streak lengths.

No individual PII — only branch-level aggregates. Reuses the existing
`leaderboard` RPC shape with an aggregation wrapper.

### 4. Multi-chain badge mirroring
**Owner bucket:** Contracts
**ETA:** Pilot week 5

Base Sepolia is perfect for dev and demos. For a real pilot:

- Redeploy `SkarbnikBadges` to **Base mainnet** as the primary badge
  chain (customer-visible proof of earning).
- Add a lightweight mirror contract on **Polygon** so PKO's existing
  IKO app loyalty-integration rail can surface badges natively.
- Bridge events, not balances — the mirror emits the same `TransferSingle`
  event but stores no duplicate supply.

### 5. Polish + English parity
**Owner bucket:** i18n + Content
**ETA:** Pilot week 6

The `useLanguage` hook is currently a PL-only stub. The `i18n.ts`
dictionary already has full EN strings from an earlier release. Turning
EN back on is a two-line change + a content pass to verify every quest
question is translated.

This unblocks showing the product to non-PKO partners (English-speaking
Polish expats, ERC-wide audiences, conference judges).

### 6. Real IPFS metadata + metadata freeze
**Owner bucket:** Contracts + Ops
**ETA:** Pilot week 1 (blocker for real badges)

Currently the badge base URI is `ipfs://QmSkarbnik…Placeholder/` —
OpenSea and wallets show nothing for our badges. To fix:

1. Render final badge images (29 SVGs exist; art pass for production
   gloss is in `docs/CLAUDE_DESIGNER_BRIEF.md`).
2. Pin the full metadata directory to Pinata and web3.storage (two
   providers for redundancy).
3. Call `setBaseMetadataURI(newURI)` once.
4. Call `freezeMetadata()` — one-way, cannot be changed after this.

### 7. Atomic XP + signed quest attempts
**Owner bucket:** Backend
**ETA:** Pilot week 1

See [SECURITY.md](./SECURITY.md) items 7–8. Anti-cheat hardening that
wasn't demo-blocking but must land before a real customer pilot.

---

## Later (ideas we want to validate with data)

Ordered roughly by "shape of the evidence we'd need to commit."

### Adaptive difficulty

Use Gemini to score not just correctness but *answer quality*
(in free-text challenge questions) and build a per-topic mastery
graph per user. Next quest is chosen based on the user's weakest
topic. Requires real quiz telemetry from a pilot cohort — can't be
designed from first principles.

### Offline mode for workshops

Branch workshops happen in rural areas with flaky connectivity.
A ServiceWorker + local Supabase cache that enables a whole Level 1
run without network, then syncs when online. Only worth the cost
after measuring actual workshop pain.

### Real-money topics

A Level 4 unlocked only for users who complete Levels 1–3 with a
high mastery score, teaching actual DeFi primitives: Aave lending,
Uniswap swaps, bridge risk, MEV. Requires legal review — we are not
giving financial advice, we are educating, and the line must be
extremely clear in Polish regulatory context.

### Community-submitted quests

A Polygon-based curation market where users propose quests, stake
tokens on their own proposals, and earn if the community upvotes
and completes them at a high rate. Only interesting if we have
organic user growth; otherwise just theatre.

### B2B API for other banks

Santander, BNP, Alior, and the Polish Banking Association have
overlapping customer-education mandates. A multi-tenant SaaS cut
of Skarbnik with white-labeled theming and shared alert feed
could be a real business after PKO proves the model.

### Insurance integrations

Partner with a cyber-insurance product to offer premium discounts
to users with a high Skarbnik mastery score. Mechanism-compatible
proof-of-education. Needs actuarial validation and an insurance
partner — not a week-one bet.

---

## Known "nice to have" (small, self-contained)

These are small quality-of-life improvements we'd take a PR for from
anyone:

- **Keyboard-first quiz UI** — currently mouse-primary. Tab + number-key
  answer selection would speed up demos.
- **Anonymous read of leaderboard without auth** — already public data
  but currently requires a session cookie to render (Privy wrapping).
- **Dark-mode polish on PKO theme** — the dual-theme system ships but
  the PKO light theme has a few low-contrast spots flagged in the
  designer brief.
- **Screenshot-friendly mode** — hides the scroll chrome + stat
  badges, leaves just mascot + quest card. For marketing export.
- **Replay-last-answer explainer** — users currently have to re-open
  the explainer manually; a small "replay" icon on the next card
  would surface it on demand.
- **Supabase migration CI check** — prevent merging migrations that
  fail a dry run against the staging schema.
- **Content-Security-Policy** — shipped as baseline headers, CSP
  deferred pending per-origin testing (see [SECURITY.md](./SECURITY.md)).

---

## Out of scope

Things we have explicitly decided **not** to do, so no one spends a
sprint on them before arguing with the team first:

- **Custodial funds.** Skarbnik does not hold user money. Ever. The
  embedded wallet is user-controlled (Privy), and the app never
  prompts for transactions that move value beyond badge minting
  (which the protocol pays for).
- **Mainnet without multisig.** Badges do not get minted on a
  mainnet (Base or otherwise) until the deployer key is a Gnosis
  Safe and the runtime minter is a separate hot key. No exceptions
  for "just this one demo."
- **Influencer-shilled token.** There is no Skarbnik token, no airdrop,
  no rev-share. The business model is B2B licensing to banks.
- **English-first anywhere.** Polish is the primary language for the
  pilot audience. English parity comes back once we have PL quality
  locked.

---

## How this doc is maintained

- **Quarterly review** in a team doc; completed items move from Next
  to Now with a dated note; new items enter at the bottom of the
  appropriate horizon.
- Every item should be **actionable enough that a single engineer can
  start on it**; if it's not, it lives in product backlog, not here.
- Completed items keep their "ETA" field as a historical record of
  whether we estimated well.
