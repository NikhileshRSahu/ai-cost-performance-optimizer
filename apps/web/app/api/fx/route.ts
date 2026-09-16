import { NextResponse } from 'next/server';

const SUPPORTED = new Set(['USD', 'EUR', 'GBP', 'INR']);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const base = (
    request.nextUrl.searchParams.get('base') ?? 'USD'
  ).toUpperCase();
  const quote = (
    request.nextUrl.searchParams.get('quote') ?? 'USD'
  ).toUpperCase();

  if (!SUPPORTED.has(base) || !SUPPORTED.has(quote)) {
    return NextResponse.json(
      { error: 'UNSUPPORTED_CURRENCY' },
      { status: 400 },
    );
  }

  if (base === quote) {
    return NextResponse.json({
      base,
      quote,
      rate: '1',
      asOf: new Date().toISOString(),
      source: 'identity',
    });
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rate/${base.toLowerCase()}/${quote.toLowerCase()}`,
      {
        next: { revalidate: 3600 },
        headers: { accept: 'application/json' },
      },
    );

    if (!response.ok) {
      throw new Error(`FX_UPSTREAM_${String(response.status)}`);
    }

    const payload = (await response.json()) as {
      rate?: number;
      date?: string;
      base?: string;
      quote?: string;
    };

    if (
      typeof payload.rate !== 'number' ||
      !Number.isFinite(payload.rate) ||
      payload.rate <= 0
    ) {
      throw new Error('FX_RATE_INVALID');
    }

    return NextResponse.json({
      base,
      quote,
      rate: String(payload.rate),
      asOf: payload.date ?? new Date().toISOString(),
      source: 'Frankfurter',
    });
  } catch {
    return NextResponse.json({ error: 'FX_UNAVAILABLE' }, { status: 503 });
  }
}
