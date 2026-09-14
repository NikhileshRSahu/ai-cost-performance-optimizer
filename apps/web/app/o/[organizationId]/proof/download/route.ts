import { NextResponse } from 'next/server';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../../../src/workbench/dashboard-view';
import { buildProspectProofPack } from '../../../../../../../src/workbench/prospect-proof';
import { safeErrorFromUnknown } from '../../../../../../../src/workbench/safe-errors';
import { loadFounderDashboardEvidence } from '../../../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const database = createDatabase(databaseUrl);
  try {
    const evidence = await loadFounderDashboardEvidence(
      database.db,
      session,
      organizationId,
    );
    const pack = buildProspectProofPack(buildFounderDashboardView(evidence));

    return new NextResponse(
      JSON.stringify(
        {
          schemaVersion: 'prospect-proof-pack-v1',
          generatedAt: new Date().toISOString(),
          ...pack,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'content-disposition':
            'attachment; filename="' + organizationId + '-prospect-proof.json"',
          'cache-control': 'no-store',
        },
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
