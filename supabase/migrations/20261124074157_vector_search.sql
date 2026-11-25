-- Semantic search over museum artifacts with pgvector.
--
-- The edge functions `ingest-artifact` (writes) and `vector-search` (reads)
-- embed text with Supabase AI's built-in gte-small model (384 dimensions).

create extension if not exists vector with schema extensions;

-- ── Artifacts ─────────────────────────────────────────────────────────────────
-- Normalized records from every museum source, keyed by the same id the app
-- uses ("met-123", "va-O1234", "cma-5", ...) so results de-duplicate.

create table if not exists public.artifacts (
  id                  text        primary key,
  source              text        not null,
  source_id           text        not null,
  title               text        not null,
  date_str            text,
  date_earliest       integer,
  date_latest         integer,
  period              text,
  culture             text,
  classification      text,
  object_type         text,
  medium              text,
  dimensions          text,
  description         text,
  artist              text,
  primary_image       text,
  primary_image_small text,
  department          text,
  country             text,
  accession_number    text,
  holder              text,
  source_url          text        not null,
  is_public_domain    boolean     not null default false,
  embedding           extensions.vector(384),
  indexed_at          timestamptz not null default now()
);

create index if not exists artifacts_embedding_hnsw_idx
  on public.artifacts using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);
create index if not exists artifacts_source_idx on public.artifacts (source);
create index if not exists artifacts_date_idx on public.artifacts (date_earliest, date_latest);

-- Museum data is public: anyone may read; only the service role writes.
alter table public.artifacts enable row level security;
drop policy if exists "public read artifacts" on public.artifacts;
create policy "public read artifacts" on public.artifacts for select using (true);

-- ── Ingest tokens ─────────────────────────────────────────────────────────────
-- Short-lived bearer tokens that let a seeding script call ingest-artifact
-- without handing it the service-role key. Only SHA-256 hashes are stored.
-- RLS with no policies: readable by the service role only.

create table if not exists public.ingest_tokens (
  token_hash  text        primary key,
  note        text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
alter table public.ingest_tokens enable row level security;
revoke all on public.ingest_tokens from anon, authenticated;

-- ── match_artifacts ───────────────────────────────────────────────────────────
-- Cosine-similarity search with optional source, date and image filters.

create or replace function public.match_artifacts(
  query_embedding  extensions.vector(384),
  match_count      integer  default 20,
  filter_source    text     default null,
  filter_from      integer  default null,
  filter_to        integer  default null,
  has_image        boolean  default false
)
returns table (
  id text, source text, source_id text, title text, date_str text,
  date_earliest integer, date_latest integer, period text, culture text,
  classification text, object_type text, medium text, dimensions text,
  description text, artist text, primary_image text, primary_image_small text,
  department text, country text, accession_number text, holder text,
  source_url text, is_public_domain boolean, similarity float8
)
language sql stable
set search_path = public, extensions
as $$
  select
    a.id, a.source, a.source_id, a.title, a.date_str, a.date_earliest, a.date_latest,
    a.period, a.culture, a.classification, a.object_type, a.medium, a.dimensions,
    a.description, a.artist, a.primary_image, a.primary_image_small, a.department,
    a.country, a.accession_number, a.holder, a.source_url, a.is_public_domain,
    1 - (a.embedding <=> query_embedding) as similarity
  from public.artifacts a
  where a.embedding is not null
    and (filter_source is null or a.source = filter_source)
    and (filter_from is null or a.date_latest is null or a.date_latest >= filter_from)
    and (filter_to is null or a.date_earliest is null or a.date_earliest <= filter_to)
    and (not has_image or a.primary_image is not null or a.primary_image_small is not null)
  order by a.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 100);
$$;
