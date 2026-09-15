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

  for (const name of [
    'forwarded',
    'x-forwarded-host',
    'x-forwarded-port',
    'x-forwarded-proto',
    'x-forwarded-for',
    'x-vercel-forwarded-for',
    'x-vercel-id',
    'x-vercel-proxied-for',
  ]) {
    headers.delete(name);
  }

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

  const headerSource = source as Headers & {
    getSetCookie?: (this: Headers) => string[];
  };
  if (typeof headerSource.getSetCookie === 'function') {
    headers.delete('set-cookie');
    for (const cookie of headerSource.getSetCookie()) {
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

async function rewriteSocialSignInResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (
    path !== '/api/auth/sign-in/social' ||
    !response.ok ||
    !response.headers.get('content-type')?.includes('application/json')
  ) {
    return response;
  }

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    return response;
  }

  if (payload === null || typeof payload !== 'object') return response;
  const record = payload as Record<string, unknown>;
  if (typeof record.url !== 'string') return response;

  try {
    const providerUrl = new URL(record.url);
    if (providerUrl.hostname !== 'accounts.google.com') return response;

    const incoming = new URL(request.url);
    providerUrl.searchParams.set(
      'redirect_uri',
      `${incoming.origin}/api/auth/callback/google`,
    );
    record.url = providerUrl.toString();

    return new Response(JSON.stringify(record), {
      status: response.status,
      statusText: response.statusText,
      headers: rewriteResponseHeaders(response.headers),
    });
  } catch {
    return response;
  }
}

async function proxy(request: Request): Promise<Response> {
  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  const upstream = await fetch(targetUrl(request), {
    method,
    headers: forwardedHeaders(request),
    body,
    redirect: 'manual',
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const diagnostic = await upstream.clone().text();
    console.error('NEON_AUTH_PROXY_ERROR', {
      status: upstream.status,
      path: new URL(request.url).pathname,
      body: diagnostic.slice(0, 1000),
    });
  }

  const proxied = new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: rewriteResponseHeaders(upstream.headers),
  });

  return rewriteSocialSignInResponse(request, proxied);
}

export async function GET(request: Request): Promise<Response> {
  return proxy(request);
}

export async function POST(request: Request): Promise<Response> {
  return proxy(request);
}
