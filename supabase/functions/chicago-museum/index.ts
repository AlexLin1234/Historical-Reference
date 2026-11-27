import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, optionalInt, fetchUpstream, handleError, placeList } from '../_shared/cors.ts';

const BASE_URL = 'https://api.artic.edu/api/v1/artworks';
const NAME = 'Art Institute of Chicago';
const FIELDS = [
  'id', 'title', 'artist_display', 'date_display', 'date_start', 'date_end', 'medium_display',
  'dimensions', 'image_id', 'classification_title', 'artwork_type_title', 'department_title',
  'place_of_origin', 'credit_line', 'thumbnail', 'description', 'is_public_domain', 'api_link',
  'main_reference_number',
];
// The API asks clients to identify themselves.
const HEADERS = { 'AIC-User-Agent': 'reenactors-reference (museum search app)' };

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
      const limit = validateInt(body.limit ?? 20, 'limit', 1, 100);
      if (limit instanceof Response) return limit;
      const page = validateInt(body.page ?? 1, 'page', 1, 1000);
      if (page instanceof Response) return page;
      const dateFrom = optionalInt(body.dateFrom, 'dateFrom', -10000, 3000);
      if (dateFrom instanceof Response) return dateFrom;
      const dateTo = optionalInt(body.dateTo, 'dateTo', -10000, 3000);
      if (dateTo instanceof Response) return dateTo;

      // Filters run inside the museum's search (Elasticsearch) so that paging
      // and totals reflect them.
      const filter: unknown[] = [];
      if (body.hasImage) filter.push({ exists: { field: 'image_id' } });
      if (dateFrom !== undefined) filter.push({ range: { date_end: { gte: dateFrom } } });
      if (dateTo !== undefined) filter.push({ range: { date_start: { lte: dateTo } } });
      if (Array.isArray(body.artworkTypes) && body.artworkTypes.length > 0) {
        const types = body.artworkTypes
          .filter((t: unknown) => typeof t === 'string')
          .slice(0, 10)
          .map((t: string) => t.slice(0, 100));
        filter.push({
          bool: {
            should: types.map((t: string) => ({ match_phrase: { artwork_type_title: t } })),
            minimum_should_match: 1,
          },
        });
      }

      const places = placeList(body.places, 30);
      if (places.length > 0) {
        filter.push({
          bool: {
            should: places.map((p) => ({ match_phrase: { place_of_origin: p } })),
            minimum_should_match: 1,
          },
        });
      }

      const search: Record<string, unknown> = { q: query, limit, page, fields: FIELDS };
      if (filter.length > 0) search.query = { bool: { filter } };

      // The search index only serves the first 1,000 results of any query.
      if (page * limit > 1000) {
        return jsonResponse(
          { success: true, data: { pagination: { total: 0 }, data: [], config: {} } },
          200,
          req
        );
      }

      const data = await fetchUpstream(
        `${BASE_URL}/search?params=${encodeURIComponent(JSON.stringify(search))}`,
        NAME,
        { headers: HEADERS }
      );
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'object') {
      const artworkId = validateInt(body.artworkId, 'artworkId', 1, 99999999);
      if (artworkId instanceof Response) return artworkId;

      const params = new URLSearchParams({ fields: FIELDS.join(',') });
      const data = await fetchUpstream(`${BASE_URL}/${artworkId}?${params.toString()}`, NAME, {
        headers: HEADERS,
      });
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "object".', 400, req);
  } catch (err) {
    return handleError(err, req);
  }
});
