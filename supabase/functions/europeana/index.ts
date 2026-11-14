import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, optionalInt, fetchUpstream, handleError } from '../_shared/cors.ts';

// Europeana aggregates thousands of European museums, including finds
// recorded by the Portable Antiquities Scheme and Scandinavian armouries.
// A free API key is required: https://pro.europeana.eu/page/get-api
const BASE_URL = 'https://api.europeana.eu/record/v2/search.json';
const NAME = 'Europeana';
const API_KEY = Deno.env.get('EUROPEANA_API_KEY') || '';

/**
 * Europeana's YEAR is a text field, so a range is compared character by
 * character ("793" sorts after "1066"). Split the range into one clause per
 * number of digits. CE years only; callers filter BCE ranges themselves.
 */
function yearFilter(from: number | undefined, to: number | undefined): string | null {
  if (from === undefined && to === undefined) return null;
  const lo = Math.max(1, from ?? 1);
  const hi = Math.min(2100, to ?? 2100);
  if (hi < lo) return null;
  const parts: string[] = [];
  for (let digits = String(lo).length; digits <= String(hi).length; digits++) {
    const a = Math.max(lo, digits === 1 ? 1 : 10 ** (digits - 1));
    const b = Math.min(hi, 10 ** digits - 1);
    // The length check stops shorter years ("80", "105") slipping into the range.
    if (a <= b) parts.push(`([${a} TO ${b}] AND /[0-9]{${digits}}/)`);
  }
  return parts.length ? `YEAR:(${parts.join(' OR ')})` : null;
}

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const rlResp = checkRateLimit(req, 60);
  if (rlResp) return rlResp;

  if (!API_KEY) {
    return jsonResponse(
      { success: false, code: 'not_configured', error: 'Europeana search is not set up on this server (missing API key)' },
      503,
      req
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      const query = validateString(body.query, 'query');
      if (query instanceof Response) return query;
      const rows = validateInt(body.rows ?? 20, 'rows', 1, 100);
      if (rows instanceof Response) return rows;
      const start = validateInt(body.start ?? 1, 'start', 1, 1000);
      if (start instanceof Response) return start;
      const yearFrom = optionalInt(body.yearFrom, 'yearFrom', -10000, 3000);
      if (yearFrom instanceof Response) return yearFrom;
      const yearTo = optionalInt(body.yearTo, 'yearTo', -10000, 3000);
      if (yearTo instanceof Response) return yearTo;

      const params = new URLSearchParams({
        wskey: API_KEY,
        query,
        rows: String(rows),
        start: String(start),
        profile: 'rich',
      });
      // Objects and pictures of them; not newspapers, sound or film.
      params.append('qf', 'TYPE:(IMAGE OR 3D)');
      if (body.hasImage) params.set('thumbnail', 'true');
      const years = yearFilter(yearFrom, yearTo);
      if (years) params.append('qf', years);

      const data = await fetchUpstream(`${BASE_URL}?${params.toString()}`, NAME);
      if (data?.success === false) return errorResponse(`${NAME} rejected the search`, 502, req);
      return jsonResponse(
        { success: true, data: { totalResults: data.totalResults ?? 0, items: data.items ?? [] } },
        200,
        req
      );
    }

    if (action === 'object') {
      const recordId = validateString(body.recordId, 'recordId', 300);
      if (recordId instanceof Response) return recordId;
      if (!/^\/[\w.-]+\/[\w.-]+$/.test(recordId)) {
        return errorResponse('recordId is not a Europeana record id', 400, req);
      }
      // A search by id returns the same shape as search results.
      const params = new URLSearchParams({
        wskey: API_KEY,
        query: `europeana_id:"${recordId}"`,
        rows: '1',
        profile: 'rich',
      });
      const data = await fetchUpstream(`${BASE_URL}?${params.toString()}`, NAME);
      const item = data?.items?.[0];
      if (!item) return errorResponse(`${NAME}: record not found`, 404, req);
      return jsonResponse({ success: true, data: item }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "object".', 400, req);
  } catch (err) {
    return handleError(err, req);
  }
});
