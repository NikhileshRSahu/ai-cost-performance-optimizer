import { NextResponse } from 'next/server';
import { diagnoseSanitizedHistory } from '../../../../../../../src/efficiency/history-diagnosis';
import { sanitizedAiExportSchema } from '../../../../../../../src/efficiency/history-contracts';
import { requireOrganizationAccess } from '../../../../../../../src/persistence/tenant';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

const MAX_HISTORY_BYTES = 5 * 1024 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  const session = await resolveRuntimeSession();
  if (session === null) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    requireOrganizationAccess({
      session,
      organizationId,
      action: 'IMPORT',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'ACTION_NOT_ALLOWED';
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const formData = await request.formData();
  const upload = formData.get('historyJson');
  if (!(upload instanceof File)) {
    return NextResponse.json(
      { error: 'HISTORY_JSON_REQUIRED' },
      { status: 400 },
    );
  }
  if (upload.size > MAX_HISTORY_BYTES) {
    return NextResponse.json(
      { error: 'HISTORY_JSON_TOO_LARGE' },
      { status: 413 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(await upload.text());
  } catch {
    return NextResponse.json(
      { error: 'INVALID_HISTORY_JSON' },
      { status: 400 },
    );
  }

  const parsed = sanitizedAiExportSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'INVALID_HISTORY_SCHEMA',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
        })),
      },
      { status: 400 },
    );
  }

  const diagnosis = diagnoseSanitizedHistory({ export: parsed.data });
  return NextResponse.json(
    {
      diagnosis,
      rawContentPersisted: false,
    },
    {
      status: 200,
      headers: { 'cache-control': 'no-store' },
    },
  );
}
