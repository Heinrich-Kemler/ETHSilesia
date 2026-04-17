-- Migracja dodająca tabelę historii czatu dla bota AI

create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  session_id text not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Indeks na pobieranie historii sesji konwersacji ułożonej wg czasu
create index if not exists chat_history_session_idx 
on public.chat_history (session_id, created_at desc);

-- Indeks na pobieranie logów czatu konkretnego usera
create index if not exists chat_history_user_idx 
on public.chat_history (user_id, created_at desc);
