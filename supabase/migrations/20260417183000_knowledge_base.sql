-- Włącz rozszerzenie pgvector, jeśli jeszcze nie jest włączone
create extension if not exists vector;

-- Tworzenie tabeli na Twoją bazę wiedzy ze Skarbnika
create table if not exists public.knowledge_base (
  id text primary key,
  topic text not null,
  question_pl text not null,
  question_en text not null,
  answer_pl text not null,
  answer_en text not null,
  level integer not null default 1,
  keywords_pl text[] not null default '{}',
  keywords_en text[] not null default '{}',
  safety_note_pl text,
  safety_note_en text,
  -- wczytany przez Ciebie model embedding zwraca 3072 wymiarów 
  embedding vector(3072),
  created_at timestamptz not null default now()
);

-- Funkcja do odpytywania bazy wiedzy na podstawie podobieństwa (użyjemy jej potem z poziomu aplikacji Next.js do wyciągania kontekstu dla czatu)
create or replace function match_documents (
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  topic text,
  question_pl text,
  answer_pl text,
  level integer,
  similarity float
)
language sql stable
as $$
  select
    kb.id,
    kb.topic,
    kb.question_pl,
    kb.answer_pl,
    kb.level,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
