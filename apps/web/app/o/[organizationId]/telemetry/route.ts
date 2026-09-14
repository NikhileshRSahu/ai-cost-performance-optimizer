import { NextResponse } from 'next/server';
import { productionTelemetryBatchSchema } from '../../../../../../src/efficiency/telemetry-contracts';
import { createDatabase } from '../../../../../../src/persistence/database';
import { safeErrorFromUnknown } from '../../../../../../src/workbench/safe-errors';
import { ingestProductionTelemetry } from '../../../../../../src/workbench/telemetry-service';
import {
  assertUploadWithinLimit,
  UPLOAD_LIMITS,
} from '../../../../../../src/workbench/upload-limits';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;

  if (session === null || databaseUrl === undefined) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
      { status: 401 },
    );
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > UPLOAD_LIMITS.productionTelemetryJsonBytes
  ) {
    return NextResponse.json(
      {
        error: 'UPLOAD_TOO_LARGE',
        message: 'The uploaded file exceeds the supported size limit.',
      },
      { status: 413 },
    );
  }

  let raw: string;
  try {
    raw = await request.text();
    assertUploadWithinLimit({
      kind: 'PRODUCTION_TELEMETRY_JSON',
      sizeBytes: new TextEncoder().encode(raw).byteLength,
    });
  } catch (error) {
    const safe = safeErrorFromUnknown(error);
    return NextResponse.json(
      { error: safe.category, message: safe.message },
      { status: safe.status },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    const safe = safeErrorFromUnknown(new Error('INVALID_TELEMETRY_JSON'));
    return NextResponse.json(
      { error: safe.category, message: safe.message },
      { status: safe.status },
    );
  }

  const parsed = productionTelemetryBatchSchema.safeParse(json);
  if (!parsed.success) {
    const safe = safeErrorFromUnknown(new Error('INVALID_TELEMETRY_SCHEMA'));
    return NextResponse.json(
      { error: safe.category, message: safe.message },
      { status: safe.status },
    );
  }

  const database = createDatabase(databaseUrl);
  try {
    const result = await ingestProductionTelemetry({
      db: database.db,
      session,
      organizationId,
      batch: parsed.data,
      receivedAt: new Date().toISOString(),
      isDemo: false,
    });

    return NextResponse.json(
      {
        ...result,
        source: 'PRODUCTION_TELEMETRY',
      },
      {
        status: 202,
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
