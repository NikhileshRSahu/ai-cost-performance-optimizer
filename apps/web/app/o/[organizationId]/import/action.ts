'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { analyzeImportedUsage } from '../../../../../../src/workbench/analysis-service';
import { importCustomerUsage } from '../../../../../../src/workbench/import-service';
import { assertUploadWithinLimit } from '../../../../../../src/workbench/upload-limits';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
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
