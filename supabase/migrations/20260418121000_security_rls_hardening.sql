-- Security hardening: enable RLS on all backend-owned tables
-- and restrict direct anon/authenticated access.

alter table if exists public.users enable row level security;
alter table if exists public.quest_completions enable row level security;
alter table if exists public.badges enable row level security;
alter table if exists public.chat_history enable row level security;
alter table if exists public.knowledge_base enable row level security;
alter table if exists public.badge_mint_jobs enable row level security;

-- Remove broad table grants. Backend routes use the service-role key.
revoke all on table public.users from anon, authenticated;
revoke all on table public.quest_completions from anon, authenticated;
revoke all on table public.badges from anon, authenticated;
revoke all on table public.chat_history from anon, authenticated;
revoke all on table public.knowledge_base from anon, authenticated;
revoke all on table public.badge_mint_jobs from anon, authenticated;

-- Restrict vector-search function execution to service_role only.
revoke all on function public.match_documents(vector, float, int)
  from public, anon, authenticated;
grant execute on function public.match_documents(vector, float, int)
  to service_role;

-- Explicit service-role policies (defense-in-depth, even though service-role
-- requests typically bypass RLS in Supabase).
drop policy if exists users_service_role_all on public.users;
create policy users_service_role_all
on public.users
for all
to service_role
using (true)
with check (true);

drop policy if exists quest_completions_service_role_all on public.quest_completions;
create policy quest_completions_service_role_all
on public.quest_completions
for all
to service_role
using (true)
with check (true);

drop policy if exists badges_service_role_all on public.badges;
create policy badges_service_role_all
on public.badges
for all
to service_role
using (true)
with check (true);

drop policy if exists chat_history_service_role_all on public.chat_history;
create policy chat_history_service_role_all
on public.chat_history
for all
to service_role
using (true)
with check (true);

drop policy if exists knowledge_base_service_role_all on public.knowledge_base;
create policy knowledge_base_service_role_all
on public.knowledge_base
for all
to service_role
using (true)
with check (true);

drop policy if exists badge_mint_jobs_service_role_all on public.badge_mint_jobs;
create policy badge_mint_jobs_service_role_all
on public.badge_mint_jobs
for all
to service_role
using (true)
with check (true);
