/**
 * vector-search Edge Function
 *
 * Accepts a plain-text query, generates a 384-dim embedding server-side using
 * Supabase's built-in AI (gte-small model), then queries the pgvector
 * `artifacts` table via the `match_artifacts` RPC and returns semantically
 * similar artifacts.
 *
 * This replaces the client-side Transformers.js re-ranking: embeddings are
 * computed once at index time and once per query — no 23 MB WASM download.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  handleCors,
  jsonResponse,
  errorResponse,
  checkRateLimit,
  validateString,
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

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const rlResp = checkRateLimit(req, 30);
  if (rlResp) return rlResp;

  try {
    const body = await req.json();

    const query = validateString(body.query, 'query', 500);
    if (query instanceof Response) return query;

    const limit = Math.min(Math.max(1, Number(body.limit) || 20), 50);
    const filterSource = typeof body.source === 'string' ? body.source : null;
    const filterFrom = typeof body.dateFrom === 'number' ? body.dateFrom : null;
    const filterTo = typeof body.dateTo === 'number' ? body.dateTo : null;
    const hasImage = Boolean(body.hasImage);

    // Generate embedding server-side — same gte-small model used at index time
    const session = new Supabase.ai.Session('gte-small');
    const rawEmbedding = await session.run(query.trim(), {
      mean_pool: true,
      normalize: true,
    });

    // Ensure it is a plain Array for the RPC (pgvector expects JSON array)
    const embedding = Array.from(rawEmbedding);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase.rpc('match_artifacts', {
      query_embedding: embedding,
      match_count: limit,
      filter_source: filterSource,
      filter_from: filterFrom,
      filter_to: filterTo,
      has_image: hasImage,
    });

    if (error) throw new Error(error.message);

    return jsonResponse({ success: true, results: data ?? [] }, 200, req);
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500, req);
  }
});
