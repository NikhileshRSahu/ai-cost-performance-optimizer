import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;

if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  throw new Error('DATABASE_URL_REQUIRED');
}
if (secret === undefined || secret.trim().length < 32) {
  throw new Error('BETTER_AUTH_SECRET_REQUIRED');
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const auth = betterAuth({
    appName: 'Proovance',
    secret,
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    database: pool,
    account: {
      encryptOAuthTokens: true,
    },
  });

  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  process.stdout.write('Better Auth schema migration complete.\n');
} finally {
  await pool.end();
}
