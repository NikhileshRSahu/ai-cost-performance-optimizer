import { and, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../database.js';
import { providerConnections } from '../provider-connections-schema.js';
import { requireOrganizationAccess } from '../tenant.js';
import type { AuthenticatedSession } from '../../workbench/authz.js';

export type ProviderConnectionProvider = 'OPENAI' | 'ANTHROPIC';

export type ProviderConnectionSummary = Readonly<{
  organizationId: string;
  provider: ProviderConnectionProvider;
  connectedAt: string;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  safeErrorCategory: string | null;
  revokedAt: string | null;
  updatedAt: string;
}>;

function requireProvider(provider: string): asserts provider is ProviderConnectionProvider {
  if (provider !== 'OPENAI' && provider !== 'ANTHROPIC') {
    throw new Error('PROVIDER_CONNECTION_PROVIDER_INVALID');
  }
}

function requireIso(value: string, error: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(error);
  }
}

export async function saveProviderConnection(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    provider: ProviderConnectionProvider;
    credentialCiphertext: string;
    connectedAt: string;
  }>,
): Promise<void> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_CREDENTIAL_REFERENCE',
  });
  requireProvider(input.provider);
  requireIso(input.connectedAt, 'PROVIDER_CONNECTION_CONNECTED_AT_INVALID');
  if (input.credentialCiphertext.trim().length === 0) {
    throw new Error('PROVIDER_CONNECTION_CREDENTIAL_REQUIRED');
  }

  await input.db
    .insert(providerConnections)
    .values({
      organizationId: input.organizationId,
      provider: input.provider,
      credentialCiphertext: input.credentialCiphertext,
      connectedAt: input.connectedAt,
      lastSyncStatus: 'NEVER',
      safeErrorCategory: null,
      revokedAt: null,
      createdByUserId: input.session.userId,
      updatedAt: input.connectedAt,
    })
    .onConflictDoUpdate({
      target: [providerConnections.organizationId, providerConnections.provider],
      set: {
        credentialCiphertext: input.credentialCiphertext,
        connectedAt: input.connectedAt,
        lastSyncAt: null,
        lastSyncStatus: 'NEVER',
        safeErrorCategory: null,
        revokedAt: null,
        createdByUserId: input.session.userId,
        updatedAt: input.connectedAt,
      },
    });
}

export async function listProviderConnections(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
  }>,
): Promise<readonly ProviderConnectionSummary[]> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'READ',
  });

  const rows = await input.db
    .select({
      organizationId: providerConnections.organizationId,
      provider: providerConnections.provider,
      connectedAt: providerConnections.connectedAt,
      lastSyncAt: providerConnections.lastSyncAt,
      lastSyncStatus: providerConnections.lastSyncStatus,
      safeErrorCategory: providerConnections.safeErrorCategory,
      revokedAt: providerConnections.revokedAt,
      updatedAt: providerConnections.updatedAt,
    })
    .from(providerConnections)
    .where(eq(providerConnections.organizationId, input.organizationId));

  return Object.freeze(
    rows.map((row) => {
      requireProvider(row.provider);
      return Object.freeze({
        organizationId: row.organizationId,
        provider: row.provider,
        connectedAt: row.connectedAt,
        lastSyncAt: row.lastSyncAt,
        lastSyncStatus: row.lastSyncStatus,
        safeErrorCategory: row.safeErrorCategory,
        revokedAt: row.revokedAt,
        updatedAt: row.updatedAt,
      });
    }),
  );
}

export async function getProviderCredentialCiphertext(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    provider: ProviderConnectionProvider;
  }>,
): Promise<string | null> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_CREDENTIAL_REFERENCE',
  });

  const row = (
    await input.db
      .select({
        credentialCiphertext: providerConnections.credentialCiphertext,
        revokedAt: providerConnections.revokedAt,
      })
      .from(providerConnections)
      .where(
        and(
          eq(providerConnections.organizationId, input.organizationId),
          eq(providerConnections.provider, input.provider),
        ),
      )
      .limit(1)
  ).at(0);

  if (row === undefined || row.revokedAt !== null) {
    return null;
  }
  return row.credentialCiphertext;
}

export async function revokeProviderConnection(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    provider: ProviderConnectionProvider;
    revokedAt: string;
  }>,
): Promise<void> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_CREDENTIAL_REFERENCE',
  });
  requireIso(input.revokedAt, 'PROVIDER_CONNECTION_REVOKED_AT_INVALID');

  await input.db
    .update(providerConnections)
    .set({
      credentialCiphertext: '',
      revokedAt: input.revokedAt,
      lastSyncStatus: 'REVOKED',
      safeErrorCategory: null,
      updatedAt: input.revokedAt,
    })
    .where(
      and(
        eq(providerConnections.organizationId, input.organizationId),
        eq(providerConnections.provider, input.provider),
      ),
    );
}
