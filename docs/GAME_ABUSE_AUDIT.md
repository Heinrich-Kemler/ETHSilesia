# Skarbnik — Game-Abuse Mechanics Audit

**Date:** 2026-04-18
**Scope:** Client cheat surface, server trust boundaries, reward tampering, identity spoofing, cost abuse.
**Out of scope:** On-chain contract audit (ERC-1155 mint internals), infra/devops, supply-chain.

This audit maps every way a user could earn XP, unlock a quest, pocket a badge, fake a streak, or burn our AI budget **without playing the game legitimately**. Each finding has a file:line reference, a severity, an owner tag, and a one-sentence remediation.

Owner tags used below:
- `[me]` — frontend / client hooks / UI state (what you and I own in this repo)
- `[Codex]` — API routes, server libs, DB schema (the server half)
- `[both]` — requires coordinated client + server changes

---

## Findings at a glance

| # | Vector | Severity | Owner |
|---|--------|----------|-------|
| 1 | Quiz answer keys shipped to browser | CRITICAL | both |
| 2 | Server trusts client-supplied `score` | CRITICAL | Codex |
| 3 | Streak + daily challenge are 100% localStorage | HIGH | both |
| 4 | `/api/ai/explain` unauthenticated, accepts `correctAnswer` | HIGH | Codex |
| 5 | Sequential-unlock gate not enforced server-side | HIGH | Codex |
| 6 | `.env.local` holds live Supabase service-role JWT | HIGH | ops |
| 7 | Privy ownership verified *after* client `userId` lookup | MEDIUM | Codex |
| 8 | Badge mint `txHash` path lacks nonce / replay guard | MEDIUM | Codex |
| 9 | `/api/leaderboard` unauthenticated (may leak wallet→privy map) | MEDIUM | Codex |
| 10 | Demo mode is a client flag only | LOW | — (accept) |
| 11 | Retry screen bypasses server → no evidence of attempt | LOW | me |
| 12 | `/api/ai/explain` XAI budget not capped globally | LOW | Codex |

No-finding areas (reviewed clean): direct XP/level PATCH routes, assessment endpoint (none exists — good), SUPABASE_SERVICE_KEY client-side usage (none), rate-limit coverage on mutation routes.

---

## 1. Quiz answer keys shipped to browser — CRITICAL `[both]`

**Where:** `src/lib/quests.ts` lines 1–1604. The file exports `correctIndex` on every question and is imported by the client page `src/app/(app)/quest/[id]/page.tsx` (`"use client"`, line 1).

```ts
// quests.ts ~L12
export type QuizQuestion = {
  question: QuizOption;
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
  correctIndex: 0 | 1 | 2 | 3; // ← in the bundle
};
```

**Impact.** Any user can open DevTools and run `window.__NEXT_DATA__` or read the JS chunk to extract every quest's answer key before clicking. Paired with finding #2 this is an instant path to full XP and every badge.

**Root cause.** Single source of truth is a client-reachable module.

**Remediation.**
- `[Codex]` Duplicate the answer keys into a server-only module (e.g. `src/lib/server/questCatalog.ts` already exists — extend it with `correctIndices`). Never export that file through anything reachable from the client bundle.
- `[Codex]` Add `GET /api/quests/[id]/questions` that returns `{ questions: [{ question, options }] }` — no `correctIndex` in the response.
- `[me]` Rewrite the client quiz page to fetch questions from that endpoint, collect the user's answers as an array of indices (`answers: number[]`), and submit the full vector to `/api/quests/complete`. Stop reading `correctIndex` on the client.

---

## 2. Server trusts client-supplied `score` — CRITICAL `[Codex]`

**Where:** `src/app/api/quests/complete/route.ts` L26–L59.

```ts
// L26
type CompleteQuestBody = { userId?: string; questId?: string; score?: number };
// L57
const score = normalizeScore(body.score, quest.questionCount);
const xpEarned = calculateQuestXp(quest, score);
```

