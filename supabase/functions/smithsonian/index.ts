import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const BASE_URL = 'https://api.si.edu/openaccess/api/v1.0/';
const API_KEY = Deno.env.get('SMITHSONIAN_API_KEY') || 'DEMO_KEY';

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      const { query, rows = 20, start = 0, online_media_only } = body;
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
        return errorResponse(`Smithsonian API error: ${resp.statusText}`, resp.status);
      }
      const data = await resp.json();
      return jsonResponse({ success: true, data: data.response });
    }

    if (action === 'item') {
      const { itemId } = body;
      if (!itemId) return errorResponse('itemId is required');

      const resp = await fetch(
        `${BASE_URL}content/${itemId}?api_key=${API_KEY}`
      );
      if (!resp.ok) {
        return errorResponse(`Smithsonian API error: ${resp.statusText}`, resp.status);
      }
      const data = await resp.json();
      return jsonResponse({ success: true, data });
    }

    return errorResponse('Invalid action. Use "search" or "item".');
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500);
  }
});
