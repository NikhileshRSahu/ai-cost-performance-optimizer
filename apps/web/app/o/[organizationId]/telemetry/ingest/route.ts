import { NextResponse } from 'next/server';
import { productionTelemetryBatchSchema } from '../../../../../../../src/efficiency/telemetry-contracts';
import {
  buildOperationalEvent,
  elapsedMs,
  publishOperationalEvent,
  resolveRequestId,
  type OperationalEvent,
  type OperationalStatus,
} from '../../../../../../../src/operations/observability';
import { createDatabase } from '../../../../../../../src/persistence/database';
import type { AuthenticatedSession } from '../../../../../../../src/workbench/authz';
import { safeErrorFromUnknown } from '../../../../../../../src/workbench/safe-errors';
import {
  authenticateTelemetryCredential,
  consumeDistributedRateLimit,
} from '../../../../../../../src/workbench/telemetry-auth';
import { ingestProductionTelemetry } from '../../../../../../../src/workbench/telemetry-service';
import {
  assertUploadWithinLimit,
  UPLOAD_LIMITS,
} from '../../../../../../../src/workbench/upload-limits';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request.headers.get('x-request-id'));
  const { organizationId } = await context.params;
  const route = '/o/:organizationId/telemetry/ingest';
  let actorKind: OperationalEvent['actorKind'] = 'ANONYMOUS';

  async function respond(
    body: unknown,
    statusCode: number,
    options: Readonly<{
      eventName?: OperationalEvent['eventName'];
      status?: OperationalStatus;
      safeErrorCategory?: string | null;
      acceptedCount?: number | null;
      skippedCount?: number | null;
      headers?: Readonly<Record<string, string>>;
    }> = {},
  ) {
    const event = buildOperationalEvent({
      eventName: options.eventName ?? 'telemetry_ingest',
      requestId,
      route,
      status:
        options.status ??
        (statusCode >= 200 && statusCode < 300 ? 'OK' : 'ERROR'),
      statusCode,
      durationMs: elapsedMs(startedAt),
      organizationId,
      actorKind,
      safeErrorCategory: options.safeErrorCategory,
      acceptedCount: options.acceptedCount,
      skippedCount: options.skippedCount,
    });

    await publishOperationalEvent(event, {
      webhookUrl: process.env.OPS_ALERT_WEBHOOK_URL,
      signingSecret: process.env.OPS_ALERT_WEBHOOK_SECRET,
    });

    return NextResponse.json(body, {
      status: statusCode,
      headers: {
        'cache-control': 'no-store',
        'x-request-id': requestId,
        ...options.headers,
      },
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) {
    return await respond(
      {
        error: 'INTERNAL_ERROR',
        message: 'The request could not be completed safely.',
      },
      500,
      { safeErrorCategory: 'DATABASE_NOT_CONFIGURED' },
    );
  }

  const now = new Date().toISOString();
  const database = createDatabase(databaseUrl);
  let session = await resolveRuntimeSession();
  let rateScope: string;

  try {
    if (session !== null) {
      actorKind = 'SESSION';
      rateScope = 'session:' + session.userId;
    } else {
      const pepper = process.env.TELEMETRY_CREDENTIAL_PEPPER;
      if (pepper === undefined) {
        return await respond(
          { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
          401,
          {
            eventName: 'telemetry_auth',
            safeErrorCategory: 'TELEMETRY_CREDENTIALS_NOT_CONFIGURED',
          },
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
        return await respond(
          { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
          401,
          {
            eventName: 'telemetry_auth',
            safeErrorCategory: 'TELEMETRY_CREDENTIAL_REJECTED',
          },
        );
      }

      actorKind = 'MACHINE';
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
      return await respond(
        {
          error: 'RATE_LIMITED',
          message:
            'Too many telemetry requests. Retry after the current window.',
        },
        429,
        {
          eventName: 'telemetry_rate_limit',
          status: 'RATE_LIMITED',
          safeErrorCategory: 'RATE_LIMITED',
          headers: { 'retry-after': String(rate.retryAfterSeconds) },
        },
      );
    }

    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > UPLOAD_LIMITS.productionTelemetryJsonBytes
    ) {
      return await respond(
        {
          error: 'UPLOAD_TOO_LARGE',
          message: 'The uploaded file exceeds the supported size limit.',
        },
        413,
        { safeErrorCategory: 'UPLOAD_TOO_LARGE' },
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
      return await respond(
        { error: safe.category, message: safe.message },
        safe.status,
        { safeErrorCategory: safe.category },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      const safe = safeErrorFromUnknown(new Error('INVALID_TELEMETRY_JSON'));
      return await respond(
        { error: safe.category, message: safe.message },
        safe.status,
        { safeErrorCategory: safe.category },
      );
    }

    const parsed = productionTelemetryBatchSchema.safeParse(json);
    if (!parsed.success) {
      const safe = safeErrorFromUnknown(new Error('INVALID_TELEMETRY_SCHEMA'));
      return await respond(
        { error: safe.category, message: safe.message },
        safe.status,
        { safeErrorCategory: safe.category },
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

    return await respond(
      {
        ...result,
        source: 'PRODUCTION_TELEMETRY',
      },
      202,
      {
        acceptedCount: result.accepted,
        skippedCount: result.skippedDuplicates,
      },
    );
  } catch (error) {
    const safe = safeErrorFromUnknown(error);
    return await respond(
      { error: safe.category, message: safe.message },
      safe.status,
      { safeErrorCategory: safe.category },
    );
  } finally {
    await database.close();
  }
}
