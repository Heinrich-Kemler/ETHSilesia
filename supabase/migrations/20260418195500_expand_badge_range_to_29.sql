-- Expand badge ID range from 1..26 to 1..29 for level-completion NFTs.
-- Safe to run repeatedly.

alter table if exists public.badges
  drop constraint if exists badges_badge_id_check;

alter table if exists public.badges
  add constraint badges_badge_id_check check (badge_id between 1 and 29);

alter table if exists public.badge_mint_jobs
  drop constraint if exists badge_mint_jobs_badge_id_check;

alter table if exists public.badge_mint_jobs
  add constraint badge_mint_jobs_badge_id_check check (badge_id between 1 and 29);
