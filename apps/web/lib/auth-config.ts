export type AuthEnvironment = Readonly<Record<string, string | undefined>>;

export type SelfHostedAuthConfiguration = Readonly<{
  databaseUrl: string;
  secret: string;
  baseUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
}>;

const PRODUCTION_AUTH_URL = 'https://evalomics.vercel.app';

function nonEmpty(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function resolveAuthDatabaseUrl(
  environment: AuthEnvironment = process.env,
): string {
  const databaseUrl = nonEmpty(environment.DATABASE_URL);
  if (databaseUrl === null) throw new Error('DATABASE_URL_REQUIRED');

  const url = new URL(databaseUrl);
  if (
    url.hostname.endsWith('.neon.tech') &&
    url.hostname.includes('-pooler.')
  ) {
    url.hostname = url.hostname.replace('-pooler.', '.');
  }

  return url.toString();
}

export function resolveAuthBaseUrl(
  environment: AuthEnvironment = process.env,
): string {
  if (nonEmpty(environment.VERCEL_ENV)?.toLowerCase() === 'production') {
    return PRODUCTION_AUTH_URL;
  }

  const configured = nonEmpty(environment.BETTER_AUTH_URL);
  return (configured ?? 'http://localhost:3000').replace(/\/+$/, '');
}

// Google must always return to the canonical Evalomics-owned callback in production.
export function resolveGoogleCallbackUrl(
  environment: AuthEnvironment = process.env,
): string {
  return new URL(
    '/api/auth/callback/google',
    `${resolveAuthBaseUrl(environment)}/`,
  ).toString();
}

export function hasSelfHostedAuthConfiguration(
  environment: AuthEnvironment = process.env,
): boolean {
  const secret = nonEmpty(environment.BETTER_AUTH_SECRET);
  return Boolean(
    nonEmpty(environment.DATABASE_URL) &&
    secret !== null &&
    secret.length >= 32 &&
    nonEmpty(environment.BETTER_AUTH_URL) &&
    nonEmpty(environment.GOOGLE_CLIENT_ID) &&
    nonEmpty(environment.GOOGLE_CLIENT_SECRET),
  );
}

export function requireSelfHostedAuthConfiguration(
  environment: AuthEnvironment = process.env,
): SelfHostedAuthConfiguration {
  const databaseUrl = resolveAuthDatabaseUrl(environment);

  const secret = nonEmpty(environment.BETTER_AUTH_SECRET);
  if (secret === null || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET_REQUIRED');
  }

  const googleClientId = nonEmpty(environment.GOOGLE_CLIENT_ID);
  if (googleClientId === null) throw new Error('GOOGLE_CLIENT_ID_REQUIRED');

  const googleClientSecret = nonEmpty(environment.GOOGLE_CLIENT_SECRET);
  if (googleClientSecret === null) {
    throw new Error('GOOGLE_CLIENT_SECRET_REQUIRED');
  }

  const baseUrl = resolveAuthBaseUrl(environment);
  return Object.freeze({
    databaseUrl,
    secret,
    baseUrl,
    googleClientId,
    googleClientSecret,
    googleCallbackUrl: resolveGoogleCallbackUrl(environment),
  });
}
