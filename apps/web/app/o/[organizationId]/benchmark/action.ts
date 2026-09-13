'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { evaluateAndPersistBenchmark } from '../../../../../../src/workbench/benchmark-service';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string, fallback = ''): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : fallback;
}

export async function submitBenchmark(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const workloadId = textEntry(formData, 'workloadId');
  const upload = formData.get('benchmarkCsv');
  if (
    organizationId.length === 0 ||
    workloadId.length === 0 ||
    !(upload instanceof File)
  ) {
    throw new Error('BENCHMARK_INPUT_REQUIRED');
  }

  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let recommendationId: string;
  try {
    const result = await evaluateAndPersistBenchmark({
      db: database.db,
      session,
      organizationId,
      workloadId,
      bytes: new Uint8Array(await upload.arrayBuffer()),
      currentConfigurationId: textEntry(formData, 'currentConfigurationId'),
      candidateConfigurationId: textEntry(formData, 'candidateConfigurationId'),
      evaluatorVersion: textEntry(formData, 'evaluatorVersion'),
      currency: textEntry(formData, 'currency', 'USD'),
      isDemo: formData.get('isDemo') === 'true',
    });
    recommendationId = result.recommendationId;
  } finally {
    await database.close();
  }

  redirect(`/o/${organizationId}/lab/${encodeURIComponent(recommendationId)}`);
}