The comment at L55–56 says "XP is computed on the server from trusted quest metadata. Client-provided XP is intentionally ignored" — true for `xpEarned` itself, but **`score` is still client-supplied**, and XP is derived from that. A user can `POST { userId, questId, score: quest.questionCount }` and collect full XP without answering a single question correctly.

**Root cause.** Score is an input, not a derived fact.

**Remediation.**
- Change the contract to `{ userId?, questId?, answers: number[] }`.
- Look up the server-only answer key by `questId` and compute `score = answers.filter((a, i) => a === key[i]).length`.
- Keep `normalizeScore` as a sanity-clamp, but on the *derived* score, not the client one.
- While you're in there: reject payloads where `answers.length !== quest.questionCount`.

(This also gives you per-question analytics for free — `INSERT INTO quest_attempts (user_id, quest_id, answers, completed_at)` lets you spot bots that always pick index 0.)

---

## 3. Streak + daily challenge are 100% localStorage — HIGH `[both]`

**Where:** `src/lib/streak.ts` L38–L51, L149–L161. Every read/write is `localStorage.getItem/setItem` on `skarbnik:streak:v1:<userId>`.

```ts
// L149
export function markActiveDay(userId: string | null): void {
  if (typeof window === "undefined") return;
  const data = read(userId);                 // localStorage
  const today = todayISO();
  data.activeDays[today] = true;
  // ...
  write(userId, data);                        // localStorage
}
```

**Impact.** DevTools → `localStorage.setItem('skarbnik:streak:v1:<id>', JSON.stringify({ activeDays: {<365 days of true>}, bestStreak: 365 }))` grants the 7-day `TREASURE_GUARDIAN` badge (see `quests/complete/route.ts` L155–157 — `newStreakDays >= 7`). However — important caveat — the **actual** streak used by the badge gate comes from the server row `users.streak_days`, which is computed by `calculateNextStreakDays` from `users.last_active`. So badge 5 is NOT directly forgeable via localStorage. Still forgeable: all UI streak displays, the daily challenge counter, and any future streak-gated rewards.

**Root cause.** Two sources of truth: server `users.last_active → streak_days` and client `localStorage.activeDays`. The client copy is writeable by the user.

**Remediation.**
- `[Codex]` Expose `GET /api/users/[userId]/streak` that returns `{ activeDays: string[], bestStreak, current }` derived from `quest_completions.completed_at` buckets (UTC day). Cache it.
- `[me]` Rip out the localStorage writer. Read-only mirror is fine for offline UI, but the authoritative source is the server.
- `[Codex]` When adding any streak-gated reward in the future (currently only badge 5, which is safe), always gate on `users.streak_days`, never on a client payload.

---

## 4. `/api/ai/explain` unauthenticated, accepts `correctAnswer` — HIGH `[Codex]`

**Where:** `src/app/api/ai/explain/route.ts` (no `requirePrivyAuth` call, accepts `correctAnswer: string` from body).

**Impact.**
- Anonymous users can call it in a loop and burn XAI quota (budget DoS). Rate-limit is 30/min per IP, trivially defeated with a residential proxy.
- `correctAnswer` is client-supplied, so the explanation text can be steered to a *wrong* "correct answer" by a malicious user sharing a link — social-engineering payload in educational context.
- Leaks question text the caller hasn't been authorized to see (someone could mine the full question bank by brute-forcing quest IDs).

