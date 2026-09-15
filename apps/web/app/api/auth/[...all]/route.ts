import {
  buildNeonForwardHeaders,
  neonAuthTargetUrl,
  rewriteNeonResponseHeaders,
  rewriteNeonSocialSignInResponse,
} from '../../../../lib/neon-auth-proxy';

async function proxy(request: Request): Promise<Response> {
  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  const upstream = await fetch(neonAuthTargetUrl(request), {
    method,
    headers: buildNeonForwardHeaders(request),
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
    headers: rewriteNeonResponseHeaders(
      upstream.headers,
      new URL(request.url).origin,
    ),
  });

  return rewriteNeonSocialSignInResponse(request, proxied);
}

export async function GET(request: Request): Promise<Response> {
  return proxy(request);
}

export async function POST(request: Request): Promise<Response> {
  return proxy(request);
}
