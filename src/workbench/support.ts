import { randomUUID } from 'node:crypto';
import type { PersistenceDatabase } from '../persistence/database.js';
import { supportRequests } from '../persistence/schema.js';

function bounded(value: string, max: number): string {
  const v = value.trim();
  if (v.length === 0 || v.length > max) throw new Error('INVALID_SUPPORT_REQUEST');
  return v;
}

export async function createSupportRequest(input: {
  db: PersistenceDatabase;
  userId: string | null;
  organizationId: string | null;
  category: string;
  subject: string;
  message: string;
}): Promise<Readonly<{ id: string }>> {
  const category = bounded(input.category, 40).toUpperCase();
  if (!['SUPPORT', 'BILLING', 'SECURITY', 'PRIVACY', 'BUG'].includes(category)) {
    throw new Error('INVALID_SUPPORT_CATEGORY');
  }
  const id = randomUUID();
  await input.db.insert(supportRequests).values({
    id,
    organizationId: input.organizationId,
    userId: input.userId,
    category,
    subject: bounded(input.subject, 160),
    message: bounded(input.message, 5000),
    status: 'OPEN',
  });
  return Object.freeze({ id });
}
