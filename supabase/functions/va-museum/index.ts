import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const BASE_URL = 'https://api.vam.ac.uk/v2/';

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      const { query, page = 1, pageSize = 20, category } = body;
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      params.set('images_exist', 'true');
      if (category) params.set('q_object_type', category);

      const resp = await fetch(`${BASE_URL}objects/search?${params.toString()}`);
      const data = await resp.json();
      return jsonResponse({ success: true, data });
    }

    if (action === 'object') {
      const { systemNumber } = body;
      if (!systemNumber) return errorResponse('systemNumber is required');

      const resp = await fetch(`${BASE_URL}museumobject/${systemNumber}`);
      const data = await resp.json();
      return jsonResponse({ success: true, data });
    }

    return errorResponse('Invalid action. Use "search" or "object".');
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500);
  }
});
