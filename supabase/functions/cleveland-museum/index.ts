import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const BASE_URL = 'https://openaccess-api.clevelandart.org/api/artworks/';

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      const { query, skip = 0, limit = 20, hasImage = true, type, department, created_after, created_before } = body;
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (hasImage) params.set('has_image', '1');
      params.set('limit', String(limit));
      params.set('skip', String(skip));
      if (type) params.set('type', type);
      if (department) params.set('department', department);
      if (created_after) params.set('created_after', String(created_after));
      if (created_before) params.set('created_before', String(created_before));

      const resp = await fetch(`${BASE_URL}?${params.toString()}`);
      const data = await resp.json();
      return jsonResponse({ success: true, data });
    }

    if (action === 'object') {
      const { artworkId } = body;
      if (!artworkId) return errorResponse('artworkId is required');

      const resp = await fetch(`${BASE_URL}${artworkId}`);
      const data = await resp.json();
      return jsonResponse({ success: true, data });
    }

    return errorResponse('Invalid action. Use "search" or "object".');
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500);
  }
});
