export interface Env {
  REINFOLIB_API_KEY: string;
  ALLOWED_ORIGINS: string;
}

// 不動産情報ライブラリで公開されている、都市計画情報・防災情報系のタイルAPIのうち
// このプロキシが中継対象とするもの。ここに無いIDへのリクエストは拒否する。
const ALLOWED_API_IDS = new Set([
  'XKT001',
  'XKT002',
  'XKT014',
  'XKT023',
  'XKT024',
  'XKT029',
]);

// 不動産情報ライブラリのタイルAPIが対応しているズームレベルの範囲
const MIN_ZOOM = 11;
const MAX_ZOOM = 15;

const TILE_PATH_PATTERN = /^\/tiles\/([A-Z0-9]+)\/(\d+)\/(\d+)\/(\d+)$/;

function parseAllowedOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function buildCorsHeaders(origin: string | null, allowedOrigins: string[]): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  });
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  return headers;
}

function jsonError(message: string, status: number, corsHeaders: Headers): Response {
  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify({ error: message }), { status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
    const corsHeaders = buildCorsHeaders(request.headers.get('Origin'), allowedOrigins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'GET') {
      return jsonError('Method Not Allowed', 405, corsHeaders);
    }

    const match = url.pathname.match(TILE_PATH_PATTERN);
    if (!match) {
      return jsonError('Not Found', 404, corsHeaders);
    }

    const [, apiId, zRaw, xRaw, yRaw] = match;
    if (!ALLOWED_API_IDS.has(apiId)) {
      return jsonError(`Unsupported apiId: ${apiId}`, 400, corsHeaders);
    }

    const z = Number(zRaw);
    const x = Number(xRaw);
    const y = Number(yRaw);
    if (!Number.isInteger(z) || z < MIN_ZOOM || z > MAX_ZOOM) {
      return jsonError(`z must be an integer between ${MIN_ZOOM} and ${MAX_ZOOM}`, 400, corsHeaders);
    }
    const tileCount = 2 ** z;
    if (!Number.isInteger(x) || x < 0 || x >= tileCount || !Number.isInteger(y) || y < 0 || y >= tileCount) {
      return jsonError('x/y are out of range for the given z', 400, corsHeaders);
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      corsHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }

    const upstreamUrl = `https://www.reinfolib.mlit.go.jp/ex-api/external/${apiId}?response_format=geojson&z=${z}&x=${x}&y=${y}`;
    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(upstreamUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': env.REINFOLIB_API_KEY },
      });
    } catch {
      return jsonError('Failed to reach the upstream API', 502, corsHeaders);
    }

    if (!upstreamResponse.ok) {
      return jsonError('Upstream API returned an error', upstreamResponse.status, corsHeaders);
    }

    const body = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', upstreamResponse.headers.get('Content-Type') ?? 'application/json');
    // 都市計画・防災情報の区域データは更新頻度が低いため、
    // 同一タイルへの再リクエストを避けるためキャッシュする。
    responseHeaders.set('Cache-Control', 'public, max-age=86400');

    const response = new Response(body, { status: 200, headers: responseHeaders });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};
