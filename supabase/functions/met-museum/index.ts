import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, optionalInt, fetchUpstream, handleError, placeName } from '../_shared/cors.ts';

const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/';
// The v1 search endpoint was retired on 2026-10-01; v1.1 is paginated.
const SEARCH_URL = 'https://collectionapi.metmuseum.org/public/collection/v1.1/search';
const NAME = 'Met Museum';

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
      const departmentId = optionalInt(body.departmentId, 'departmentId', 1, 100);
      if (departmentId instanceof Response) return departmentId;
      const dateBegin = optionalInt(body.dateBegin, 'dateBegin', -10000, 3000);
      if (dateBegin instanceof Response) return dateBegin;
      const dateEnd = optionalInt(body.dateEnd, 'dateEnd', -10000, 3000);
      if (dateEnd instanceof Response) return dateEnd;

      const offset = validateInt(body.offset ?? 0, 'offset', 0, 100000);
      if (offset instanceof Response) return offset;
      const limit = validateInt(body.limit ?? 20, 'limit', 1, 100);
      if (limit instanceof Response) return limit;

      const params = new URLSearchParams();
      params.set('q', query);
      params.set('offset', String(offset));
      params.set('limit', String(limit));
      if (body.hasImages !== false) params.set('hasImages', 'true');
      if (departmentId !== undefined) params.set('departmentId', String(departmentId));
      if (typeof body.medium === 'string' && body.medium) {
        params.set('medium', body.medium.slice(0, 200));
      }
      // One place, matched against the record's country, region and city.
      const geoLocation = placeName(body.geoLocation);
      if (geoLocation) params.set('geoLocation', geoLocation);
      // The API only applies a date filter when both ends are given.
      if (dateBegin !== undefined || dateEnd !== undefined) {
        params.set('dateBegin', String(dateBegin ?? -10000));
        params.set('dateEnd', String(dateEnd ?? 3000));
      }

      const data = await fetchUpstream(`${SEARCH_URL}?${params.toString()}`, NAME, {}, 12000, 2);
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'object') {
      const objectId = validateInt(body.objectId, 'objectId', 1, 99999999);
      if (objectId instanceof Response) return objectId;

      const data = await fetchUpstream(`${BASE_URL}objects/${objectId}`, NAME, {}, 12000, 2);
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'batch') {
      const { objectIds } = body;
      if (!Array.isArray(objectIds)) {
        return errorResponse('objectIds array is required', 400, req);
      }

      const ids = objectIds
        .slice(0, 20)
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isInteger(id) && id > 0 && id < 100000000);

      // Individual objects can 404 (withdrawn records); skip those, keep order.
      // Fetched a few at a time: large bursts trip the Met's bot protection.
      const objects: unknown[] = [];
      const CONCURRENCY = 5;
      for (let i = 0; i < ids.length; i += CONCURRENCY) {
        const results = await Promise.allSettled(
          ids
            .slice(i, i + CONCURRENCY)
            .map((id: number) => fetchUpstream(`${BASE_URL}objects/${id}`, NAME, {}, 8000, 2))
        );
        for (const r of results) if (r.status === 'fulfilled' && r.value) objects.push(r.value);
      }

      if (ids.length > 0 && objects.length === 0) {
        return errorResponse(`${NAME} API did not return any of the requested objects`, 502, req);
      }
      return jsonResponse({ success: true, data: objects }, 200, req);
    }

    return errorResponse('Invalid action. Use "search", "object", or "batch".', 400, req);
  } catch (err) {
    return handleError(err, req);
  }
});
