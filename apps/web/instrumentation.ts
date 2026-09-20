type RequestError = Error & { digest?: string };

function safeError(error: unknown): { name: string; message: string; digest?: string } {
  if (error instanceof Error) {
    const requestError = error as RequestError;
    return {
      name: requestError.name || 'Error',
      message: requestError.message || 'Unknown server error',
      ...(requestError.digest ? { digest: requestError.digest } : {}),
    };
  }
  return { name: 'UnknownError', message: 'Unknown server error' };
}

export async function register() {
  // Reserved for provider-specific tracing initialization.
}

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string; headers?: Record<string, string> },
  context: { routerKind?: string; routePath?: string; routeType?: string; renderSource?: string }
) {
  const normalized = safeError(error);
  console.error('EVALOMICS_REQUEST_ERROR', JSON.stringify({
    ...normalized,
    path: request.path ?? 'unknown',
    method: request.method ?? 'unknown',
    routerKind: context.routerKind ?? 'unknown',
    routePath: context.routePath ?? 'unknown',
    routeType: context.routeType ?? 'unknown',
    renderSource: context.renderSource ?? 'unknown',
    occurredAt: new Date().toISOString(),
  }));
}
