'use server';

import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { recommendations } from '../../../../../../src/persistence/schema';
import { parseBenchmarkCsv } from '../../../../../../src/benchmarks/csv';
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

  const bytes = new Uint8Array(await upload.arrayBuffer());
  const cases = parseBenchmarkCsv(bytes);
  const configurations = [
    ...new Set(cases.map((record) => record.configurationId)),
  ];
  const evaluators = [
    ...new Set(cases.map((record) => record.evaluatorVersion)),
  ];
  const requestedCurrent = textEntry(formData, 'currentConfigurationId').trim();
  const requestedCandidate = textEntry(
    formData,
    'candidateConfigurationId',
  ).trim();
  const currentConfigurationId =
    requestedCurrent.length > 0
      ? requestedCurrent
      : (configurations.at(0) ?? '');
  const candidateConfigurationId =
    requestedCandidate.length > 0
      ? requestedCandidate
      : (configurations.find((value) => value !== currentConfigurationId) ??
        '');
  const evaluatorVersion =
    textEntry(formData, 'evaluatorVersion').trim() || (evaluators.at(0) ?? '');

  if (
    currentConfigurationId.length === 0 ||
    candidateConfigurationId.length === 0 ||
    currentConfigurationId === candidateConfigurationId ||
    evaluatorVersion.length === 0
  ) {
    redirect(
      `/o/${organizationId}/benchmark?workloadId=${encodeURIComponent(workloadId)}&error=${encodeURIComponent(
        'Evalomics could not infer the current and candidate configurations from this file. Open Advanced benchmark settings and identify them explicitly.',
      )}`,
    );
  }

  const database = createDatabase(databaseUrl);
  let recommendationId: string;
  try {
    const requestedSourceRecommendationId = textEntry(
      formData,
      'sourceRecommendationId',
    ).trim();
    let resolvedSourceRecommendationId =
      requestedSourceRecommendationId.length > 0
        ? requestedSourceRecommendationId
        : null;

    if (resolvedSourceRecommendationId === null) {
      const recentRecommendations = await database.db
        .select()
        .from(recommendations)
        .where(eq(recommendations.organizationId, organizationId))
        .orderBy(desc(recommendations.createdAt))
        .limit(50);

      const evidenceBacked = recentRecommendations.find((row) => {
        const sourceImportId = row.evidence.sourceImportId;
        const sourceProviderSnapshotId = row.evidence.sourceProviderSnapshotId;
        return (
          (typeof sourceImportId === 'string' && sourceImportId.length > 0) ||
          (typeof sourceProviderSnapshotId === 'string' &&
            sourceProviderSnapshotId.length > 0)
        );
      });
      resolvedSourceRecommendationId = evidenceBacked?.id ?? null;
    }

    const result = await evaluateAndPersistBenchmark({
      db: database.db,
      session,
      organizationId,
      workloadId,
      bytes,
      currentConfigurationId,
      candidateConfigurationId,
      evaluatorVersion,
      currency: textEntry(formData, 'currency', 'USD'),
      isDemo: formData.get('isDemo') === 'true',
      sourceRecommendationId: resolvedSourceRecommendationId,
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
