'use server';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import type { ProviderConnectionProvider } from '../../../../../../src/persistence/repositories/provider-connections';
import { organizations } from '../../../../../../src/persistence/schema';
import { analyzeImportedUsage } from '../../../../../../src/workbench/analysis-service';
import { importCustomerUsage } from '../../../../../../src/workbench/import-service';
import {
  connectAndValidateProvider,
  disconnectProvider,
  providerConnectionSafeError,
  syncConnectedProvider,
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

async function completeOnboarding(
  database: ReturnType<typeof createDatabase>,
  organizationId: string,
): Promise<void> {
  await database.db
    .update(organizations)
    .set({ onboardingCompletedAt: new Date().toISOString() })
    .where(eq(organizations.id, organizationId));
}

function importSafeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'IMPORT_FAILED';
  if (message.startsWith('UNSUPPORTED_COLUMN:')) {
    return `Unsupported CSV column: ${message.slice('UNSUPPORTED_COLUMN:'.length)}. Use the Evalomics CSV template.`;
  }
  if (message.startsWith('MISSING_COLUMN:')) {
    return `Missing required CSV column: ${message.slice('MISSING_COLUMN:'.length)}.`;
  }
  if (message === 'ALL_ROWS_REJECTED') {
    return 'No valid usage rows were accepted. Check the CSV and try again.';
  }
  if (message.startsWith('ALL_ROWS_REJECTED:')) {
    const code = message.slice('ALL_ROWS_REJECTED:'.length);
    return `No valid usage rows were accepted. Main row error: ${code}.`;
  }
  return 'The CSV could not be imported. Check the required columns and numeric formats, then try again.';
}

export async function connectProviderAccount(
  formData: FormData,
): Promise<never> {
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
  let safeError: string | null = null;
  try {
    await connectAndValidateProvider({
      db: database.db,
      session,
      organizationId,
      provider,
      adminKey,
      encryptionKeyEnv: process.env.PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
      encryptionFallbackSecret: process.env.BETTER_AUTH_SECRET,
    });
    await completeOnboarding(database, organizationId);
  } catch (error) {
    safeError = providerConnectionSafeError(error);
  } finally {
    await database.close();
  }

  if (safeError !== null) {
    redirect(
      `/o/${organizationId}/import?providerError=${encodeURIComponent(safeError)}`,
    );
  }
  redirect(`/o/${organizationId}?source=provider&provider=${provider}`);
}

export async function syncProviderAccount(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const provider = providerEntry(formData);
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let safeError: string | null = null;
  try {
    await syncConnectedProvider({
      db: database.db,
      session,
      organizationId,
      provider,
      encryptionKeyEnv: process.env.PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
      encryptionFallbackSecret: process.env.BETTER_AUTH_SECRET,
    });
    await completeOnboarding(database, organizationId);
  } catch (error) {
    safeError = providerConnectionSafeError(error);
  } finally {
    await database.close();
  }

  if (safeError !== null) {
    redirect(
      `/o/${organizationId}/import?providerError=${encodeURIComponent(safeError)}`,
    );
  }
  redirect(`/o/${organizationId}?source=provider&provider=${provider}`);
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

async function analyzeBytes(
  organizationId: string,
  fileName: string,
  bytes: Uint8Array,
  isDemo: boolean,
): Promise<Readonly<{
  importId: string;
  accepted: number;
  rejected: number;
  warnings: number;
}>> {
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    const result = await importCustomerUsage({
      db: database.db,
      session,
      organizationId,
      fileName,
      bytes,
      isDemo,
      receivedAt: new Date().toISOString(),
    });

    if (result.blocked) {
      const primaryIssue = result.issues.at(0)?.code ?? 'UNKNOWN_ROW_ERROR';
      throw new Error(`ALL_ROWS_REJECTED:${primaryIssue}`);
    }

    await analyzeImportedUsage({
      db: database.db,
      session,
      organizationId,
      importId: result.importId,
    });
    await completeOnboarding(database, organizationId);
    return Object.freeze({
      importId: result.importId,
      accepted: result.accepted,
      rejected: result.rejected,
      warnings: result.warnings,
    });
  } finally {
    await database.close();
  }
}

export async function uploadUsageCsv(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const upload = formData.get('usageCsv');
  if (organizationId.length === 0 || !(upload instanceof File)) {
    throw new Error('USAGE_CSV_REQUIRED');
  }
  assertUploadWithinLimit({ kind: 'USAGE_CSV', sizeBytes: upload.size });

  let analysis: Readonly<{
    importId: string;
    accepted: number;
    rejected: number;
    warnings: number;
  }>;
  try {
    analysis = await analyzeBytes(
      organizationId,
      upload.name,
      new Uint8Array(await upload.arrayBuffer()),
      false,
    );
  } catch (error) {
    redirect(
      `/o/${organizationId}/import?error=${encodeURIComponent(importSafeError(error))}`,
    );
  }

  redirect(
    `/o/${organizationId}?source=import&importId=${encodeURIComponent(analysis.importId)}&analysis=complete&accepted=${String(analysis.accepted)}&rejected=${String(analysis.rejected)}&warnings=${String(analysis.warnings)}`,
  );
}

export async function analyzeDemoUsage(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  if (organizationId.length === 0) throw new Error('ORGANIZATION_ID_REQUIRED');

  let analysis: Readonly<{
    importId: string;
    accepted: number;
    rejected: number;
    warnings: number;
  }>;
  try {
    const bytes = await readFile(
      join(process.cwd(), 'public', 'demo-usage.csv'),
    );
    analysis = await analyzeBytes(
      organizationId,
      'demo-usage.csv',
      new Uint8Array(bytes),
      true,
    );
  } catch (error) {
    redirect(
      `/o/${organizationId}/import?error=${encodeURIComponent(importSafeError(error))}`,
    );
  }

  redirect(
    `/o/${organizationId}?source=demo&importId=${encodeURIComponent(analysis.importId)}&analysis=complete&accepted=${String(analysis.accepted)}&rejected=${String(analysis.rejected)}&warnings=${String(analysis.warnings)}`,
  );
}
