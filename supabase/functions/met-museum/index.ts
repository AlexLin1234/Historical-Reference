import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/';

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      const { query, departmentId, dateBegin, dateEnd, hasImages = true } = body;
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (hasImages) params.set('hasImages', 'true');
      if (departmentId) params.set('departmentId', String(departmentId));
      if (dateBegin !== undefined) params.set('dateBegin', String(dateBegin));
      if (dateEnd !== undefined) params.set('dateEnd', String(dateEnd));

      const resp = await fetch(`${BASE_URL}search?${params.toString()}`);
      const data = await resp.json();
      return jsonResponse({ success: true, data });
    }

    if (action === 'object') {
      const { objectId } = body;
      if (!objectId) return errorResponse('objectId is required');

      const resp = await fetch(`${BASE_URL}objects/${objectId}`);
      const data = await resp.json();
      return jsonResponse({ success: true, data });
    }

    if (action === 'batch') {
      const { objectIds } = body;
      if (!objectIds || !Array.isArray(objectIds)) {
        return errorResponse('objectIds array is required');
      }

      const ids = objectIds.slice(0, 20);
      const results = await Promise.allSettled(
        ids.map(async (id: number) => {
          const resp = await fetch(`${BASE_URL}objects/${id}`);
          if (!resp.ok) return null;
          return resp.json();
        })
      );

      const objects = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean);

      return jsonResponse({ success: true, data: objects });
    }

    return errorResponse('Invalid action. Use "search", "object", or "batch".');
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500);
  }
});
