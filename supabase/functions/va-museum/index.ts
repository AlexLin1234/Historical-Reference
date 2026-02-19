import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt } from '../_shared/cors.ts';

const BASE_URL = 'https://api.vam.ac.uk/v2/';

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
      const page = validateInt(body.page ?? 1, 'page', 1, 10000);
      if (page instanceof Response) return page;
      const pageSize = validateInt(body.pageSize ?? 20, 'pageSize', 1, 100);
      if (pageSize instanceof Response) return pageSize;

      const { category } = body;
      const params = new URLSearchParams();
      params.set('q', query);
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      params.set('images_exist', 'true');
      if (category) params.set('q_object_type', String(category).slice(0, 200));

      const resp = await fetch(`${BASE_URL}objects/search?${params.toString()}`);
      const data = await resp.json();
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'object') {
      const systemNumber = validateString(body.systemNumber, 'systemNumber', 50);
      if (systemNumber instanceof Response) return systemNumber;

      const resp = await fetch(`${BASE_URL}museumobject/${encodeURIComponent(systemNumber)}`);
      const data = await resp.json();
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "object".', 400, req);
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500, req);
  }
});
