import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return errorResponse('FIRECRAWL_API_KEY is not configured', 500);
    }

    const body = await req.json();
    const { url, formats } = body;

    if (!url) {
      return errorResponse('url is required');
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
