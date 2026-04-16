create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  privy_id text not null unique,
  wallet_address text not null,
  username text,
  google_email text,
  level integer not null default 1 check (level >= 1),
  total_xp integer not null default 0 check (total_xp >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  last_active timestamptz,
  language text not null default 'pl' check (language in ('pl', 'en')),
  created_at timestamptz not null default now()
);

create index if not exists users_total_xp_idx
  on public.users (total_xp desc, created_at asc);

create table if not exists public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  quest_id text not null,
  xp_earned integer not null check (xp_earned >= 0),
  completed_at timestamptz not null default now(),
  answers_correct integer not null default 0 check (answers_correct >= 0),
  answers_total integer not null default 0 check (answers_total >= 0),
  unique (user_id, quest_id)
);

create index if not exists quest_completions_user_completed_idx
  on public.quest_completions (user_id, completed_at desc);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id integer not null check (badge_id between 1 and 5),
  tx_hash text,
  minted_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists badges_user_minted_idx
  on public.badges (user_id, minted_at desc);

create or replace view public.leaderboard as
select
  u.id as user_id,
  coalesce(nullif(u.username, ''), concat('user_', substr(u.wallet_address, 3, 6))) as username,
  u.total_xp,
  u.level
from public.users u;
