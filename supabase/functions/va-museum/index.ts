import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, optionalInt, fetchUpstream, handleError } from '../_shared/cors.ts';

const BASE_URL = 'https://api.vam.ac.uk/v2/';
const NAME = 'V&A';

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
      const page = validateInt(body.page ?? 1, 'page', 1, 10000);
      if (page instanceof Response) return page;
      const pageSize = validateInt(body.pageSize ?? 20, 'pageSize', 1, 100);
      if (pageSize instanceof Response) return pageSize;
      const yearFrom = optionalInt(body.yearFrom, 'yearFrom', -10000, 3000);
      if (yearFrom instanceof Response) return yearFrom;
      const yearTo = optionalInt(body.yearTo, 'yearTo', -10000, 3000);
      if (yearTo instanceof Response) return yearTo;

      const params = new URLSearchParams();
      params.set('q', query);
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (body.hasImage !== false) params.set('images_exist', '1');
      if (yearFrom !== undefined) params.set('year_made_from', String(yearFrom));
      if (yearTo !== undefined) params.set('year_made_to', String(yearTo));
      if (typeof body.categoryId === 'string' && /^[A-Za-z0-9]{1,30}$/.test(body.categoryId)) {
        params.set('id_category', body.categoryId);
      }

      const data = await fetchUpstream(`${BASE_URL}objects/search?${params.toString()}`, NAME);
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'object') {
      const systemNumber = validateString(body.systemNumber, 'systemNumber', 50);
      if (systemNumber instanceof Response) return systemNumber;

      const data = await fetchUpstream(
        `${BASE_URL}museumobject/${encodeURIComponent(systemNumber)}`,
        NAME
      );
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "object".', 400, req);
  } catch (err) {
    return handleError(err, req);
  }
});
