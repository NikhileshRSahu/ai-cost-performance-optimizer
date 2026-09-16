'use client';

import { useEffect, useState } from 'react';

export type FxState =
  | Readonly<{
      status: 'identity';
      rate: '1';
      asOf: string;
      source: 'identity';
    }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'ready'; rate: string; asOf: string; source: string }>
  | Readonly<{ status: 'error' }>;

export function useFxRate(base: string, quote: string): FxState {
  const [state, setState] = useState<FxState>(() =>
    base === quote
      ? {
          status: 'identity',
          rate: '1',
          asOf: new Date().toISOString(),
          source: 'identity',
        }
      : { status: 'loading' },
  );

  useEffect(() => {
    if (base === quote) {
      setState({
        status: 'identity',
        rate: '1',
        asOf: new Date().toISOString(),
        source: 'identity',
      });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    void fetch(
      `/api/fx?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('FX_UNAVAILABLE');
        return (await response.json()) as {
          rate: string;
          asOf: string;
          source: string;
        };
      })
      .then((payload) => {
        setState({
          status: 'ready',
          rate: payload.rate,
          asOf: payload.asOf,
          source: payload.source,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setState({ status: 'error' });
      });

    return () => {
      controller.abort();
    };
  }, [base, quote]);

  return state;
}
