import { handleCors, jsonResponse, errorResponse, checkRateLimit, handleError } from '../_shared/cors.ts';

const ALLOWED_DOMAINS = [
  'www.britishmuseum.org',
  'collections.louvre.fr',
  'americanhistory.si.edu',
  'www.nationalgallery.org.uk',
  'www.rijksmuseum.nl',
  'collections.mfa.org',
  'wallacelive.wallacecollection.org',
  'collections.royalarmouries.org',
];

function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const rlResp = checkRateLimit(req, 10); // stricter limit for scraping
  if (rlResp) return rlResp;

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return errorResponse('Web scraping is not set up on this server (missing Firecrawl API key)', 503, req);
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || url.length > 2000) {
      return errorResponse('url is required', 400, req);
    }

    if (!isAllowedUrl(url)) {
      return errorResponse('URL domain is not in the allowed list. Only known museum domains are permitted.', 400, req);
    }

    const resp = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 30000,
      }),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data || data.success === false) {
      return errorResponse(
        `The page could not be scraped${data?.error ? `: ${String(data.error).slice(0, 200)}` : ''}`,
        502,
        req
      );
    }
    return jsonResponse({ success: true, data }, 200, req);
  } catch (err) {
    return handleError(err, req);
  }
});
