# Skarbnik — Architecture, Flows, and Build Considerations

Date: 2026-04-16
Project: ETH Silesia Hackathon

## 1) Visual Diagrams

### System Architecture Diagram
- [Open System Architecture Flow (FigJam)](https://www.figma.com/online-whiteboard/create-diagram/cef0fcd0-c146-49e9-b0d7-869d76c9cdd3?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=6688ac4f-dacc-424b-a541-b30b874a1f7e)

### End-to-End User Journey Diagram
- [Open User Journey Flow (FigJam)](https://www.figma.com/online-whiteboard/create-diagram/3c4ac72b-a14b-40be-8f81-6abaac42dead?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=c4e404da-572b-4297-b72a-f2453704209a)

## 2) Current Build Reality (Honest Snapshot)

### Working now
- Landing page and major marketing sections.
- API routes for users, quests, leaderboard, and AI endpoints.
- Supabase schema migration for users/quests/badges/leaderboard view.
- ERC-1155 contract source + deployment script.

### Not yet complete
- Core app pages (assessment, quest hub, quest runtime, profile, leaderboard page view).
- Real frontend wiring to API routes.
- On-chain mint integration in backend.
- Proven Base Sepolia deployment (deployments file currently empty).

## 3) What Else You Could Add (Practical Enhancements)

### A) Demo-critical UX upgrades
1. Guided first-run onboarding (3-step tooltip tour).
2. Quest progress autosave (resume where user left off).
3. "Demo mode" seed account with preloaded progress.
4. Toast system for success/failure feedback.
5. Simple skeleton loaders for all data views.

### B) Gamification upgrades
1. Daily quest + streak bonus multiplier.
2. XP multipliers for difficult quests.
3. Achievement rarity tiers (Common/Rare/Epic).
4. Seasonal leaderboard resets.
5. Team quests (2-3 person collaborative tasks).

### C) AI coach upgrades
1. Context-aware hints based on current question.
2. "Explain like I'm 12" toggle.
3. Dual response mode: concise vs deep dive.
4. Safety guardrails for financial advice refusal.
5. Retry queue/fallback responses when OpenAI is unavailable.

### D) Web3 + badge ecosystem upgrades
1. Badge metadata hosting finalized (IPFS pinning strategy).
2. Badge claim history page with tx links to Basescan.
3. Optional soulbound mode for non-transferable learning badges.
4. Batch mint job for delayed/retry-safe badge fulfillment.
5. Badge gallery share card for social posting.

### E) Engineering reliability upgrades
1. Privy identity verification on every write endpoint.
2. Rate limiting on AI endpoints.
3. Idempotency keys for quest completion and minting.
4. Structured logs with correlation IDs.
5. Basic E2E smoke test: login -> quest -> XP -> leaderboard.

### F) Product/analytics upgrades
1. Funnel metrics: landing -> login -> first quest complete.
2. Drop-off analysis by quest difficulty.
3. AI usage metrics per quest.
4. Leaderboard engagement metrics.
5. Session replay or event timeline for demo debugging.

## 4) Build Considerations Before Coding More

1. Define canonical user identity:
- Use Privy user ID as auth root.
- Map to internal `users.id` in Supabase.

2. Define source of truth for progression:
- XP, level, streak in DB only.
- Frontend should never be trusted for progression state.

3. Separate "badge awarded" vs "badge minted":
- Awarding is gameplay state.
- Minting is asynchronous chain side effect.

4. Add a job/retry approach for blockchain calls:
- Do not block UX on chain finality.
- Mark pending and reconcile later.

5. Protect hackathon demo from dependency failures:
- OpenAI fallback copy.
- Privy fallback UI state.
- Chain fallback as "mint pending".

## 5) Suggested Next Sprint Split

### Developer A (Frontend)
1. Build assessment + quest hub + active quest pages.
2. Wire auth state and route guards.
3. Connect UI to `/api/users/create`, `/api/quests/complete`, `/api/leaderboard`, `/api/ai/chat`.
4. Add XP/level-up and badge status UI.

### Developer B (Backend/Chain)
1. Deploy contract to Base Sepolia and record deployment.
2. Implement on-chain mint call in `/api/badges/mint`.
3. Add auth verification and idempotency.
4. Add test fixtures + smoke tests.

### Shared
1. Align quest payload schema.
2. Align error handling contract (codes/messages).
3. Rehearse full live demo flow with one "clean" user.

## 6) Demo-Ready Definition (Minimum)

1. User can log in via Google (Privy).
2. User is created in Supabase.
3. User completes at least one quest.
4. XP and level persist and show in UI.
5. Leaderboard shows real ranking movement.
6. AI coach responds (or graceful fallback).
7. Badge is awarded and at least one mint path is demonstrated.

---

If needed, this document can be converted into `.docx` or PDF for sponsor/shareholder handoff.
