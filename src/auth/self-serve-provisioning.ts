import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { TrustedPasswordlessIdentity } from './contracts.js';
import { parseTrustedPasswordlessIdentity } from './contracts.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import { memberships, organizations, users } from '../persistence/schema.js';
import type { AuthenticatedSession } from '../workbench/authz.js';

export type SelfServeProvisioningDefaults = Readonly<{
  organizationName: string;
  reportingCurrency: string;
  timezone: string;
  materialityTarget: string;
}>;

export type SelfServeProvisioningResult = Readonly<{
  session: AuthenticatedSession;
  activeOrganizationId: string;
  userCreated: boolean;
  organizationCreated: boolean;
}>;

const DEFAULTS: SelfServeProvisioningDefaults = Object.freeze({
  organizationName: 'My AI Workspace',
  reportingCurrency: 'USD',
  timezone: 'UTC',
  materialityTarget: '10',
});

function stableId(prefix: 'usr' | 'org', value: string): string {
  const digest = createHash('sha256').update(value).digest('hex').slice(0, 24);
  return `${prefix}_${digest}`;
}

async function readMemberships(
  database: PersistenceDatabase,
  userId: string,
): Promise<AuthenticatedSession['memberships']> {
  const rows = await database
    .select({
      organizationId: memberships.organizationId,
      role: memberships.role,
    })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(memberships.createdAt, memberships.organizationId);

  return Object.freeze(
    rows.map((row) =>
      Object.freeze({
        organizationId: row.organizationId,
        role: row.role,
      }),
    ),
  );
}

export async function provisionSelfServeIdentity(
  database: PersistenceDatabase,
  input: unknown,
  defaults: Partial<SelfServeProvisioningDefaults> = {},
): Promise<SelfServeProvisioningResult> {
  const identity: TrustedPasswordlessIdentity =
    parseTrustedPasswordlessIdentity(input);
  const configuration = Object.freeze({ ...DEFAULTS, ...defaults });

  return database.transaction(async (transaction) => {
    const [existingIdentity] = await transaction
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(
        and(
          eq(users.authProvider, identity.provider),
          eq(users.authSubject, identity.subject),
        ),
      )
      .limit(1);

    let userId = existingIdentity?.id;
    let userCreated = false;

    if (userId === undefined) {
      const [emailOwner] = await transaction
        .select({
          id: users.id,
          authProvider: users.authProvider,
          authSubject: users.authSubject,
        })
        .from(users)
        .where(eq(users.email, identity.email))
        .limit(1);

      if (emailOwner !== undefined) {
        throw new Error('AUTH_EMAIL_IDENTITY_CONFLICT');
      }

      userId = stableId(
        'usr',
        `${identity.provider}\n${identity.subject}`,
      );

      const insertedUsers = await transaction
        .insert(users)
        .values({
          id: userId,
          email: identity.email,
          authProvider: identity.provider,
          authSubject: identity.subject,
        })
        .onConflictDoNothing()
        .returning({ id: users.id });

      userCreated = insertedUsers.length === 1;

      const [resolvedUser] = await transaction
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.authProvider, identity.provider),
            eq(users.authSubject, identity.subject),
          ),
        )
        .limit(1);

      if (resolvedUser === undefined) {
        throw new Error('AUTH_IDENTITY_PROVISION_FAILED');
      }
      userId = resolvedUser.id;
    }

    const currentMemberships = await readMemberships(transaction, userId);
    if (currentMemberships.length > 0) {
      return Object.freeze({
        session: Object.freeze({
          userId,
          memberships: currentMemberships,
        }),
        activeOrganizationId: currentMemberships[0]!.organizationId,
        userCreated,
        organizationCreated: false,
      });
    }

    const organizationId = stableId('org', `${userId}\nprimary-workspace`);
    const insertedOrganizations = await transaction
      .insert(organizations)
      .values({
        id: organizationId,
        name: configuration.organizationName,
        reportingCurrency: configuration.reportingCurrency,
        timezone: configuration.timezone,
        materialityTarget: configuration.materialityTarget,
        isDemo: false,
      })
      .onConflictDoNothing()
      .returning({ id: organizations.id });

    await transaction
      .insert(memberships)
      .values({
        organizationId,
        userId,
        role: 'OWNER',
      })
      .onConflictDoNothing();

    const provisionedMemberships = await readMemberships(transaction, userId);
    const activeOrganization = provisionedMemberships.find(
      (membership) => membership.organizationId === organizationId,
    );

    if (activeOrganization === undefined) {
      throw new Error('AUTH_WORKSPACE_PROVISION_FAILED');
    }

    return Object.freeze({
      session: Object.freeze({
        userId,
        memberships: provisionedMemberships,
      }),
      activeOrganizationId: organizationId,
      userCreated,
      organizationCreated: insertedOrganizations.length === 1,
    });
  });
}
