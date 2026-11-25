/**
 * vector-search Edge Function
 *
 * Embeds a plain-text query with gte-small (the same model ingest-artifact
 * uses) and returns the closest artifacts from `public.artifacts` via the
 * `match_artifacts` RPC, each with its cosine similarity.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  handleCors,
  jsonResponse,
  errorResponse,
  checkRateLimit,
  validateString,
} from '../_shared/cors.ts';
import { embed } from '../_shared/embed.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

const year = (v: unknown) =>
  typeof v === 'number' && Number.isInteger(v) && Math.abs(v) <= 10000 ? v : null;

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const rlResp = checkRateLimit(req, 60);
  if (rlResp) return rlResp;

  try {
    const body = await req.json();

    const query = validateString(body.query, 'query', 500);
    if (query instanceof Response) return query;

    const limit = Math.min(Math.max(1, Number(body.limit) || 20), 50);
    const source = typeof body.source === 'string' && /^[a-z]{1,20}$/.test(body.source)
      ? body.source
      : null;

    const { data, error } = await supabase.rpc('match_artifacts', {
      query_embedding: await embed(query.trim()),
      match_count: limit,
      filter_source: source,
      filter_from: year(body.dateFrom),
      filter_to: year(body.dateTo),
      has_image: Boolean(body.hasImage),
    });
    if (error) throw new Error(error.message);

    return jsonResponse({ success: true, results: data ?? [] }, 200, req);
  } catch (err) {
    if (err instanceof SyntaxError) return errorResponse('Request body must be valid JSON', 400, req);
    console.error(err);
    return errorResponse('Semantic search is unavailable', 500, req);
  }
});
