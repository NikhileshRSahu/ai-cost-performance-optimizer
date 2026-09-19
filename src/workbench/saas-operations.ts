import { desc, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import { supportRequests } from '../persistence/schema.js';

export async function listSupportRequests(db: PersistenceDatabase) {
  return db
    .select()
    .from(supportRequests)
    .orderBy(desc(supportRequests.createdAt));
}

export async function setSupportRequestStatus(
  db: PersistenceDatabase,
  id: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
): Promise<void> {
  const updated = await db
    .update(supportRequests)
    .set({ status })
    .where(eq(supportRequests.id, id))
    .returning({ id: supportRequests.id });

  if (updated.length !== 1) throw new Error('SUPPORT_REQUEST_NOT_FOUND');
}
