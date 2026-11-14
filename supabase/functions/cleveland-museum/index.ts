import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, optionalInt, fetchUpstream, handleError } from '../_shared/cors.ts';

const BASE_URL = 'https://openaccess-api.clevelandart.org/api/artworks/';
const NAME = 'Cleveland Museum';

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

      const { hasImage = true, type, department } = body;
      const skip = validateInt(body.skip ?? 0, 'skip', 0, 100000);
      if (skip instanceof Response) return skip;
      const limit = validateInt(body.limit ?? 20, 'limit', 1, 100);
      if (limit instanceof Response) return limit;
      const createdAfter = optionalInt(body.created_after, 'created_after', -10000, 3000);
      if (createdAfter instanceof Response) return createdAfter;
      const createdBefore = optionalInt(body.created_before, 'created_before', -10000, 3000);
      if (createdBefore instanceof Response) return createdBefore;

      const params = new URLSearchParams();
      params.set('q', query);
      if (hasImage) params.set('has_image', '1');
      params.set('limit', String(limit));
      params.set('skip', String(skip));
      if (type) params.set('type', String(type).slice(0, 200));
      if (department) params.set('department', String(department).slice(0, 200));
      if (createdAfter !== undefined) params.set('created_after', String(createdAfter));
      if (createdBefore !== undefined) params.set('created_before', String(createdBefore));

      const data = await fetchUpstream(`${BASE_URL}?${params.toString()}`, NAME);
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'object') {
      const artworkId = validateString(body.artworkId, 'artworkId', 50);
      if (artworkId instanceof Response) return artworkId;

      const data = await fetchUpstream(`${BASE_URL}${encodeURIComponent(artworkId)}`, NAME);
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "object".', 400, req);
  } catch (err) {
    return handleError(err, req);
  }
});
