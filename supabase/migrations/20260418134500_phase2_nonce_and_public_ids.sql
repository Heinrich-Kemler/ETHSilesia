-- Phase 2 hardening:
-- 1) replay-protection nonce registry for privileged internal routes
-- 2) public user identifier for leaderboard/privacy-safe sharing

create table if not exists public.api_request_nonces (
  nonce text primary key,
  scope text not null,
  requested_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists api_request_nonces_created_idx
  on public.api_request_nonces (created_at desc);

alter table public.api_request_nonces enable row level security;
revoke all on table public.api_request_nonces from anon, authenticated;

drop policy if exists api_request_nonces_service_role_all on public.api_request_nonces;
create policy api_request_nonces_service_role_all
on public.api_request_nonces
for all
to service_role
using (true)
with check (true);

alter table public.users add column if not exists public_id uuid;

update public.users
set public_id = gen_random_uuid()
where public_id is null;

alter table public.users
  alter column public_id set default gen_random_uuid(),
  alter column public_id set not null;

create unique index if not exists users_public_id_idx
  on public.users (public_id);

create or replace view public.leaderboard as
select
  u.id as user_id,
  u.public_id as player_id,
  coalesce(nullif(u.username, ''), concat('user_', substr(u.wallet_address, 3, 6))) as username,
  u.total_xp,
  u.level
from public.users u;
