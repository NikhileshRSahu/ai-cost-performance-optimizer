import { NextResponse } from 'next/server';
import {
  buildOperationalEvent,
  elapsedMs,
  publishOperationalEvent,
  resolveRequestId,
} from '../../../../../src/operations/observability';
import { createDatabase } from '../../../../../src/persistence/database';

export const dynamic = 'force-dynamic';

async function publishHealthEvent(
  event: Parameters<typeof publishOperationalEvent>[0],
): Promise<void> {
  await publishOperationalEvent(event, {
    webhookUrl: process.env.OPS_ALERT_WEBHOOK_URL,
    signingSecret: process.env.OPS_ALERT_WEBHOOK_SECRET,
  });
}

async function checkAuthProvider(): Promise<
  'ok' | 'not_configured' | 'unavailable'
> {
  const base = process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, '');
  if (base === undefined || base.length === 0) return 'not_configured';

  try {
    const response = await fetch(`${base}/.well-known/jwks.json`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    return response.ok ? 'ok' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request.headers.get('x-request-id'));
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    await publishHealthEvent(
      buildOperationalEvent({
        eventName: 'health_check',
        requestId,
        route: '/api/health',
        status: 'ERROR',
        statusCode: 503,
        durationMs: elapsedMs(startedAt),
        actorKind: 'SYSTEM',
        safeErrorCategory: 'DATABASE_NOT_CONFIGURED',
      }),
    );
    return NextResponse.json(
      {
        status: 'not_ready',
        checks: {
          database: 'not_configured',
          auth: await checkAuthProvider(),
        },
      },
      { status: 503, headers: { 'x-request-id': requestId } },
    );
  }

  const database = createDatabase(databaseUrl);
  let databaseStatus: 'ok' | 'unavailable' = 'ok';

  try {
    await database.pool.query('select 1');
  } catch {
    databaseStatus = 'unavailable';
  } finally {
    await database.close();
  }

  const authStatus = await checkAuthProvider();
  const ready = databaseStatus === 'ok' && authStatus === 'ok';

  await publishHealthEvent(
    buildOperationalEvent({
      eventName: 'health_check',
      requestId,
      route: '/api/health',
      status: ready ? 'OK' : 'ERROR',
      statusCode: ready ? 200 : 503,
      durationMs: elapsedMs(startedAt),
      actorKind: 'SYSTEM',
      safeErrorCategory:
        databaseStatus !== 'ok'
          ? 'DATABASE_UNAVAILABLE'
          : authStatus !== 'ok'
            ? 'AUTH_UNAVAILABLE'
            : undefined,
    }),
  );

  return NextResponse.json(
    {
      status: ready ? 'ok' : 'not_ready',
      checks: {
        database: databaseStatus,
        auth: authStatus,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: { 'x-request-id': requestId },
    },
  );
}
