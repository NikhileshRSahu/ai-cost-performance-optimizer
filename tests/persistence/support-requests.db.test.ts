import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import { supportRequests } from '../../src/persistence/schema.js';
import { createSupportRequest } from '../../src/workbench/support.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
const database = createDatabase(databaseUrl);

describe('support requests', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(supportRequests);
  });

  afterAll(async () => {
    await database.close();
  });

  it('persists a bounded operational support request', async () => {
    const created = await createSupportRequest({
      db: database.db,
      userId: null,
      organizationId: null,
      category: 'SECURITY',
      subject: 'Potential issue',
      message: 'A reproducible security concern.',
    });

    const [row] = await database.db.select().from(supportRequests);
    expect(row).toMatchObject({
      id: created.id,
      category: 'SECURITY',
      status: 'OPEN',
      subject: 'Potential issue',
    });
  });

  it('rejects unsupported categories', async () => {
    await expect(
      createSupportRequest({
        db: database.db,
        userId: null,
        organizationId: null,
        category: 'OTHER',
        subject: 'Test',
        message: 'Test request',
      }),
    ).rejects.toThrow('INVALID_SUPPORT_CATEGORY');
  });
});
