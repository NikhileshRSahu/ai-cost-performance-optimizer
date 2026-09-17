'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import type { ProviderConnectionProvider } from '../../../../../../src/persistence/repositories/provider-connections';
import { analyzeImportedUsage } from '../../../../../../src/workbench/analysis-service';
import { importCustomerUsage } from '../../../../../../src/workbench/import-service';
import {
  connectAndValidateProvider,
  disconnectProvider,
  providerConnectionSafeError,
} from '../../../../../../src/workbench/provider-connection-service';
import { assertUploadWithinLimit } from '../../../../../../src/workbench/upload-limits';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function providerEntry(formData: FormData): ProviderConnectionProvider {
  const value = textEntry(formData, 'provider');
  if (value !== 'OPENAI' && value !== 'ANTHROPIC') {
    throw new Error('PROVIDER_CONNECTION_PROVIDER_INVALID');
  }
  return value;
}

export async function connectProviderAccount(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const adminKey = textEntry(formData, 'adminKey');
  const provider = providerEntry(formData);
  if (organizationId.length === 0 || adminKey.trim().length === 0) {
    throw new Error('PROVIDER_CREDENTIAL_REQUIRED');
  }

  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    const result = await connectAndValidateProvider({
      db: database.db,
      session,
      organizationId,
      provider,
      adminKey,
      encryptionKeyEnv: process.env.PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
    });
    redirect(
      `/o/${organizationId}/import?providerConnected=${result.provider}&usageRows=${result.usageRows}&costRows=${result.costRows}`,
    );
  } catch (error) {
    const safeError = providerConnectionSafeError(error);
    redirect(
      `/o/${organizationId}/import?providerError=${encodeURIComponent(safeError)}`,
    );
  } finally {
    await database.close();
  }
}

export async function disconnectProviderAccount(
  formData: FormData,
): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const provider = providerEntry(formData);
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    await disconnectProvider({
      db: database.db,
      session,
      organizationId,
      provider,
    });
  } finally {
    await database.close();
  }

  redirect(`/o/${organizationId}/import?providerDisconnected=${provider}`);
}

export async function uploadUsageCsv(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const upload = formData.get('usageCsv');
  const isDemo = formData.get('isDemo') === 'true';

  if (organizationId.length === 0 || !(upload instanceof File)) {
    throw new Error('USAGE_CSV_REQUIRED');
  }
  assertUploadWithinLimit({ kind: 'USAGE_CSV', sizeBytes: upload.size });

  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let importId: string;
  let blocked = false;
  try {
    const result = await importCustomerUsage({
      db: database.db,
      session,
      organizationId,
      fileName: upload.name,
      bytes: new Uint8Array(await upload.arrayBuffer()),
      isDemo,
      receivedAt: new Date().toISOString(),
    });
    importId = result.importId;
    blocked = result.blocked;
    if (!result.blocked) {
      await analyzeImportedUsage({
        db: database.db,
        session,
        organizationId,
        importId,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'IMPORT_FAILED';
    const safeError = message.startsWith('UNSUPPORTED_COLUMN:')
      ? `Unsupported CSV column: ${message.slice('UNSUPPORTED_COLUMN:'.length)}. Use the Evalomics CSV template or synthetic demo format.`
      : 'The CSV could not be imported. Check the required columns and numeric formats, then try again.';
    redirect(
      `/o/${organizationId}/import?error=${encodeURIComponent(safeError)}`,
    );
  } finally {
    await database.close();
  }

  if (blocked) {
    redirect(
      `/o/${organizationId}/import?importId=${encodeURIComponent(importId)}`,
    );
  }

  redirect(
    `/o/${organizationId}?source=import&importId=${encodeURIComponent(importId)}`,
  );
}
