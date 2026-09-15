export function neonAuthBaseUrl(): string {
  const value = process.env.NEON_AUTH_BASE_URL;
  if (value === undefined || value.trim().length === 0) {
    throw new Error('NEON_AUTH_BASE_URL_REQUIRED');
  }
  return value.replace(/\/+$/, '');
}

export function neonAuthTargetUrl(request: Request): string {
  const incoming = new URL(request.url);
  const suffix = incoming.pathname.replace(/^\/api\/auth/, '');
  const target = new URL(neonAuthBaseUrl() + (suffix || '/'));
  target.search = incoming.search;
  return target.toString();
}

export function buildNeonForwardHeaders(request: Request): Headers {
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

function appScopedCookie(cookie: string): string {
  const withoutDomain = cookie.replace(/;?\s*Domain=[^;]+/gi, '');
  if (/;\s*Path=/i.test(withoutDomain)) {
    return withoutDomain.replace(/;\s*Path=[^;]*/i, '; Path=/');
  }
  return `${withoutDomain}; Path=/`;
}

export function rewriteNeonResponseHeaders(
  source: Headers,
  requestOrigin?: string,
): Headers {
  const headers = new Headers(source);
  const location = headers.get('location');
  const base = process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, '');

  if (location !== null && base !== undefined && location.startsWith(base)) {
    const suffix = location.slice(base.length);
    if (requestOrigin === undefined) {
      headers.set('location', '/api/auth' + suffix);
    } else {
      headers.set(
        'location',
        new URL('/api/auth' + suffix, requestOrigin).toString(),
      );
    }
  }

  const headerSource = source as Headers & {
    getSetCookie?: (this: Headers) => string[];
  };
  if (typeof headerSource.getSetCookie === 'function') {
    headers.delete('set-cookie');
    for (const cookie of headerSource.getSetCookie()) {
      headers.append('set-cookie', appScopedCookie(cookie));
    }
  } else {
    const cookie = source.get('set-cookie');
    if (cookie !== null) {
      headers.set('set-cookie', appScopedCookie(cookie));
    }
  }

  return headers;
}

export async function rewriteNeonSocialSignInResponse(
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

    const headers = rewriteNeonResponseHeaders(
      response.headers,
      incoming.origin,
    );
    headers.delete('content-length');
    headers.delete('content-encoding');

    return new Response(JSON.stringify(record), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return response;
  }
}
