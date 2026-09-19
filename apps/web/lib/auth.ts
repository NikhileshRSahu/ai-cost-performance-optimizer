import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { and, eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { createDatabase } from '../../../src/persistence/database';
import {
  memberships,
  supportRequests,
  users,
  workspaceInvitations,
} from '../../../src/persistence/schema';
import { requireSelfHostedAuthConfiguration } from './auth-config';

function createAuthPool(connectionString: string): Pool {
  const pool = new Pool({
    connectionString,
    options: '-c search_path=auth',
  });
  pool.on('error', (error) => {
    const code = (error as Error & { code?: string }).code ?? 'UNKNOWN';
    console.warn('AUTH_DATABASE_POOL_IDLE_ERROR', code);
  });
  return pool;
}

function productionVercelOrigin(): string | null {
  if (process.env.VERCEL_ENV !== 'production') return null;

  const deploymentHost = process.env.VERCEL_URL?.trim();
  if (!deploymentHost) return null;

  try {
    return new URL(
      deploymentHost.startsWith('http')
        ? deploymentHost
        : `https://${deploymentHost}`,
    ).origin;
  } catch {
    return null;
  }
}

function createWebAuth() {
  const configuration = requireSelfHostedAuthConfiguration();
  const vercelOrigin = productionVercelOrigin();
  const trustedOrigins = [
    new URL(configuration.baseUrl).origin,
    'https://evalomics.vercel.app',
    ...(vercelOrigin === null ? [] : [vercelOrigin]),
  ];

  return betterAuth({
    appName: 'Evalomics',
    baseURL: configuration.baseUrl,
    secret: configuration.secret,
    trustedOrigins: [...new Set(trustedOrigins)],
    database: createAuthPool(configuration.databaseUrl),
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
    user: {
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          const database = createDatabase(configuration.databaseUrl);
          try {
            const appUser = (
              await database.db
                .select({ id: users.id })
                .from(users)
                .where(
                  and(
                    eq(users.authProvider, 'better-auth/google'),
                    eq(users.authSubject, user.id),
                  ),
                )
                .limit(1)
            ).at(0);

            if (appUser === undefined) return;

            const owned = (
              await database.db
                .select({ organizationId: memberships.organizationId })
                .from(memberships)
                .where(
                  and(
                    eq(memberships.userId, appUser.id),
                    eq(memberships.role, 'OWNER'),
                  ),
                )
                .limit(1)
            ).at(0);

            if (owned !== undefined) {
              throw new APIError('BAD_REQUEST', {
                message:
                  'Delete or transfer every owned Evalomics workspace before deleting your account.',
              });
            }

            await database.db.transaction(async (tx) => {
              await tx
                .update(supportRequests)
                .set({ userId: null })
                .where(eq(supportRequests.userId, appUser.id));

              await tx
                .update(workspaceInvitations)
                .set({ acceptedByUserId: null })
                .where(eq(workspaceInvitations.acceptedByUserId, appUser.id));

              await tx
                .delete(memberships)
                .where(eq(memberships.userId, appUser.id));
              await tx.delete(users).where(eq(users.id, appUser.id));
            });
          } finally {
            await database.close();
          }
        },
      },
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
