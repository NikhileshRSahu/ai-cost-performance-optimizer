import { NextResponse } from 'next/server';
import { productionTelemetryBatchSchema } from '../../../../../../src/efficiency/telemetry-contracts';
import { createDatabase } from '../../../../../../src/persistence/database';
import type { AuthenticatedSession } from '../../../../../../src/workbench/authz';
import { safeErrorFromUnknown } from '../../../../../../src/workbench/safe-errors';
import {
  authenticateTelemetryCredential,
  consumeDistributedRateLimit,
} from '../../../../../../src/workbench/telemetry-auth';
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
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'The request could not be completed safely.',
      },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const database = createDatabase(databaseUrl);
  let session = await resolveRuntimeSession();
  let rateScope: string;

  try {
    if (session !== null) {
      rateScope = 'session:' + session.userId;
    } else {
      const pepper = process.env.TELEMETRY_CREDENTIAL_PEPPER;
      if (pepper === undefined) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
          { status: 401 },
        );
      }

      const machine = await authenticateTelemetryCredential({
        db: database.db,
        organizationId,
        authorizationHeader: request.headers.get('authorization'),
        pepper,
        now,
      });
      if (machine === null) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
          { status: 401 },
        );
      }

      session = {
        userId: 'machine:' + machine.credentialId,
        memberships: [{ organizationId, role: 'OPERATOR' }],
      } satisfies AuthenticatedSession;
      rateScope = 'credential:' + machine.credentialId;
    }

    const rate = await consumeDistributedRateLimit({
      db: database.db,
      organizationId,
      scopeKey: rateScope,
      now,
      limit: 120,
      windowSeconds: 60,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Too many telemetry requests. Retry after the current window.',
        },
        {
          status: 429,
          headers: {
            'cache-control': 'no-store',
            'retry-after': String(rate.retryAfterSeconds),
          },
        },
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

    const result = await ingestProductionTelemetry({
      db: database.db,
      session,
      organizationId,
      batch: parsed.data,
      receivedAt: now,
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
