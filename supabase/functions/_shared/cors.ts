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
