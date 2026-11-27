// --- CORS ---

const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS');
const allowedOriginList = ALLOWED_ORIGINS
  ? ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : null; // null = allow all (development)

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '*';
  if (!allowedOriginList) return origin; // dev: reflect origin
  if (allowedOriginList.includes(origin)) return origin;
  return allowedOriginList[0]; // fallback to first allowed
}

function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }
  return null;
}

export function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(req ? corsHeaders(req) : {
      'Access-Control-Allow-Origin': allowedOriginList ? allowedOriginList[0] : '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }),
  };
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(message: string, status = 400, req?: Request): Response {
  return jsonResponse({ success: false, error: message }, status, req);
}

// --- Rate Limiting ---

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  req: Request,
  maxRequests = 30,
  windowMs = 60_000
): Response | null {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';

  const now = Date.now();

  // Keep the map bounded: drop expired entries once it grows.
  if (rateLimitMap.size > 5000) {
    for (const [key, value] of rateLimitMap) {
      if (now > value.resetAt) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return errorResponse('Rate limit exceeded. Try again later.', 429, req);
  }

  return null;
}

// --- Input Validation ---

export function validateString(
  value: unknown,
  name: string,
  maxLength = 500
): string | Response {
  if (typeof value !== 'string' || value.length === 0) {
    return errorResponse(`${name} is required and must be a string`);
  }
  if (value.length > maxLength) {
    return errorResponse(`${name} must be at most ${maxLength} characters`);
  }
  return value;
}

export function validateInt(
  value: unknown,
  name: string,
  min = 0,
  max = 1000
): number | Response {
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(num) || num < min || num > max) {
    return errorResponse(`${name} must be an integer between ${min} and ${max}`);
  }
  return num;
}

/** Optional integer: undefined/null/'' pass through as undefined. */
export function optionalInt(
  value: unknown,
  name: string,
  min: number,
  max: number
): number | undefined | Response {
  if (value === undefined || value === null || value === '') return undefined;
  return validateInt(value, name, min, max);
}

// --- Upstream requests ---

export class UpstreamError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Fetch JSON from a museum API with a timeout. Throws UpstreamError on a
 * non-2xx status, a timeout or a non-JSON body, so a failing museum is
 * reported as a failure instead of being passed to the browser as "success".
 *
 * `retries` re-attempts transient failures (bot-protection 403s, 5xx, network
 * errors) after a short pause. A 404 or 429 is never retried.
 */
export async function fetchUpstream(
  url: string,
  name: string,
  init: RequestInit = {},
  timeoutMs = 12_000,
  retries = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  let lastError: UpstreamError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 350 * attempt + Math.random() * 250));
    try {
      return await fetchOnce(url, name, init, timeoutMs);
    } catch (err) {
      lastError = err as UpstreamError;
      if (lastError.status === 404 || lastError.status === 429) break;
    }
  }
  throw lastError!;
}

async function fetchOnce(
  url: string,
  name: string,
  init: RequestInit,
  timeoutMs: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ReenactorsReference/1.0 (museum collection search)',
        ...(init.headers || {}),
      },
    });
    if (!resp.ok) {
      await resp.body?.cancel();
      throw new UpstreamError(
        resp.status === 404
          ? `${name}: record not found`
          : resp.status === 429
            ? `${name} is rate-limiting requests; try again shortly`
            : `${name} API returned ${resp.status}`,
        resp.status === 404 ? 404 : resp.status === 429 ? 429 : 502
      );
    }
    try {
      return await resp.json();
    } catch {
      throw new UpstreamError(`${name} API returned an unreadable response`, 502);
    }
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new UpstreamError(`${name} API timed out`, 504);
    }
    throw new UpstreamError(`${name} API is unreachable`, 502);
  } finally {
    clearTimeout(timer);
  }
}

/** Map any thrown value to a JSON error response without leaking internals. */
export function handleError(err: unknown, req: Request): Response {
  if (err instanceof UpstreamError) return errorResponse(err.message, err.status, req);
  if (err instanceof SyntaxError) return errorResponse('Request body must be valid JSON', 400, req);
  console.error(err);
  return errorResponse('Unexpected server error', 500, req);
}

// --- Place filters ---

const PLACE_NAME = /^\p{L}[\p{L} .'-]{0,59}$/u;

/**
 * Place or culture names for a region filter. Anything that is not a plain
 * name (letters, spaces, . ' -) is dropped, so names can be quoted into a
 * museum's query syntax safely.
 */
export function placeList(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && PLACE_NAME.test(v.trim()))
    .map((v) => v.trim())
    .slice(0, max);
}

/** A single place name, or undefined when absent or not a plain name. */
export function placeName(value: unknown): string | undefined {
  return placeList([value], 1)[0];
}
