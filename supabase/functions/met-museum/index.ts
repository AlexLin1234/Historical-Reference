import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, optionalInt, fetchUpstream, handleError } from '../_shared/cors.ts';

const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/';
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

      // Filter parameters must come before q for the Met API to honour them.
      const params = new URLSearchParams();
      if (body.hasImages !== false) params.set('hasImages', 'true');
      if (departmentId !== undefined) params.set('departmentId', String(departmentId));
      if (typeof body.medium === 'string' && body.medium) {
        params.set('medium', body.medium.slice(0, 200));
      }
      // The API only applies a date filter when both ends are given.
      if (dateBegin !== undefined || dateEnd !== undefined) {
        params.set('dateBegin', String(dateBegin ?? -10000));
        params.set('dateEnd', String(dateEnd ?? 3000));
      }
      params.set('q', query);

      const data = await fetchUpstream(`${BASE_URL}search?${params.toString()}`, NAME);
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'object') {
      const objectId = validateInt(body.objectId, 'objectId', 1, 99999999);
      if (objectId instanceof Response) return objectId;

      const data = await fetchUpstream(`${BASE_URL}objects/${objectId}`, NAME);
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
      const results = await Promise.allSettled(
        ids.map((id: number) => fetchUpstream(`${BASE_URL}objects/${id}`, NAME, {}, 8000))
      );
      const objects = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean);

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
