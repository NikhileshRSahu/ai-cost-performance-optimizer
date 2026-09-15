import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

export function hasGoogleAuthConfiguration(): boolean {
  return [
    process.env.DATABASE_URL,
    process.env.BETTER_AUTH_URL,
    process.env.BETTER_AUTH_SECRET,
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  ].every((value) => typeof value === 'string' && value.trim().length > 0);
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`${name}_REQUIRED`);
  }
  return value;
}

function createWebAuth() {
  const databaseUrl = requiredEnvironment('DATABASE_URL');
  const baseURL = requiredEnvironment('BETTER_AUTH_URL');
  const secret = requiredEnvironment('BETTER_AUTH_SECRET');
  const clientId = requiredEnvironment('GOOGLE_CLIENT_ID');
  const clientSecret = requiredEnvironment('GOOGLE_CLIENT_SECRET');

  return betterAuth({
    appName: 'Evalomics',
    baseURL,
    secret,
    database: new Pool({ connectionString: databaseUrl }),
    socialProviders: {
      google: {
        clientId,
        clientSecret,
        prompt: 'select_account',
      },
    },
    account: {
      encryptOAuthTokens: true,
    },
    advanced: {
      database: {
        joins: true,
      },
    },
  });
}

type WebAuth = ReturnType<typeof createWebAuth>;

let cachedAuth: WebAuth | null = null;

export function getWebAuth(): WebAuth {
  cachedAuth ??= createWebAuth();
  return cachedAuth;
}
