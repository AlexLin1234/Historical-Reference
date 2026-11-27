import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, optionalInt, fetchUpstream, handleError, UpstreamError, placeList } from '../_shared/cors.ts';

const BASE_URL = 'https://api.si.edu/openaccess/api/v1.0/';
const API_KEY = Deno.env.get('SMITHSONIAN_API_KEY') || 'DEMO_KEY';

/**
 * The index tags records with decades ("1860s"). A date range becomes an OR of
 * its decades: CE years from 1000 only (earlier labels are ambiguous) and at
 * most 40 decades; wider or earlier ranges are filtered by the app instead.
 */
function decadeFacets(from: number | undefined, to: number | undefined): string[] {
  if (from === undefined || to === undefined || from < 1000 || to < from) return [];
  const first = Math.floor(from / 10) * 10;
  const last = Math.floor(Math.min(to, 2099) / 10) * 10;
  if ((last - first) / 10 + 1 > 40) return [];
  const out: string[] = [];
  for (let d = first; d <= last; d += 10) out.push(`${d}s`);
  return out;
}

/** Explain the usual cause of a 429: the shared DEMO_KEY allows ~10 requests. */
function explain(err: unknown): unknown {
  if (err instanceof UpstreamError && err.status === 429 && API_KEY === 'DEMO_KEY') {
    return new UpstreamError(
      'Smithsonian search is over its demo limit. The site owner needs to set a free api.data.gov key (SMITHSONIAN_API_KEY).',
      429
    );
  }
  return err;
}

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const rlResp = checkRateLimit(req, 60);
  if (rlResp) return rlResp;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      const query = validateString(body.query, 'query');
      if (query instanceof Response) return query;
      const rows = validateInt(body.rows ?? 20, 'rows', 1, 100);
      if (rows instanceof Response) return rows;
      const start = validateInt(body.start ?? 0, 'start', 0, 100000);
      if (start instanceof Response) return start;

      // Filters must be part of the query; a separate online_media_type
      // parameter is ignored by the API. No parentheses: the API treats
      // "(a b)" as a OR b, while bare words are AND-ed.
      let q = body.online_media_only ? `${query} AND online_media_type:"Images"` : query;
      // A parenthesised list is OR-ed, which is what a region needs.
      const places = placeList(body.places);
      if (places.length > 0) q += ` AND (${places.map((p) => `place:"${p}"`).join(' OR ')})`;
      const dateFrom = optionalInt(body.dateFrom, 'dateFrom', -10000, 3000);
      if (dateFrom instanceof Response) return dateFrom;
      const dateTo = optionalInt(body.dateTo, 'dateTo', -10000, 3000);
      if (dateTo instanceof Response) return dateTo;
      const decades = decadeFacets(dateFrom, dateTo);
      if (decades.length > 0) q += ` AND (${decades.map((d) => `date:"${d}"`).join(' OR ')})`;

      const params = new URLSearchParams({
        q,
        rows: String(rows),
        start: String(start),
        api_key: API_KEY,
      });

      const data = await fetchUpstream(`${BASE_URL}search?${params.toString()}`, 'Smithsonian');
      return jsonResponse({ success: true, data: data.response }, 200, req);
    }

    if (action === 'item') {
      const itemId = validateString(body.itemId, 'itemId', 200);
      if (itemId instanceof Response) return itemId;

      const data = await fetchUpstream(
        `${BASE_URL}content/${encodeURIComponent(itemId)}?api_key=${encodeURIComponent(API_KEY)}`,
        'Smithsonian'
      );
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "item".', 400, req);
  } catch (err) {
    return handleError(explain(err), req);
  }
});
