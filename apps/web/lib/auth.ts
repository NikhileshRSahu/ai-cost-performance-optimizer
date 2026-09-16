import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import {
  hasSelfHostedAuthConfiguration,
  requireSelfHostedAuthConfiguration,
} from './auth-config';

export function hasGoogleAuthConfiguration(): boolean {
  return hasSelfHostedAuthConfiguration();
}

function createWebAuth() {
  const configuration = requireSelfHostedAuthConfiguration();

  return betterAuth({
    appName: 'Evalomics',
    baseURL: configuration.baseUrl,
    secret: configuration.secret,
    trustedOrigins: [configuration.baseUrl],
    database: new Pool({
      connectionString: configuration.databaseUrl,
      options: '-c search_path=auth',
    }),
    socialProviders: {
      google: {
        clientId: configuration.googleClientId,
        clientSecret: configuration.googleClientSecret,
        redirectURI: configuration.googleCallbackUrl,
        prompt: 'select_account',
        requireEmailVerification: true,
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
