import {
  fetchAnthropicAdminSnapshot,
  type AnthropicAdminFetch,
} from '../ingestion/connectors/anthropic-admin.js';
import {
  fetchOpenAIAdminSnapshot,
  type OpenAIAdminFetch,
} from '../ingestion/connectors/openai-admin.js';
import {
  normalizeAnthropicAdminSnapshot,
  normalizeOpenAIAdminSnapshot,
} from '../ingestion/provider-normalization.js';
import type { PersistenceDatabase } from '../persistence/database.js';
import {
  markProviderConnectionSync,
  revokeProviderConnection,
  saveProviderConnection,
  type ProviderConnectionProvider,
} from '../persistence/repositories/provider-connections.js';
import {
  encryptProviderCredential,
  providerCredentialKeyFromEnv,
} from '../security/provider-credentials.js';
import type { AuthenticatedSession } from './authz.js';
import { persistProviderEvidenceSnapshot } from './provider-evidence-service.js';

const VALIDATION_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ProviderConnectionResult = Readonly<{
  provider: ProviderConnectionProvider;
  syncedAt: string;
  usageRows: number;
  costRows: number;
  snapshotId: string;
}>;

export function providerConnectionSafeError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.endsWith('_401') || message.endsWith('_403')) {
    return 'PROVIDER_CREDENTIAL_REJECTED';
  }
  if (message.endsWith('_429')) {
    return 'PROVIDER_RATE_LIMITED';
  }
  if (message.includes('KEY_REQUIRED') || message.includes('KEY_INVALID')) {
    return 'PROVIDER_CONNECTION_NOT_CONFIGURED';
  }
  return 'PROVIDER_SYNC_FAILED';
}

export async function connectAndValidateProvider(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    provider: ProviderConnectionProvider;
    adminKey: string;
    encryptionKeyEnv: string | undefined;
    now?: Date;
    openAIFetcher?: OpenAIAdminFetch;
    anthropicFetcher?: AnthropicAdminFetch;
  }>,
): Promise<ProviderConnectionResult> {
  if (input.adminKey.trim().length === 0) {
    throw new Error('PROVIDER_CREDENTIAL_REQUIRED');
  }

  const now = input.now ?? new Date();
  const endMs = now.getTime();
  if (!Number.isFinite(endMs)) {
    throw new Error('PROVIDER_SYNC_TIME_INVALID');
  }
  const startMs = endMs - VALIDATION_WINDOW_DAYS * DAY_MS;
  const intervalStart = new Date(startMs).toISOString();
  const syncedAt = now.toISOString();

  let usageRows = 0;
  let costRows = 0;
  let snapshotId: string;
  if (input.provider === 'OPENAI') {
    const snapshot = await fetchOpenAIAdminSnapshot({
      adminKey: input.adminKey,
      startTime: Math.floor(startMs / 1000),
      endTime: Math.floor(endMs / 1000),
      fetcher: input.openAIFetcher,
    });
    const evidence = normalizeOpenAIAdminSnapshot({
      organizationId: input.organizationId,
      snapshot,
    });
    usageRows = evidence.usage.length;
    costRows = evidence.costs.length;
    snapshotId = (
      await persistProviderEvidenceSnapshot({
        db: input.db,
        session: input.session,
        organizationId: input.organizationId,
        source: 'OPENAI_ADMIN_API',
        intervalStart,
        intervalEnd: syncedAt,
        receivedAt: syncedAt,
        evidence,
      })
    ).snapshotId;
  } else {
    const snapshot = await fetchAnthropicAdminSnapshot({
      adminKey: input.adminKey,
      startingAt: intervalStart,
      endingAt: syncedAt,
      fetcher: input.anthropicFetcher,
    });
    const evidence = normalizeAnthropicAdminSnapshot({
      organizationId: input.organizationId,
      snapshot,
    });
    usageRows = evidence.usage.length;
    costRows = evidence.costs.length;
    snapshotId = (
      await persistProviderEvidenceSnapshot({
        db: input.db,
        session: input.session,
        organizationId: input.organizationId,
        source: 'ANTHROPIC_ADMIN_API',
        intervalStart,
        intervalEnd: syncedAt,
        receivedAt: syncedAt,
        evidence,
      })
    ).snapshotId;
  }

  const encryptionKey = providerCredentialKeyFromEnv(input.encryptionKeyEnv);
  const credentialCiphertext = encryptProviderCredential(
    input.adminKey,
    encryptionKey,
  );
  await saveProviderConnection({
    db: input.db,
    session: input.session,
    organizationId: input.organizationId,
    provider: input.provider,
    credentialCiphertext,
    connectedAt: syncedAt,
  });
  await markProviderConnectionSync({
    db: input.db,
    session: input.session,
    organizationId: input.organizationId,
    provider: input.provider,
    syncedAt,
    status: 'READY',
  });

  return Object.freeze({
    provider: input.provider,
    syncedAt,
    usageRows,
    costRows,
    snapshotId,
  });
}

export async function disconnectProvider(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    provider: ProviderConnectionProvider;
    now?: Date;
  }>,
): Promise<void> {
  const now = input.now ?? new Date();
  await revokeProviderConnection({
    db: input.db,
    session: input.session,
    organizationId: input.organizationId,
    provider: input.provider,
    revokedAt: now.toISOString(),
  });
}
