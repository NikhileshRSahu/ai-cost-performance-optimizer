import { afterEach, describe, expect, it } from 'vitest';
import {
  buildNeonForwardHeaders,
  neonAuthTargetUrl,
  rewriteNeonResponseHeaders,
  rewriteNeonSocialSignInResponse,
} from '../../apps/web/lib/neon-auth-proxy.js';

const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;

afterEach(() => {
  if (originalBaseUrl === undefined) {
    delete process.env.NEON_AUTH_BASE_URL;
  } else {
    process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
  }
});

describe('Neon Auth reverse proxy', () => {
  it('maps the app auth path to the Neon Auth base URL without forwarding host metadata', () => {
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth/';

    const request = new Request(
      'https://evalomics.vercel.app/api/auth/callback/google?code=abc&state=123',
      {
        headers: {
          host: 'evalomics.vercel.app',
          'x-forwarded-host': 'evalomics.vercel.app',
          'x-forwarded-proto': 'https',
          cookie: 'better-auth.session_token=value',
        },
      },
    );

    expect(neonAuthTargetUrl(request)).toBe(
      'https://example.neonauth.aws.neon.tech/evalomics/auth/callback/google?code=abc&state=123',
    );

    const headers = buildNeonForwardHeaders(request);
    expect(headers.get('host')).toBeNull();
    expect(headers.get('x-forwarded-host')).toBeNull();
    expect(headers.get('x-forwarded-proto')).toBeNull();
    expect(headers.get('cookie')).toBe('better-auth.session_token=value');
    expect(headers.get('accept-encoding')).toBe('identity');
  });

  it('rewrites Neon callback locations and scopes session cookies to the Evalomics origin', () => {
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth';

    const source = new Headers();
    source.set(
      'location',
      'https://example.neonauth.aws.neon.tech/evalomics/auth/get-session',
    );
    source.append(
      'set-cookie',
      'better-auth.session_token=secret; Domain=example.neonauth.aws.neon.tech; Path=/evalomics/auth; HttpOnly; Secure; SameSite=Lax',
    );

    const headers = rewriteNeonResponseHeaders(
      source,
      'https://evalomics.vercel.app',
    );

    expect(headers.get('location')).toBe(
      'https://evalomics.vercel.app/api/auth/get-session',
    );
    const cookie = headers.get('set-cookie');
    expect(cookie).toContain('better-auth.session_token=secret');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).not.toContain('Domain=');
    expect(cookie).not.toContain('Path=/evalomics/auth');
  });

  it('forces Google to return through the Evalomics callback without stale entity headers', async () => {
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth';

    const request = new Request(
      'https://evalomics.vercel.app/api/auth/sign-in/social',
      { method: 'POST' },
    );
    const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    google.searchParams.set(
      'redirect_uri',
      'https://example.neonauth.aws.neon.tech/evalomics/auth/callback/google',
    );

    const response = new Response(JSON.stringify({ url: google.toString() }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-length': '999',
        'content-encoding': 'gzip',
      },
    });

    const rewritten = await rewriteNeonSocialSignInResponse(request, response);
    const payload = (await rewritten.json()) as { url: string };
    expect(new URL(payload.url).searchParams.get('redirect_uri')).toBe(
      'https://evalomics.vercel.app/api/auth/callback/google',
    );
    expect(rewritten.headers.get('content-length')).toBeNull();
    expect(rewritten.headers.get('content-encoding')).toBeNull();
  });

  it('rewrites a nested Google authorization URL returned by Neon Auth', async () => {
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth';

    const request = new Request(
      'https://evalomics.vercel.app/api/auth/sign-in/social/',
      { method: 'POST' },
    );
    const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    google.searchParams.set(
      'redirect_uri',
      'https://example.neonauth.aws.neon.tech/evalomics/auth/callback/google',
    );

    const response = new Response(
      JSON.stringify({
        data: {
          redirect: true,
          url: google.toString(),
        },
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );

    const rewritten = await rewriteNeonSocialSignInResponse(request, response);
    const payload = (await rewritten.json()) as {
      data: { url: string };
    };

    expect(new URL(payload.data.url).searchParams.get('redirect_uri')).toBe(
      'https://evalomics.vercel.app/api/auth/callback/google',
    );
    expect(rewritten.headers.get('x-evalomics-auth-rewrite')).toBe(
      'google-callback',
    );
  });

  it('rewrites nested Google authorization URLs and tolerates a trailing slash', async () => {
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth';

    const request = new Request(
      'https://evalomics.vercel.app/api/auth/sign-in/social/',
      { method: 'POST' },
    );
    const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    google.searchParams.set(
      'redirect_uri',
      'https://example.neonauth.aws.neon.tech/evalomics/auth/callback/google',
    );

    const response = new Response(
      JSON.stringify({ data: { redirect: { url: google.toString() } } }),
      {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );

    const rewritten = await rewriteNeonSocialSignInResponse(request, response);
    const payload = (await rewritten.json()) as {
      data: { redirect: { url: string } };
    };

    expect(
      new URL(payload.data.redirect.url).searchParams.get('redirect_uri'),
    ).toBe('https://evalomics.vercel.app/api/auth/callback/google');
  });

  it('rewrites Google authorization URLs returned in Location headers', async () => {
    process.env.NEON_AUTH_BASE_URL =
      'https://example.neonauth.aws.neon.tech/evalomics/auth';

    const request = new Request(
      'https://evalomics.vercel.app/api/auth/sign-in/social',
      { method: 'POST' },
    );
    const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    google.searchParams.set(
      'redirect_uri',
      'https://example.neonauth.aws.neon.tech/evalomics/auth/callback/google',
    );

    const response = new Response(null, {
      status: 204,
      headers: { location: google.toString() },
    });

    const rewritten = await rewriteNeonSocialSignInResponse(request, response);
    const location = rewritten.headers.get('location');
    expect(location).not.toBeNull();
    if (location === null) throw new Error('LOCATION_REQUIRED');
    expect(new URL(location).searchParams.get('redirect_uri')).toBe(
      'https://evalomics.vercel.app/api/auth/callback/google',
    );
  });
});
