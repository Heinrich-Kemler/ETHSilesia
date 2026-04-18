# Security Posture

Last reviewed: **2026-04-18** (pre-hackathon submission)
Reviewers: internal team, independent Codex audit

This document captures what is hardened today, what was deliberately
deferred, and how to report a vulnerability. It is kept up to date as
remediation lands — every row here either has a PR link or a tracking
issue.

---

## Threat model

Skarbnik is a retail-consumer educational app with a financial-literacy
slant. The assets that matter are:

1. **User PII** — names, emails, Privy IDs, wallet addresses linked to
   Supabase user rows.
2. **Paid-API credits** — xAI Grok and Google Gemini calls cost real
   money on every request. Any public amplifier is a billing DoS.
3. **Badge-chain integrity** — ERC-1155 minter keys. A compromised
   minter can forge badges for non-earning accounts, devaluing the
   reward system.
4. **Editorial trust** — scam-alert feed content. Poisoning it (e.g.,
   injecting a link to a real phishing site "for protection") turns
   the app into an attack vector against its own users.

Every fix and deferred item below maps to one of these four buckets.

---

## Fixed — shipped before submission

All merged into `main` via [PR #13](https://github.com/Heinrich-Kemler/ETHSilesia/pull/13).

### Critical

| # | Issue | Fix | Bucket |
|---|---|---|---|
| 1 | `/api/test-insert-user` accepted unauthenticated service-role upserts against a fixed UUID. | Route deleted entirely (`70e0574`). | 1 |
| 2 | Three cron routes (`/api/cron/sync-scams`, `/api/cron/send-newsletter`, `/api/alerts/fetch`) skipped auth when `CRON_SECRET` env was unset, making them publicly triggerable. | Inverted to fail-closed: missing-or-mismatched → 401 (`8295e01`). | 2, 4 |

### High

| # | Issue | Fix | Bucket |
|---|---|---|---|
| 3 | `/api/ai/chat` referenced `sessionId` before declaration (ReferenceError 500 on every call), had an undefined `userErr` identifier, selected the wrong DB columns so every user looked like a level-1 anon to the coach, logged raw `userQuery` (possible seed-phrase PII), and only required Privy auth when the client happened to send `body.userId`. | Full rewrite of the request preamble: auth is unconditional, session ID derives from the authed Privy ID, logs drop PII, DB select covers every column the handler reads, `AI_ENABLED` is env-driven (`4f2a343`). | 1, 2 |
| 4 | `/api/quests/complete` trusted whatever `questId` the client POSTed — a direct call could farm level-3 boss XP + badges as a first action, bypassing the UI's unlock gate. | Server now fetches the user's prior completions and runs `isQuestUnlocked(questId, prior)` before accepting the write; returns 403 on locked quests (`5020de8`). | 4 |

### Medium / Operational

| # | Issue | Fix | Bucket |
|---|---|---|---|
| 5 | `next.config.ts` shipped empty — no HSTS, no X-Frame-Options, no Referrer-Policy, advertised `X-Powered-By: Next.js`. | Baseline security headers on every route + `poweredByHeader: false` (`0f02ad2`). | 1, 2 |
| 6 | `docs/GAME_ABUSE_AUDIT.md` showed a partially-redacted JWT example (`eyJ...<tail>`) which secret scanners false-positive as a live key. | Replaced with explicit `<REDACTED>` placeholder (`0f02ad2`). | 1 |

---

## Deferred — tracked for post-submission

Not demo-blocking. Each row has a rationale for deferring and an
estimated landing window.

### P1 — anti-cheat hardening (target: week 1 post-pilot signing)

| # | Issue | Why deferred | Plan |
|---|---|---|---|
| 7 | Server still clamps client-reported score to `[0, questionCount]` but does not re-verify answers against the canonical set. A scripted caller can always claim a perfect score. | Fixing this requires a new `/api/quests/:id/start` endpoint issuing an HMAC-signed attempt token that embeds the correct-answer hash, plus a client refactor to carry the token through to `/complete`. Architectural change — too risky to land in the final hackathon day. | Ship `questAttempt.ts` helper (HMAC sign/verify bound to `userId + questId + issuedAt + correctHash`); gate `/complete` on a valid attemptToken; rate-limit `/start` per user. |
| 8 | XP update is read-modify-write across two Supabase queries — two simultaneous *different-quest* completions could lose XP. (Same quest is blocked by the unique constraint.) | Requires a Postgres function and a DB migration. Race window is ~1 second and requires concurrent distinct submits; does not affect single-user demo. | New migration exposes `record_quest_completion(p_user, p_quest, p_xp, ...)` that inserts the completion, increments XP, recomputes level, recomputes streak, returns the new snapshot — all inside one transaction. |
| 9 | Rate limiter is in-memory per Vercel function instance and trusts `x-forwarded-for`. | On Vercel's edge runtime, instances are short-lived and `x-forwarded-for` is already the attacker-set value. Moving to Upstash Redis is infra work, not code work. | Swap `src/lib/server/rateLimit.ts` to Upstash; key on `privyId` (authed) or the Vercel-signed real client IP header (anon). |

### P2 — data-layer hardening (target: before prod rollout)

| # | Issue | Plan |
|---|---|---|
| 10 | `scam_alerts` table missing from the RLS hardening migration at `supabase/migrations/20260418121000_security_rls_hardening.sql`. | New migration: `alter table scam_alerts enable row level security; revoke all on scam_alerts from anon, authenticated; create policy "read-only-active" for select using (active = true);`. |
| 11 | Badge mint worker (`src/lib/server/badgeMinting.ts`) fetches oldest pending job without a row lock — concurrent workers could double-process. | Change to `UPDATE badge_mint_jobs SET status='processing' WHERE id = (SELECT id FROM badge_mint_jobs WHERE status='pending' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`. |
| 12 | Badge mint retries have no `attempt_count` cap → a permanently-bad job retries forever. | Add `attempt_count INTEGER DEFAULT 0` (already in schema) check — route to `dead_letter` after 3 failures. |
| 13 | Cron/alerts routes include full internal logs in the response body. | Strip logs from the response (`res.json({ ok: true, stats })`); keep logs server-side via `console.log` only. |
| 14 | Newsletter HTML includes `source_url` without escaping. | HTML-escape + protocol-allowlist (`https:` only) before interpolating. |

### P3 — platform / ops (target: opportunistic)

| # | Issue | Plan |
|---|---|---|
| 15 | Full Content-Security-Policy is not set. Baseline headers ship, but CSP needs per-origin testing against Privy, WalletConnect, Supabase, xAI, Gemini, and Resend. | Iterate a strict CSP in report-only mode for a week on staging, then enforce. |
| 16 | Badge deployer key doubles as runtime minter key. A single leak compromises ownership + live minting. | Move deployer role to a Base-network Gnosis Safe multisig; the runtime minter role stays on a hot key with much smaller blast radius. Requires contract `AccessControl` refactor — already designed in `docs/Skarbnik_Architecture_Execution_Doc.md`. |
| 17 | Badge metadata is pinned under a placeholder CID (`ipfs://QmSkarbnik…Placeholder/`). | Pin real metadata to Pinata/web3.storage, call `setBaseMetadataURI` once, then `freezeMetadata` (one-way) to lock the collection. |
| 18 | `npm audit` reports 25 vulns (mostly dev toolchain, 2 moderate in the axios chain). | Quarterly dependency bump; CI policy: no merge on **high** or above in runtime deps. |
| 19 | Hardhat warns on Node 25 for the contract pipeline. | Pin contract tooling to Node 20 LTS in a separate `package.json` engine constraint. |

---

## Reporting a vulnerability

- **Preferred:** open a [GitHub Security Advisory](https://github.com/Heinrich-Kemler/ETHSilesia/security/advisories/new)
  (private by default — only maintainers see it until disclosed).
- **Backup:** open a **private** issue addressed to `@Heinrich-Kemler`
  if the advisory UI is unavailable.
- Do **not** post exploit details in public issues, PRs, Discord, etc.
- We aim to acknowledge within 48 h and ship a fix or mitigation within
  7 days for Critical/High severities; Medium/Low get folded into the
  normal release cadence.

When reporting, please include:

1. A short description of the issue and where it lives (file + line,
   route, contract function).
2. Reproduction steps with the minimum payload.
3. Observed impact — what an attacker can do with this.
4. (Optional but appreciated) your proposed fix.

---

## Audit trail

- 2026-04-18 — pre-submission audit (internal + Codex). 2 Critical, 4 High,
  5 Medium, 3 Low. Critical + 3 High + 2 Medium landed in PR #13.
  Remainder tracked above.

Each future audit will be appended as its own dated section here, with a
link to the PRs that remediated its findings.
