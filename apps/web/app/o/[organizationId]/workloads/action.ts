'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { saveWorkloadConstraints } from '../../../../../../src/workbench/workload-service';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string, fallback = ''): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : fallback;
}

function optional(formData: FormData, key: string): string | null {
  const value = textEntry(formData, key).trim();
  return value.length === 0 ? null : value;
}

function optionalNumber(
  formData: FormData,
  key: string,
  unitSuffix?: string,
): string | null {
  const raw = optional(formData, key);
  if (raw === null) return null;

  let normalized = raw.replaceAll(',', '').trim();
  if (unitSuffix !== undefined) {
    normalized = normalized.replace(
      new RegExp(`\\s*${unitSuffix}\\s*$`, 'i'),
      '',
    );
  }

  return normalized;
}

export async function saveWorkload(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
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
        name: textEntry(formData, 'name'),
        environment: textEntry(formData, 'environment'),
        requiredQuality: textEntry(formData, 'requiredQuality'),
        maxP95LatencyMs: optionalNumber(
          formData,
          'maxP95LatencyMs',
          'ms',
        ),
        maxFailureRate: optionalNumber(formData, 'maxFailureRate'),
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
