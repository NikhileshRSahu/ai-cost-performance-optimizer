import { NextResponse } from 'next/server';
import {
  buildOperationalEvent,
  elapsedMs,
  publishOperationalEvent,
  resolveRequestId,
} from '../../../../../src/operations/observability';
import {
  createDatabase,
  type DatabaseHandle,
} from '../../../../../src/persistence/database';
import { hasSelfHostedAuthConfiguration } from '../../../lib/auth-config';

export const dynamic = 'force-dynamic';

async function publishHealthEvent(
  event: Parameters<typeof publishOperationalEvent>[0],
): Promise<void> {
  await publishOperationalEvent(event, {
    webhookUrl: process.env.OPS_ALERT_WEBHOOK_URL,
    signingSecret: process.env.OPS_ALERT_WEBHOOK_SECRET,
  });
}

async function checkAuthProvider(
  database: DatabaseHandle,
): Promise<'ok' | 'not_configured' | 'unavailable'> {
  if (!hasSelfHostedAuthConfiguration()) return 'not_configured';

  try {
    const result = await database.pool.query<{ ready: boolean }>(`
      select (
        to_regclass('auth.user') is not null
        and to_regclass('auth.session') is not null
        and to_regclass('auth.account') is not null
        and to_regclass('auth.verification') is not null
      ) as ready
    `);
    return result.rows[0]?.ready === true ? 'ok' : 'unavailable';
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
          auth: 'not_configured',
        },
      },
      { status: 503, headers: { 'x-request-id': requestId } },
    );
  }

  const database = createDatabase(databaseUrl);
  let databaseStatus: 'ok' | 'unavailable' = 'ok';
  let authStatus: 'ok' | 'not_configured' | 'unavailable' = 'unavailable';

  try {
    await database.pool.query('select 1');
    authStatus = await checkAuthProvider(database);
  } catch {
    databaseStatus = 'unavailable';
  } finally {
    await database.close();
  }

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
