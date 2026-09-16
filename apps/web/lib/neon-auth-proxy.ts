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

// Keep the OAuth callback on Evalomics so session cookies remain same-origin.
export async function rewriteNeonSocialSignInResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  const incoming = new URL(request.url);
  const path = incoming.pathname.replace(/\/+$/, '');
  if (path !== '/api/auth/sign-in/social' || !response.ok) return response;

  const appCallback = `${incoming.origin}/api/auth/callback/google`;
  const neonCallback = `${neonAuthBaseUrl()}/callback/google`;
  const headers = rewriteNeonResponseHeaders(response.headers, incoming.origin);

  let changed = false;

  const location = headers.get('location');
  if (location !== null) {
    const rewrittenLocation = location
      .split(neonCallback)
      .join(appCallback)
      .split(encodeURIComponent(neonCallback))
      .join(encodeURIComponent(appCallback));

    if (rewrittenLocation !== location) {
      headers.set('location', rewrittenLocation);
      changed = true;
    }
  }

  let bodyText: string;
  try {
    bodyText = await response.clone().text();
  } catch {
    return response;
  }

  const rewrittenBody = bodyText
    .split(neonCallback)
    .join(appCallback)
    .split(encodeURIComponent(neonCallback))
    .join(encodeURIComponent(appCallback));

  changed = changed || rewrittenBody !== bodyText;

  if (!changed) {
    console.warn('NEON_AUTH_CALLBACK_REWRITE_MISSED', {
      path,
      status: response.status,
      contentType: response.headers.get('content-type'),
      bodyLength: bodyText.length,
    });
    return response;
  }

  headers.set('x-evalomics-auth-rewrite', 'google-callback');
  headers.delete('content-length');
  headers.delete('content-encoding');

  const body =
    response.status === 204 || response.status === 205 || response.status === 304
      ? null
      : rewrittenBody;

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
