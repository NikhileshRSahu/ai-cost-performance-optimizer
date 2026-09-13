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

export function createDatabase(connectionString: string): DatabaseHandle {
  if (connectionString.trim().length === 0) {
    throw new Error('DATABASE_URL_REQUIRED');
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  return Object.freeze({
    db,
    pool,
    async migrate(): Promise<void> {
      await runMigrations(db, { migrationsFolder: 'drizzle' });
    },
    async close(): Promise<void> {
      await pool.end();
    },
  });
}
