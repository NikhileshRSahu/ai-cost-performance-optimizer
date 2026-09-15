import { NextResponse } from 'next/server';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { exportOrganizationEvidence } from '../../../../../../../src/workbench/data-export';
import { safeErrorFromUnknown } from '../../../../../../../src/workbench/safe-errors';
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
    const payload = await exportOrganizationEvidence({
      db: database.db,
      session,
      organizationId,
      exportedAt: new Date().toISOString(),
    });
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition':
          'attachment; filename="' + organizationId + '-evidence-export.json"',
        'cache-control': 'no-store',
      },
    });
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
