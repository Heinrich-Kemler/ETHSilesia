create table if not exists public.badge_mint_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  wallet_address text not null,
  badge_id integer not null check (badge_id between 1 and 5),
  status text not null default 'pending' check (status in ('pending', 'sending', 'submitted', 'confirmed', 'failed')),
  tx_hash text,
  error_message text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists badge_mint_jobs_status_created_idx
  on public.badge_mint_jobs (status, created_at asc);

create index if not exists badge_mint_jobs_user_created_idx
  on public.badge_mint_jobs (user_id, created_at desc);

create or replace function public.set_badge_mint_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists badge_mint_jobs_set_updated_at on public.badge_mint_jobs;
create trigger badge_mint_jobs_set_updated_at
before update on public.badge_mint_jobs
for each row execute function public.set_badge_mint_jobs_updated_at();
