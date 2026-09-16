import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { Pool } from 'pg';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}

const databaseUrl = required('DATABASE_URL');
const secret = required('BETTER_AUTH_SECRET');
if (secret.length < 32) throw new Error('BETTER_AUTH_SECRET_REQUIRED');

const baseURL =
  process.env.BETTER_AUTH_URL?.trim().replace(/\/+$/, '') ??
  'http://localhost:3000';

const adminPool = new Pool({ connectionString: databaseUrl });

try {
  await adminPool.query('create schema if not exists auth');
} finally {
  await adminPool.end();
}

const authPool = new Pool({
  connectionString: databaseUrl,
  options: '-c search_path=auth',
});

try {
  const auth = betterAuth({
    appName: 'Evalomics',
    secret,
    baseURL,
    database: authPool,
    account: {
      encryptOAuthTokens: true,
    },
  });

  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  process.stdout.write('Better Auth schema migration complete.\n');
} finally {
  await authPool.end();
}
