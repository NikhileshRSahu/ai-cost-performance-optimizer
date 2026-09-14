import { NextResponse } from 'next/server';
import { z } from 'zod';
import { formatDecimal, rational } from '../../../../../../../../../src/economics/exact';
import { replayFromOptimizationLab } from '../../../../../../../../../src/efficiency/lab-replay';
import { createDatabase } from '../../../../../../../../../src/persistence/database';
import { safeErrorFromUnknown } from '../../../../../../../../../src/workbench/safe-errors';
import { loadOptimizationLabEvidence } from '../../../../../../../lib/lab-data';
import { resolveRuntimeSession } from '../../../../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

const requestSchema = z
  .object({
    historicalBaselineCost: z
      .string()
      .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/),
    historicalWindowComparable: z.boolean(),
  })
  .strict();

function display(
  value: Readonly<{ numerator: string; denominator: string }> | null,
): string | null {
  if (value === null) return null;
  return formatDecimal(
    rational(BigInt(value.numerator), BigInt(value.denominator)),
    2,
  );
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ organizationId: string; recommendationId: string }>;
  },
) {
  const { organizationId, recommendationId } = await context.params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_REPLAY_INPUT' },
      { status: 400 },
    );
  }

  const database = createDatabase(databaseUrl);
  try {
    const lab = await loadOptimizationLabEvidence(
      database.db,
      session,
      organizationId,
      recommendationId,
    );
    const replay = replayFromOptimizationLab({
      lab,
      historicalBaselineCost: parsed.data.historicalBaselineCost,
      historicalWindowComparable: parsed.data.historicalWindowComparable,
    });

    return NextResponse.json(
      {
        status: replay.status,
        reasons: replay.reasons,
        currency: lab.economics.currency,
        historicalBaselineCost: display(replay.historicalBaselineCost),
        projectedCandidateCost: display(replay.projectedCandidateCost),
        projectedGrossSaving: display(replay.projectedGrossSaving),
        benchmarkConfidenceBand: replay.benchmarkConfidenceBand,
        claimBoundary: replay.claimBoundary,
        persistedAsVerifiedSavings: false,
      },
      {
        status: 200,
        headers: { 'cache-control': 'no-store' },
      },
    );
  } catch (error) {
    const safe = safeErrorFromUnknown(error);
    return NextResponse.json(
      { error: safe.category, message: safe.message },
      { status: safe.status },
    );
  } finally {
    await database.close();
  }
}