**Remediation.**
- Add `await requirePrivyAuth(request)` at the top.
- Change the contract to `{ questId, questionIndex, userAnswer }` — fetch `question`, `options`, and `correctAnswer` server-side from the trusted quest catalog. Never accept them from the client.
- Verify the user has unlocked `questId` (see #5) before generating an explanation.
- Add per-user quota on top of the per-IP rate-limit (e.g. 100 calls / 24h / user).

---

## 5. Sequential-unlock gate not enforced server-side — HIGH `[Codex]`

**Where:** `src/app/api/quests/complete/route.ts` (gate exists client-side only, in `src/app/(app)/quest/[id]/page.tsx` L77–L99).

```ts
// page.tsx (client)
const questUnlocked = useMemo(() => {
  if (!quest) return true;
  return isQuestUnlocked(quest.id, completedQuests);
}, [quest, completedQuests]);
```

The server route happily inserts a completion for `l3-boss` even if the user has never touched `l1-*`. Combined with #1+#2, an attacker can POST completions for every quest in any order.

**Impact.** Skip the curriculum, collect all badges + XP instantly.

**Remediation.**
- In the complete route, after loading the quest definition, run the same `isQuestUnlocked(questId, serverCompletedQuests)` check using the server-side completed set. Reject with 403 if not unlocked.
- Add the helper to `src/lib/server/questCatalog.ts` (don't import from `src/lib/quests.ts` on the server — duplicate the unlock graph).

---

## 6. `.env.local` holds live Supabase service-role JWT — HIGH `[ops]`

**Where:** `/.env.local` L4.

```
SUPABASE_SERVICE_KEY=<REDACTED — real JWT in .env.local, not reproduced here>
```

> Note: the illustrative string that previously appeared here was a
> redacted excerpt (middle elided with `...`), but secret scanners often
> false-positive on partial JWTs. The example is now fully redacted to
> keep the doc safe to crawl.

Also exposed in the same file: `PRIVATE_KEY` (a raw ECDSA secret, L10), `XAI_API_KEY` (L5), `SESSION_SIGNING_SECRET` (L12), `INTERNAL_API_KEY` (L13).

**Impact (if this file ever lands in git or a build artifact):** full read/write on the Supabase project, ability to sign session cookies as anyone, sign and submit transactions from the deployer wallet, and burn the XAI budget.

**Remediation (treat all of these as already leaked and rotate).**
- Confirm `.gitignore` contains `.env.local` (standard Next.js ignore — verify).
- Rotate every secret in this file: regenerate Supabase service role key in the dashboard; `openssl rand -hex 32` for `SESSION_SIGNING_SECRET` and `INTERNAL_API_KEY`; new XAI key; fresh deployer wallet for `PRIVATE_KEY` and transfer ETH to the new address.
- Move production secrets to Vercel env vars (or wherever we deploy). `.env.local` should hold dev-only stubs.
- Add a `pre-commit` hook (or `ggshield`, `trufflehog`) that blocks commits containing JWT-shaped strings or `PRIVATE_KEY=`.
- Check `.next/` build output isn't leaking server env into the client bundle: `grep -r "SUPABASE_SERVICE_KEY" .next/static` should return nothing.

This one isn't game-abuse per se, but it was visible during the audit and deserves flagging.

---

## 7. Privy ownership verified after client `userId` lookup — MEDIUM `[Codex]`

**Where:** `src/app/api/quests/complete/route.ts` L40–L79 (same pattern in `src/app/api/users/[userId]/route.ts`).

```ts
// L40
const auth = await requirePrivyAuth(request);
// L43
const userId = body.userId?.trim();            // ← client-supplied
// L63–69
const { data: user } = await supabase.from("users").select(...).eq("id", userId);
// L79
assertPrivyOwnership(auth, user.privy_id);     // ← check happens AFTER lookup
```

The order is safe *today* because `assertPrivyOwnership` throws before any writes. But it's a pattern that invites future bugs: any future code path that reads or acts on `user` before line 79 would leak data cross-tenant. It also wastes a DB read for unauthorized requests.

**Remediation.** Invert the pattern: look the user up by `auth.privyId`, ignore any client `userId`.

```ts
const auth = await requirePrivyAuth(request);
const { data: user } = await supabase
  .from("users")
  .select(...)
  .eq("privy_id", auth.privyId)
  .maybeSingle();
if (!user) throw new ApiError(404, "User not found.");
// no assertPrivyOwnership call needed
```

Drop `userId` from the request body entirely. Apply the same refactor everywhere `userId` is taken from `body` or URL params.

---

## 8. Badge mint `txHash` path lacks nonce / replay guard — MEDIUM `[Codex]`

**Where:** `src/app/api/badges/mint/route.ts` — the `processPending` and direct-mint branches call `assertAndConsumeRequestNonce(...)`, but the user-submitted `txHash` branch only calls `requirePrivyAuth`.

**Impact.** A user who observes a real mint transaction on Base Sepolia (easy via Blockscout) can submit that `txHash` against their own account to get credit for a badge they didn't earn — or spam duplicate `badge_mint_jobs` rows. Mitigated by the on-chain receipt check inside the txHash branch (the tx's `to` and `from` must match expected values), but the exact hardness of that check depends on contract implementation.

**Remediation.**
- Require a nonce on the txHash path too.
- Verify the tx recipient is `user.wallet_address` AND the token ID minted matches `badgeId` before recording.
- Reject any `txHash` that already appears in `badge_mint_jobs.tx_hash` (unique constraint).

---

## 9. `/api/leaderboard` unauthenticated — MEDIUM `[Codex]`

**Where:** `src/app/api/leaderboard/route.ts` (no `requirePrivyAuth`).

**Impact.** Returns `(username, level, total_xp, wallet_address?, privy_id?)` to anyone with internet access. If the response includes `wallet_address` or `privy_id`, this is a PII / identity-correlation leak — scraping the endpoint nightly gives an attacker a full wallet↔privy↔email map.

**Remediation.**
- Strip `wallet_address` and `privy_id` from the leaderboard response. Return `{ username, level, total_xp }` only.
- Consider adding Privy auth regardless — leaderboards are typically behind login anyway.

I didn't read this route's source in full; please verify exactly what's in the SELECT.

---

## 10. Demo mode is a client flag only — LOW (accept)

**Where:** `src/lib/useDemoMode.ts` — reads `?demo=true` from `window.location.search`.

**Impact.** None server-side. The flag is purely UI state; all write routes gate on Privy auth. Listed here for completeness.

**Action:** none.

---

## 11. Retry screen bypasses server — no evidence of attempts — LOW `[me]`

**Where:** `src/app/(app)/quest/[id]/page.tsx` L262–L276 (the new `if (!allCorrect)` branch I just added).

**Impact.** When a user fails a quiz, nothing hits the server. That's correct for XP (no partial credit, as you specified), but it means we have no telemetry on who's struggling with what. Not a cheat vector, but a loss of signal — bots could grind the quiz forever without ever touching the server.

**Remediation (optional).** Fire-and-forget `POST /api/quests/attempt` with `{ questId, score, answersTotal, failed: true }` so analytics can see attempt rates. Do not grant XP on this endpoint. Rate-limit aggressively (maybe 20/min) to bound abuse.

---

## 12. `/api/ai/explain` XAI budget not capped globally — LOW `[Codex]`

Cross-reference with #4. Even after adding auth, a single compromised account could in principle run up a bill. Worth adding a global circuit-breaker: `SELECT COUNT(*) FROM ai_explain_calls WHERE created_at > now() - interval '1 day'`, and return a canned "AI offline" message over a threshold. Cheap insurance.

---

## Priority order for fixes

If we only have hours, not days:

1. **#6 (rotate secrets)** — zero user-facing work, but if that file ever leaked publicly the rest of the audit is moot.
2. **#1 + #2 + #5 together** — these three are the "full cheat chain". Fix them as a single PR: server-only answer keys, server-computed score, server-enforced unlock. Everything else in this audit is marginal compared to closing this chain.
3. **#3 (streak server-side)** — only matters if/when streak gates a real reward; badge 5 is already safe because it reads `users.streak_days`.
4. **#4** — cheap fix (add one `requirePrivyAuth` call) that closes the cost-abuse vector.
5. **#7, #8, #9** — hygiene passes; none are actively exploited but each is a loaded gun.

---

## What this audit did NOT cover

- Contract-level audit of the ERC-1155 `SkarbnikBadges` mint function.
- Privy's own threat model (token theft, wallet takeover).
- Supabase RLS policies — this audit assumes the service-role key is the only write path.
- Replay of badges that were minted on-chain but never recorded server-side (requires reading the mint job reconciler).
- Timing attacks on the Privy JWT verification path.
- Hardhat/foundry tests for the boss battle quest.

Flag any of these if you want a follow-up pass.
