import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

let cachedAuth: ReturnType<typeof betterAuth> | null = null;

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

export function getWebAuth(): ReturnType<typeof betterAuth> {
  if (cachedAuth !== null) return cachedAuth;

  const databaseUrl = requiredEnvironment('DATABASE_URL');
  const baseURL = requiredEnvironment('BETTER_AUTH_URL');
  const secret = requiredEnvironment('BETTER_AUTH_SECRET');
  const clientId = requiredEnvironment('GOOGLE_CLIENT_ID');
  const clientSecret = requiredEnvironment('GOOGLE_CLIENT_SECRET');

  cachedAuth = betterAuth({
    appName: 'Proovance',
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
    advanced: {
      database: {
        joins: true,
      },
    },
  });

  return cachedAuth;
}
