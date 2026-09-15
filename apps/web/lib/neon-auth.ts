export type RuntimeIdentity = Readonly<{
  input: unknown;
  allowProvision: boolean;
}>;

export type NeonAuthFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

function authBaseUrl(): string | null {
  const value = process.env.NEON_AUTH_BASE_URL;
  if (value === undefined || value.trim().length === 0) return null;
  return value.replace(/\/+$/, '');
}

export function hasNeonAuthConfiguration(): boolean {
  return authBaseUrl() !== null;
}

function sessionUrl(): string | null {
  const base = authBaseUrl();
  return base === null ? null : `${base}/get-session`;
}

type SessionPayload = Readonly<{
  session?: Readonly<Record<string, unknown>> | null;
  user?: Readonly<{
    id?: unknown;
    email?: unknown;
    emailVerified?: unknown;
  }> | null;
}>;

function parseIdentity(payload: unknown): RuntimeIdentity | null {
  if (payload === null || typeof payload !== 'object') return null;
  const candidate = payload as SessionPayload;
  const user = candidate.user;
  if (user === null || user === undefined) return null;
  if (
    typeof user.id !== 'string' ||
    user.id.length === 0 ||
    typeof user.email !== 'string' ||
    user.email.length === 0 ||
    user.emailVerified !== true
  ) {
    return null;
  }

  return Object.freeze({
    input: Object.freeze({
      provider: 'neon-auth',
      subject: user.id,
      email: user.email,
      emailVerified: true,
    }),
    allowProvision: true,
  });
}

export async function readNeonAuthIdentity(
  requestHeaders: Headers,
  fetcher: NeonAuthFetch = fetch,
): Promise<RuntimeIdentity | null> {
  const url = sessionUrl();
  if (url === null) return null;

  const headers = new Headers();
  const cookie = requestHeaders.get('cookie');
  const userAgent = requestHeaders.get('user-agent');
  if (cookie !== null) headers.set('cookie', cookie);
  if (userAgent !== null) headers.set('user-agent', userAgent);
  headers.set('accept', 'application/json');

  let response: Response;
  try {
    response = await fetcher(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  try {
    return parseIdentity(await response.json());
  } catch {
    return null;
  }
}
