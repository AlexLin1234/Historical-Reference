import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt } from '../_shared/cors.ts';

const BASE_URL = 'https://api.artic.edu/api/v1/artworks';
const FIELDS = 'id,title,artist_display,date_display,date_start,date_end,medium_display,dimensions,image_id,classification_title,department_title,place_of_origin,credit_line,thumbnail,description,is_public_domain,api_link';

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const rlResp = checkRateLimit(req, 30);
  if (rlResp) return rlResp;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      const query = validateString(body.query, 'query');
      if (query instanceof Response) return query;
      const limit = validateInt(body.limit ?? 20, 'limit', 1, 100);
      if (limit instanceof Response) return limit;
      const page = validateInt(body.page ?? 1, 'page', 1, 10000);
      if (page instanceof Response) return page;

      const params = new URLSearchParams({
        q: query,
        limit: String(limit),
        page: String(page),
        fields: FIELDS,
      });

      const resp = await fetch(`${BASE_URL}/search?${params.toString()}`);
      if (!resp.ok) {
        return errorResponse(`Chicago API error: ${resp.statusText}`, resp.status, req);
      }
      const data = await resp.json();
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'object') {
      const artworkId = validateInt(body.artworkId, 'artworkId', 1, 99999999);
      if (artworkId instanceof Response) return artworkId;

      const params = new URLSearchParams({ fields: FIELDS });
      const resp = await fetch(`${BASE_URL}/${artworkId}?${params.toString()}`);
      if (!resp.ok) {
        return errorResponse(`Chicago API error: ${resp.statusText}`, resp.status, req);
      }
      const data = await resp.json();
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "object".', 400, req);
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500, req);
  }
});
