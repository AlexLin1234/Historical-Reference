/**
 * Client-side API for the vector-search Edge Function.
 *
 * Calls the Supabase `vector-search` function which embeds the query
 * server-side (gte-small model) and performs a pgvector cosine similarity
 * search against pre-indexed artifacts.
 *
 * The index is optional: when it is empty or the function is not deployed the
 * search simply runs on keywords alone.
 */

import { getSupabase } from '@/lib/supabase';
import type { NormalizedArtifact, MuseumSource } from '@/types/artifact';

/** Shape returned by the match_artifacts RPC (snake_case from Postgres). */
interface ArtifactRow {
  id: string;
  source: string;
  source_id: string;
  title: string;
  date_str: string | null;
  date_earliest: number | null;
  date_latest: number | null;
  period: string | null;
  culture: string | null;
  classification: string | null;
  object_type: string | null;
  medium: string | null;
  dimensions: string | null;
  description: string | null;
  artist: string | null;
  primary_image: string | null;
  primary_image_small: string | null;
  department: string | null;
  country: string | null;
  accession_number: string | null;
  holder: string | null;
  source_url: string;
  is_public_domain: boolean;
  similarity: number;
}

function rowToArtifact(row: ArtifactRow): NormalizedArtifact {
  return {
    id: row.id,
    sourceId: row.source_id,
    source: row.source as MuseumSource,
    title: row.title,
    date: row.date_str ?? '',
    dateEarliest: row.date_earliest,
    dateLatest: row.date_latest,
    period: row.period,
    culture: row.culture,
    classification: row.classification,
    objectType: row.object_type,
    medium: row.medium,
    dimensions: row.dimensions,
    artist: row.artist,
    artistBio: null,
    description: row.description,
    primaryImage: row.primary_image,
    primaryImageSmall: row.primary_image_small,
    additionalImages: [],
    department: row.department,
    gallery: null,
    country: row.country,
    region: null,
    creditLine: null,
    sourceUrl: row.source_url,
    isPublicDomain: row.is_public_domain,
    accessionNumber: row.accession_number,
    holder: row.holder,
  };
}

export interface VectorMatch {
  artifact: NormalizedArtifact;
  similarity: number;
}

export interface VectorSearchOptions {
  query: string;
  limit?: number;
  /** Restrict to a single museum source */
  source?: MuseumSource | null;
  dateFrom?: number | null;
  dateTo?: number | null;
  hasImage?: boolean;
}

/**
 * Search for artifacts by semantic similarity using server-side embeddings.
 *
 * Returns an empty array if the vector index has no results (e.g., DB not yet
 * seeded) — callers should treat this as a graceful no-op and fall back to
 * keyword results.
 */
export async function vectorSearch(
  options: VectorSearchOptions
): Promise<VectorMatch[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.functions.invoke('vector-search', {
    body: {
      query: options.query,
      limit: options.limit ?? 20,
      source: options.source ?? null,
      dateFrom: options.dateFrom ?? null,
      dateTo: options.dateTo ?? null,
      hasImage: options.hasImage ?? false,
    },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? 'Vector search failed');

  return ((data.results ?? []) as ArtifactRow[]).map((row) => ({
    artifact: rowToArtifact(row),
    similarity: row.similarity,
  }));
}

