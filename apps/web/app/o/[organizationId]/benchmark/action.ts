'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { evaluateAndPersistBenchmark } from '../../../../../../src/workbench/benchmark-service';
import { assertUploadWithinLimit } from '../../../../../../src/workbench/upload-limits';
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
  assertUploadWithinLimit({ kind: 'BENCHMARK_CSV', sizeBytes: upload.size });

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'BENCHMARK_FAILED';
    const safeError =
      message === 'BENCHMARK_HEADER_MISMATCH'
        ? 'Benchmark CSV columns do not match the required format. Download the benchmark template and keep its header unchanged.'
        : 'The benchmark could not be evaluated. Check the paired-case CSV, configuration IDs, evaluator version, and constraints.';
    redirect(
      `/o/${organizationId}/benchmark?workloadId=${encodeURIComponent(workloadId)}&error=${encodeURIComponent(safeError)}`,
    );
  } finally {
    await database.close();
  }

  redirect(`/o/${organizationId}/lab/${encodeURIComponent(recommendationId)}`);
}
