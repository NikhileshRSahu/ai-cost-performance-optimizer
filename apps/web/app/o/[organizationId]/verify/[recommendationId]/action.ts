'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { verifyCustomerChange } from '../../../../../../../src/workbench/verification-service';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string, fallback = ''): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : fallback;
}

function optional(formData: FormData, key: string): string | null {
  const value = textEntry(formData, key).trim();
  return value.length === 0 ? null : value;
}

export async function submitVerification(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const recommendationId = textEntry(formData, 'recommendationId');
  const upload = formData.get('postCsv');
  if (!(upload instanceof File)) throw new Error('POST_CHANGE_CSV_REQUIRED');

  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let verificationId: string;
  try {
    const outcome = await verifyCustomerChange({
      db: database.db,
      session,
      organizationId,
      recommendationId,
      postFileName: upload.name,
      postBytes: new Uint8Array(await upload.arrayBuffer()),
      receivedAt: new Date().toISOString(),
      measuredQuality: textEntry(formData, 'measuredQuality'),
      postP95LatencyMs: optional(formData, 'postP95LatencyMs'),
      postFailureRate: optional(formData, 'postFailureRate'),
      qualitySourceRef: textEntry(formData, 'qualitySourceRef'),
      implementationCost: textEntry(formData, 'implementationCost', '0'),
      incrementalOperatingCost: textEntry(
        formData,
        'incrementalOperatingCost',
        '0',
      ),
      attestations: {
        unitDefinitionUnchanged:
          formData.get('unitDefinitionUnchanged') === 'true',
        workloadMixComparable: formData.get('workloadMixComparable') === 'true',
        concurrentDeploymentsResolved:
          formData.get('concurrentDeploymentsResolved') === 'true',
      },
    });
    verificationId = outcome.verificationId;
  } finally {
    await database.close();
  }

  redirect(
    `/o/${organizationId}/verify/${recommendationId}?verificationId=${encodeURIComponent(verificationId)}`,
  );
}
