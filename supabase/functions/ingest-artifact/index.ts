/**
 * ingest-artifact Edge Function
 *
 * Accepts a batch of NormalizedArtifact objects (up to 25 per request),
 * embeds each one with gte-small and upserts them into `public.artifacts`.
 *
 * Authorization (either):
 *   - Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *   - Bearer <ingest token>, whose SHA-256 hash is in `public.ingest_tokens`
 *     and has not expired. Lets a seeding script run without the service key.
 *
 * Body: { "artifacts": [ ...NormalizedArtifact[] ] }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { artifactText, embed } from '../_shared/embed.ts';

const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, SERVICE_KEY, {
  auth: { persistSession: false },
});

const MAX_BATCH = 25;
const SOURCES = new Set([
  'met', 'va', 'cleveland', 'smithsonian', 'harvard', 'chicago', 'mia', 'europeana',
]);

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function authorized(req: Request): Promise<boolean> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return false;
  if (SERVICE_KEY && safeEqual(token, SERVICE_KEY)) return true;
  if (token.length < 32) return false;

  const { data, error } = await supabase
    .from('ingest_tokens')
    .select('expires_at')
    .eq('token_hash', await sha256(token))
    .maybeSingle();
  return !error && !!data && new Date(data.expires_at).getTime() > Date.now();
}

const str = (v: unknown, max = 4000): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const int = (v: unknown): number | null =>
  typeof v === 'number' && Number.isInteger(v) && Math.abs(v) <= 10000 ? v : null;
const url = (v: unknown): string | null => {
  const s = str(v, 2000);
  return s && /^https?:\/\//i.test(s) ? s : null;
};

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== 'POST') return errorResponse('Use POST', 405, req);
  if (!(await authorized(req))) return errorResponse('Unauthorized', 401, req);

  let artifacts: unknown;
  try {
    ({ artifacts } = await req.json());
  } catch {
    return errorResponse('Request body must be valid JSON', 400, req);
  }
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    return errorResponse('artifacts must be a non-empty array', 400, req);
  }
  if (artifacts.length > MAX_BATCH) {
    return errorResponse(`Maximum ${MAX_BATCH} artifacts per request`, 400, req);
  }

  const rows = [];
  const errors: string[] = [];

  for (const raw of artifacts as Record<string, unknown>[]) {
    const id = str(raw?.id, 300);
    const source = str(raw?.source, 30);
    const title = str(raw?.title, 500);
    const sourceUrl = url(raw?.sourceUrl);
    if (!id || !source || !SOURCES.has(source) || !title || !sourceUrl) {
      errors.push(`Skipped ${id ?? '(no id)'}: missing id, source, title or sourceUrl`);
      continue;
    }
    try {
      rows.push({
        id,
        source,
        source_id: str(raw.sourceId, 300) ?? id,
        title,
        date_str: str(raw.date, 200),
        date_earliest: int(raw.dateEarliest),
        date_latest: int(raw.dateLatest),
        period: str(raw.period, 300),
        culture: str(raw.culture, 300),
        classification: str(raw.classification, 300),
        object_type: str(raw.objectType, 300),
        medium: str(raw.medium, 1000),
        dimensions: str(raw.dimensions, 1000),
        description: str(raw.description, 4000),
        artist: str(raw.artist, 500),
        primary_image: url(raw.primaryImage),
        primary_image_small: url(raw.primaryImageSmall),
        department: str(raw.department, 300),
        country: str(raw.country, 300),
        accession_number: str(raw.accessionNumber, 200),
        holder: str(raw.holder, 300),
        source_url: sourceUrl,
        is_public_domain: raw.isPublicDomain === true,
        embedding: await embed(artifactText(raw)),
        indexed_at: new Date().toISOString(),
      });
    } catch (err) {
      errors.push(`Failed to embed ${id}: ${(err as Error).message}`);
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('artifacts').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error(error);
      return errorResponse('Could not save artifacts', 500, req);
    }
  }

  return jsonResponse({ success: true, ingested: rows.length, errors }, 200, req);
});
