/**
 * ingest-artifact Edge Function
 *
 * Accepts a batch of NormalizedArtifact objects (up to 50 per request),
 * generates embeddings for each using Supabase AI (gte-small), and upserts
 * them into the pgvector `artifacts` table.
 *
 * Authorization: requires the Supabase service role key as a Bearer token.
 * This endpoint should only be called from trusted scripts, not from the
 * browser client.
 *
 * Usage:
 *   POST /functions/v1/ingest-artifact
 *   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *   Content-Type: application/json
 *   { "artifacts": [ ...NormalizedArtifact[] ] }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  handleCors,
  jsonResponse,
  errorResponse,
} from '../_shared/cors.ts';

// Supabase.ai is provided by the Edge Functions runtime
declare const Supabase: {
  ai: {
    Session: new (model: string) => {
      run: (
        text: string,
        options: { mean_pool: boolean; normalize: boolean }
      ) => Promise<number[] | Float32Array>;
    };
  };
};

/** Build the text string that gets embedded for an artifact. */
function artifactToEmbeddingText(artifact: Record<string, unknown>): string {
  return [
    artifact.title,
    artifact.classification,
    artifact.objectType,
    artifact.medium,
    artifact.culture,
    artifact.period,
    artifact.artist,
    artifact.description,
  ]
    .filter((v) => v && typeof v === 'string')
    .join('. ');
}

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  // Require service role key — this is a write endpoint
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return errorResponse('Unauthorized', 401, req);
  }

  try {
    const body = await req.json();
    const { artifacts } = body;

    if (!Array.isArray(artifacts) || artifacts.length === 0) {
      return errorResponse('artifacts must be a non-empty array', 400, req);
    }
    if (artifacts.length > 50) {
      return errorResponse('Maximum 50 artifacts per request', 400, req);
    }

    const session = new Supabase.ai.Session('gte-small');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceKey
    );

    const rows = [];
    const errors: string[] = [];

    for (const artifact of artifacts) {
      try {
        const text = artifactToEmbeddingText(artifact as Record<string, unknown>);
        if (!text.trim()) {
          errors.push(`Skipped artifact ${artifact.id}: no embeddable text`);
          continue;
        }

        const rawEmbedding = await session.run(text, {
          mean_pool: true,
          normalize: true,
        });

        rows.push({
          id: artifact.id,
          source: artifact.source,
          source_id: artifact.sourceId,
          title: artifact.title,
          date_str: artifact.date ?? null,
          date_earliest: artifact.dateEarliest ?? null,
          date_latest: artifact.dateLatest ?? null,
          period: artifact.period ?? null,
          culture: artifact.culture ?? null,
          classification: artifact.classification ?? null,
          object_type: artifact.objectType ?? null,
          medium: artifact.medium ?? null,
          description: artifact.description ?? null,
          artist: artifact.artist ?? null,
          primary_image: artifact.primaryImage ?? null,
          primary_image_small: artifact.primaryImageSmall ?? null,
          department: artifact.department ?? null,
          country: artifact.country ?? null,
          source_url: artifact.sourceUrl,
          is_public_domain: artifact.isPublicDomain ?? false,
          embedding: Array.from(rawEmbedding),
          indexed_at: new Date().toISOString(),
        });
      } catch (err) {
        errors.push(`Failed to embed ${artifact.id}: ${(err as Error).message}`);
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from('artifacts')
        .upsert(rows, { onConflict: 'id' });

      if (error) throw new Error(error.message);
    }

    return jsonResponse(
      { success: true, ingested: rows.length, errors },
      200,
      req
    );
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500, req);
  }
});
