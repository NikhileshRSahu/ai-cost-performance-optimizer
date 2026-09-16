import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../apps/web/app/api/fx/route.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FX reference endpoint', () => {
  it('returns an identity rate without calling an upstream service', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await GET(
      new NextRequest('http://localhost/api/fx?base=USD&quote=USD'),
    );
    const body = (await response.json()) as { rate: string; source: string };

    expect(response.status).toBe(200);
    expect(body.rate).toBe('1');
    expect(body.source).toBe('identity');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns a timestamped upstream reference rate', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            base: 'USD',
            quote: 'INR',
            rate: 95.5,
            date: '2026-09-16',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    const response = await GET(
      new NextRequest('http://localhost/api/fx?base=USD&quote=INR'),
    );
    const body = (await response.json()) as {
      rate: string;
      asOf: string;
      source: string;
    };

    expect(response.status).toBe(200);
    expect(body.rate).toBe('95.5');
    expect(body.asOf).toBe('2026-09-16');
    expect(body.source).toBe('Frankfurter');
  });

  it('rejects unsupported currencies', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/fx?base=USD&quote=XYZ'),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'UNSUPPORTED_CURRENCY',
    });
  });

  it('fails closed when the FX source is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const response = await GET(
      new NextRequest('http://localhost/api/fx?base=USD&quote=INR'),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'FX_UNAVAILABLE' });
  });
});
