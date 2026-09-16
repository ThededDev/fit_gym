// CORS helper for Vercel-style serverless API endpoints (Request/Response Web API)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Wrap a Response with CORS headers
 */
export function corsResponse(body, options = {}) {
  const { status = 200, headers = {} } = options;
  return new Response(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

/**
 * Return JSON with CORS headers
 */
export function corsJson(data, options = {}) {
  const { status = 200, headers = {} } = options;
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

/**
 * Handle CORS preflight (OPTIONS) request.
 * Returns 204 with CORS headers, or null if not an OPTIONS request.
 */
export function handlePreflight(request) {
  if (request.method === 'OPTIONS') {
    return corsJson(null, { status: 204, headers: { 'Content-Length': '0' } });
  }
  return null;
}
