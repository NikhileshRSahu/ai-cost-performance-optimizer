function neonAuthBaseUrl(): string {
  const value = process.env.NEON_AUTH_BASE_URL;
  if (value === undefined || value.trim().length === 0) {
    throw new Error('NEON_AUTH_BASE_URL_REQUIRED');
  }
  return value.replace(/\/+$/, '');
}

function targetUrl(request: Request): string {
  const incoming = new URL(request.url);
  const suffix = incoming.pathname.replace(/^\/api\/auth/, '');
  const target = new URL(neonAuthBaseUrl() + (suffix || '/'));
  target.search = incoming.search;
  return target.toString();
}

function forwardedHeaders(request: Request): Headers {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.set('accept-encoding', 'identity');
  return headers;
}

function rewriteResponseHeaders(source: Headers): Headers {
  const headers = new Headers(source);
  const location = headers.get('location');
  const base = process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, '');
  if (location !== null && base !== undefined && location.startsWith(base)) {
    headers.set('location', '/api/auth' + location.slice(base.length));
  }

  const getSetCookie = (source as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;
  if (typeof getSetCookie === 'function') {
    headers.delete('set-cookie');
    for (const cookie of getSetCookie.call(source)) {
      headers.append('set-cookie', cookie.replace(/;?\s*Domain=[^;]+/gi, ''));
    }
  } else {
    const cookie = source.get('set-cookie');
    if (cookie !== null) {
      headers.set('set-cookie', cookie.replace(/;?\s*Domain=[^;]+/gi, ''));
    }
  }
  return headers;
}

async function proxy(request: Request): Promise<Response> {
  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  const response = await fetch(targetUrl(request), {
    method,
    headers: forwardedHeaders(request),
    body,
    redirect: 'manual',
    cache: 'no-store',
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: rewriteResponseHeaders(response.headers),
  });
}

export async function GET(request: Request): Promise<Response> {
  return proxy(request);
}

export async function POST(request: Request): Promise<Response> {
  return proxy(request);
}
