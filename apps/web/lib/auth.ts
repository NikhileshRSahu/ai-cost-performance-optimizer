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
    trustedOrigins: [
      new URL(configuration.baseUrl).origin,
      'https://evalomics.vercel.app',
    ],
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
