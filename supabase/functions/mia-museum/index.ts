import { handleCors, jsonResponse, errorResponse, checkRateLimit, validateString, validateInt, fetchUpstream, handleError } from '../_shared/cors.ts';

// Minneapolis Institute of Art: open Elasticsearch-backed search, no key.
const BASE_URL = 'https://search.artsmia.org/';
const NAME = 'Minneapolis Institute of Art';

/**
 * The query travels in the URL path and is parsed as Lucene query-string
 * syntax, so user text is reduced to words, "phrases" and -exclusions.
 */
function sanitize(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}\s"'-]/gu, ' ')
    .replace(/(^|\s)-(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
      const size = validateInt(body.size ?? 20, 'size', 1, 100);
      if (size instanceof Response) return size;
      const from = validateInt(body.from ?? 0, 'from', 0, 9900);
      if (from instanceof Response) return from;

      let text = sanitize(query);
      if ((text.match(/"/g) || []).length % 2 === 1) text = text.replace(/"/g, ' ');
      if (!text.trim()) return errorResponse('query has no searchable words', 400, req);

      const clauses = [`(${text})`];
      if (body.hasImage) clauses.push('image:valid');
      if (Array.isArray(body.classifications) && body.classifications.length > 0) {
        const terms = body.classifications
          .filter((c: unknown) => typeof c === 'string' && /^[\w ,/()&-]{1,60}$/.test(c as string))
          .slice(0, 8)
          .map((c: string) => `classification:"${c}"`);
        if (terms.length > 0) clauses.push(`(${terms.join(' OR ')})`);
      }

      const data = await fetchUpstream(
        `${BASE_URL}${encodeURIComponent(clauses.join(' AND '))}?size=${size}&from=${from}`,
        NAME
      );
      // Pass on only what the app uses.
      const hits = (data?.hits?.hits ?? []).map((h: { _source: unknown }) => h._source);
      const total = data?.hits?.total;
      return jsonResponse(
        {
          success: true,
          data: { total: typeof total === 'number' ? total : total?.value ?? 0, records: hits },
        },
        200,
        req
      );
    }

    if (action === 'object') {
      const objectId = validateInt(body.objectId, 'objectId', 0, 99999999);
      if (objectId instanceof Response) return objectId;
      const data = await fetchUpstream(`${BASE_URL}id/${objectId}`, NAME);
      if (!data || typeof data.id !== 'number') {
        return errorResponse(`${NAME}: record not found`, 404, req);
      }
      return jsonResponse({ success: true, data }, 200, req);
    }

    return errorResponse('Invalid action. Use "search" or "object".', 400, req);
  } catch (err) {
    return handleError(err, req);
  }
});
