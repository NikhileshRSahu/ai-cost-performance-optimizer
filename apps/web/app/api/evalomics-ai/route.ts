import { NextResponse } from 'next/server';
import { buildFounderDashboardView } from '../../../../../src/workbench/dashboard-view';
import { answerEvalomicsQuestion } from '../../../../../src/workbench/evalomics-ai';
import { createDatabase } from '../../../../../src/persistence/database';
import { loadFounderDashboardEvidence } from '../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

type RequestBody = Readonly<{
  organizationId?: unknown;
  question?: unknown;
}>;

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const organizationId =
    typeof body.organizationId === 'string' ? body.organizationId.trim() : '';
  const question =
    typeof body.question === 'string' ? body.question.trim() : '';

  if (organizationId.length === 0 || question.length === 0) {
    return NextResponse.json(
      { error: 'ORGANIZATION_AND_QUESTION_REQUIRED' },
      { status: 400 },
    );
  }

  if (question.length > 1000) {
    return NextResponse.json({ error: 'QUESTION_TOO_LONG' }, { status: 400 });
  }

  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const database = createDatabase(databaseUrl);
  try {
    const evidence = await loadFounderDashboardEvidence(
      database.db,
      session,
      organizationId,
      Object.freeze({ source: 'AUTO' }),
    );
    const view = buildFounderDashboardView(evidence);
    return NextResponse.json(
      answerEvalomicsQuestion(view, organizationId, question),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const status =
      message === 'ACTION_NOT_ALLOWED' || message === 'ORGANIZATION_NOT_FOUND'
        ? 403
        : 500;
    return NextResponse.json(
      {
        error:
          status === 403
            ? 'WORKSPACE_ACCESS_DENIED'
            : 'EVALOMICS_AI_UNAVAILABLE',
      },
      { status },
    );
  } finally {
    await database.close();
  }
}
