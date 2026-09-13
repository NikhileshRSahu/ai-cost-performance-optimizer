'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import { importCustomerUsage } from '../../../../../src/workbench/import-service';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

export async function uploadUsageCsv(formData: FormData): Promise<never> {
  const organizationId = String(formData.get('organizationId') ?? '');
  const upload = formData.get('usageCsv');
  const isDemo = formData.get('isDemo') === 'true';

  if (organizationId.length === 0 || !(upload instanceof File)) {
    throw new Error('USAGE_CSV_REQUIRED');
  }

  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let importId: string;
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
  } finally {
    await database.close();
  }

  redirect(
    `/o/${organizationId}/import?importId=${encodeURIComponent(importId)}`,
  );
}
