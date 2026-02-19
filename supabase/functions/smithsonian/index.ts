import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt } from '../_shared/cors.ts';

const BASE_URL = 'https://api.si.edu/openaccess/api/v1.0/';
const API_KEY = Deno.env.get('SMITHSONIAN_API_KEY') || 'DEMO_KEY';

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
      const rows = validateInt(body.rows ?? 20, 'rows', 1, 100);
      if (rows instanceof Response) return rows;
      const start = validateInt(body.start ?? 0, 'start', 0, 100000);
      if (start instanceof Response) return start;

      const { online_media_only } = body;
      const params = new URLSearchParams({
        q: query,
        rows: String(rows),
        start: String(start),
        api_key: API_KEY,
      });

      if (online_media_only) {
        params.set('online_media_type', 'Images');
      }

      const resp = await fetch(`${BASE_URL}search?${params.toString()}`);
      if (!resp.ok) {
        return errorResponse(`Smithsonian API error: ${resp.statusText}`, resp.status, req);
      }
      const data = await resp.json();
      return jsonResponse({ success: true, data: data.response }, 200, req);
    }

    if (action === 'item') {
      const itemId = validateString(body.itemId, 'itemId', 200);
      if (itemId instanceof Response) return itemId;

      const resp = await fetch(
        `${BASE_URL}content/${encodeURIComponent(itemId)}?api_key=${API_KEY}`
      );
      if (!resp.ok) {
        return errorResponse(`Smithsonian API error: ${resp.statusText}`, resp.status, req);
      }
      const data = await resp.json();
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "item".', 400, req);
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500, req);
  }
});
