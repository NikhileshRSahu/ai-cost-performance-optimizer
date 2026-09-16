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

function rewriteGoogleAuthorizationUrl(
  value: string,
  callbackUrl: string,
): Readonly<{ value: string; changed: boolean }> {
  try {
    const candidate = new URL(value);
    if (
      candidate.hostname !== 'accounts.google.com' ||
      !candidate.searchParams.has('redirect_uri')
    ) {
      return { value, changed: false };
    }

    candidate.searchParams.set('redirect_uri', callbackUrl);
    return { value: candidate.toString(), changed: true };
  } catch {
    return { value, changed: false };
  }
}

function rewriteGoogleAuthorizationUrls(
  value: unknown,
  callbackUrl: string,
): Readonly<{ value: unknown; changed: boolean }> {
  if (typeof value === 'string') {
    return rewriteGoogleAuthorizationUrl(value, callbackUrl);
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const rewritten = rewriteGoogleAuthorizationUrls(item, callbackUrl);
      changed = changed || rewritten.changed;
      return rewritten.value;
    });
    return { value: next, changed };
  }

  if (value !== null && typeof value === 'object') {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const rewritten = rewriteGoogleAuthorizationUrls(item, callbackUrl);
      changed = changed || rewritten.changed;
      next[key] = rewritten.value;
    }
    return { value: next, changed };
  }

  return { value, changed: false };
}

export async function rewriteNeonSocialSignInResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  const incoming = new URL(request.url);
  const path = incoming.pathname.replace(/\/+$/, '');
  if (path !== '/api/auth/sign-in/social' || !response.ok) return response;

  const callbackUrl = `${incoming.origin}/api/auth/callback/google`;
  const headers = rewriteNeonResponseHeaders(response.headers, incoming.origin);

  let changed = false;
  const location = headers.get('location');
  if (location !== null) {
    const rewritten = rewriteGoogleAuthorizationUrl(location, callbackUrl);
    if (rewritten.changed) {
      headers.set('location', rewritten.value);
      changed = true;
    }
  }

  if (!response.headers.get('content-type')?.includes('application/json')) {
    if (changed) headers.set('x-evalomics-auth-rewrite', 'google-callback');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    return response;
  }

  const rewrittenPayload = rewriteGoogleAuthorizationUrls(
    payload,
    callbackUrl,
  );
  changed = changed || rewrittenPayload.changed;

  if (!changed) return response;

  headers.set('x-evalomics-auth-rewrite', 'google-callback');
  headers.delete('content-length');
  headers.delete('content-encoding');

  return new Response(JSON.stringify(rewrittenPayload.value), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
