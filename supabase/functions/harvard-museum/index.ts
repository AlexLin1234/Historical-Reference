import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, fetchUpstream, handleError } from '../_shared/cors.ts';

const BASE_URL = 'https://api.harvardartmuseums.org/';
const API_KEY = Deno.env.get('HARVARD_API_KEY') || '';

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const rlResp = checkRateLimit(req, 60);
  if (rlResp) return rlResp;

  if (!API_KEY) {
    return errorResponse('Harvard Art Museums search is not set up on this server (missing API key)', 503, req);
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      const query = validateString(body.query, 'query');
      if (query instanceof Response) return query;
      const size = validateInt(body.size ?? 20, 'size', 1, 100);
      if (size instanceof Response) return size;
      const page = validateInt(body.page ?? 1, 'page', 1, 10000);
      if (page instanceof Response) return page;

      const { hasImage, classification } = body;

      const params = new URLSearchParams({
        apikey: API_KEY,
        q: query,
        size: String(size),
        page: String(page),
        sort: 'rank',
        sortorder: 'desc',
        fields: 'objectid,objectnumber,title,dated,datebegin,dateend,classification,medium,technique,dimensions,people,culture,primaryimageurl,images,department,century,url,creditline,imagepermissionlevel,description,labeltext',
      });

      if (hasImage) params.set('hasimage', '1');
      if (classification) params.set('classification', String(classification).slice(0, 200));

      const data = await fetchUpstream(`${BASE_URL}object?${params.toString()}`, 'Harvard Art Museums');
      return jsonResponse({ success: true, data }, 200, req);
    }

    if (action === 'object') {
      const objectId = validateInt(body.objectId, 'objectId', 1, 99999999);
      if (objectId instanceof Response) return objectId;

      const params = new URLSearchParams({ apikey: API_KEY });
      const data = await fetchUpstream(
        `${BASE_URL}object/${objectId}?${params.toString()}`,
        'Harvard Art Museums'
      );
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "object".', 400, req);
  } catch (err) {
    return handleError(err, req);
  }
});
