import { NextResponse } from 'next/server';
import {
  buildOperationalEvent,
  elapsedMs,
  emitOperationalEvent,
  resolveRequestId,
} from '../../../../../src/operations/observability';
import { createDatabase } from '../../../../../src/persistence/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request.headers.get('x-request-id'));
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    emitOperationalEvent(
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
      { status: 'not_ready', reason: 'database_not_configured' },
      { status: 503, headers: { 'x-request-id': requestId } },
    );
  }

  const database = createDatabase(databaseUrl);
  try {
    await database.pool.query('select 1');
    emitOperationalEvent(
      buildOperationalEvent({
        eventName: 'health_check',
        requestId,
        route: '/api/health',
        status: 'OK',
        statusCode: 200,
        durationMs: elapsedMs(startedAt),
        actorKind: 'SYSTEM',
      }),
    );
    return NextResponse.json(
      {
        status: 'ok',
        checks: { database: 'ok' },
      },
      { headers: { 'x-request-id': requestId } },
    );
  } catch {
    emitOperationalEvent(
      buildOperationalEvent({
        eventName: 'health_check',
        requestId,
        route: '/api/health',
        status: 'ERROR',
        statusCode: 503,
        durationMs: elapsedMs(startedAt),
        actorKind: 'SYSTEM',
        safeErrorCategory: 'DATABASE_UNAVAILABLE',
      }),
    );
    return NextResponse.json(
      { status: 'not_ready', reason: 'database_unavailable' },
      { status: 503, headers: { 'x-request-id': requestId } },
    );
  } finally {
    await database.close();
  }
}
