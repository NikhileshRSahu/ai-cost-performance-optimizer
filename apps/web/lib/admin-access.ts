import { eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../../../src/persistence/database.js';
import { users } from '../../../src/persistence/schema.js';

function configuredAdminEmails(): ReadonlySet<string> {
  return new Set(
    (process.env.EVALOMICS_ADMIN_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0),
  );
}

export async function requireAdminAccess(
  db: PersistenceDatabase,
  userId: string,
): Promise<Readonly<{ email: string }>> {
  const allowed = configuredAdminEmails();
  if (allowed.size === 0) throw new Error('ADMIN_ACCESS_NOT_CONFIGURED');

  const user = (
    await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
  ).at(0);

  if (user === undefined || !allowed.has(user.email.toLowerCase())) {
    throw new Error('ADMIN_ACCESS_REQUIRED');
  }

  return Object.freeze({ email: user.email });
}
