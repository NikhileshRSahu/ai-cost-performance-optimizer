import { NextResponse } from 'next/server';
import { createDatabase } from '../../../../../src/persistence/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    return NextResponse.json(
      { status: 'not_ready', reason: 'database_not_configured' },
      { status: 503 },
    );
  }

  const database = createDatabase(databaseUrl);
  try {
    await database.pool.query('select 1');
    return NextResponse.json({
      status: 'ok',
      checks: { database: 'ok' },
    });
  } catch {
    return NextResponse.json(
      { status: 'not_ready', reason: 'database_unavailable' },
      { status: 503 },
    );
  } finally {
    await database.close();
  }
}
