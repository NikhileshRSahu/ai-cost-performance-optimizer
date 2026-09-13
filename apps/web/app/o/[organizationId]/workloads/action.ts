'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { saveWorkloadConstraints } from '../../../../../../src/workbench/workload-service';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function optional(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value.length === 0 ? null : value;
}

export async function saveWorkload(formData: FormData): Promise<never> {
  const organizationId = String(formData.get('organizationId') ?? '');
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let workloadId: string;
  try {
    const saved = await saveWorkloadConstraints({
      db: database.db,
      session,
      organizationId,
      values: {
        name: String(formData.get('name') ?? ''),
        environment: String(formData.get('environment') ?? ''),
        requiredQuality: String(formData.get('requiredQuality') ?? ''),
        maxP95LatencyMs: optional(formData, 'maxP95LatencyMs'),
        maxFailureRate: optional(formData, 'maxFailureRate'),
      },
    });
    workloadId = saved.id;
  } finally {
    await database.close();
  }

  redirect(
    `/o/${organizationId}/benchmark?workloadId=${encodeURIComponent(workloadId)}`,
  );
}
