import { handleCors, jsonResponse, errorResponse, checkRateLimit } from '../_shared/cors.ts';

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
      (d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d)
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
      return errorResponse('FIRECRAWL_API_KEY is not configured', 500);
    }

    const body = await req.json();
    const { url, formats } = body;

    if (!url || typeof url !== 'string') {
      return errorResponse('url is required');
    }

    if (!isAllowedUrl(url)) {
      return errorResponse('URL domain is not in the allowed list. Only known museum domains are permitted.');
    }

    const resp = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: formats ?? ['markdown'],
        onlyMainContent: true,
        timeout: 30000,
      }),
    });

    const data = await resp.json();
    return jsonResponse({ success: true, data });
  } catch (err) {
    return errorResponse(`Server error: ${(err as Error).message}`, 500);
  }
});
