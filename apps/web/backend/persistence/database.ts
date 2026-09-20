import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as runMigrations } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema.js';

export type PersistenceDatabase = NodePgDatabase<typeof schema>;

export type DatabaseHandle = Readonly<{
  db: PersistenceDatabase;
  pool: Pool;
  migrate(): Promise<void>;
  close(): Promise<void>;
}>;

function normalizePostgresSslMode(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode');

    if (
      sslMode === 'prefer' ||
      sslMode === 'require' ||
      sslMode === 'verify-ca'
    ) {
      url.searchParams.set('sslmode', 'verify-full');
      return url.toString();
    }
  } catch {
    // Let pg surface the original connection-string error with its native message.
  }

  return connectionString;
}

type GlobalDatabaseCache = typeof globalThis & { __evalomicsPool?: Pool };
const globalDatabase = globalThis as GlobalDatabaseCache;

function buildPool(connectionString: string): Pool {
  const pool = new Pool({
    connectionString: normalizePostgresSslMode(connectionString),
    max: 5,
    min: 0,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  pool.on('error', (error) => {
    const code = (error as Error & { code?: string }).code ?? 'UNKNOWN';
    console.warn('DATABASE_POOL_IDLE_ERROR', code);
  });
  return pool;
}

export function createDatabase(connectionString: string): DatabaseHandle {
  if (connectionString.trim().length === 0) {
    throw new Error('DATABASE_URL_REQUIRED');
  }

  const reusePool = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const pool = reusePool
    ? (globalDatabase.__evalomicsPool ??= buildPool(connectionString))
    : buildPool(connectionString);
  const db = drizzle(pool, { schema });

  return Object.freeze({
    db,
    pool,
    async migrate(): Promise<void> {
      await runMigrations(db, { migrationsFolder: 'drizzle' });
    },
    async close(): Promise<void> {
      if (!reusePool) await pool.end();
    },
  });
}
