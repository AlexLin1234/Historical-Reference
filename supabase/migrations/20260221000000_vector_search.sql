-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- ── Artifacts table ──────────────────────────────────────────────────────────
-- Stores normalized artifact records from all museum sources with pre-computed
-- embeddings for semantic similarity search via pgvector.

create table if not exists public.artifacts (
  id                  text        primary key,        -- "{source}-{sourceId}"
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
  description         text,
  artist              text,
  primary_image       text,
  primary_image_small text,
  department          text,
  country             text,
  source_url          text        not null,
  is_public_domain    boolean     not null default false,
  -- 384-dim embedding from gte-small (matches Supabase AI Session model)
  embedding           vector(384),
  indexed_at          timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- HNSW index for fast approximate nearest-neighbor cosine search.
-- m=16, ef_construction=64 is a good balance of build speed vs. recall.
create index if not exists artifacts_embedding_hnsw_idx
  on public.artifacts
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists artifacts_source_idx
  on public.artifacts (source);

create index if not exists artifacts_date_idx
  on public.artifacts (date_earliest, date_latest);

-- Partial index for image-only queries
create index if not exists artifacts_has_image_idx
  on public.artifacts (id)
  where primary_image is not null;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Public read access; writes require the service role key (bypasses RLS).

alter table public.artifacts enable row level security;

create policy "public read artifacts"
  on public.artifacts
  for select
  using (true);

-- ── match_artifacts RPC ───────────────────────────────────────────────────────
-- Performs cosine similarity search and returns rows ordered by similarity.
-- Called from the vector-search Edge Function.

create or replace function public.match_artifacts(
  query_embedding  vector(384),
  match_count      integer  default 20,
  filter_source    text     default null,
  filter_from      integer  default null,
  filter_to        integer  default null,
  has_image        boolean  default false
)
returns table (
  id                  text,
  source              text,
  source_id           text,
  title               text,
  date_str            text,
  date_earliest       integer,
  date_latest         integer,
  period              text,
  culture             text,
  classification      text,
  object_type         text,
  medium              text,
  description         text,
  artist              text,
  primary_image       text,
  primary_image_small text,
  department          text,
  country             text,
  source_url          text,
  is_public_domain    boolean,
  similarity          float8
)
language sql stable
as $$
  select
    id, source, source_id, title, date_str, date_earliest, date_latest,
    period, culture, classification, object_type, medium, description,
    artist, primary_image, primary_image_small, department, country,
    source_url, is_public_domain,
    1 - (embedding <=> query_embedding) as similarity
  from public.artifacts
  where
    embedding is not null
    and (filter_source is null or source = filter_source)
    and (filter_from   is null or date_latest   is null or date_latest   >= filter_from)
    and (filter_to     is null or date_earliest is null or date_earliest <= filter_to)
    and (not has_image or primary_image is not null)
  order by embedding <=> query_embedding
  limit match_count;
$$;
