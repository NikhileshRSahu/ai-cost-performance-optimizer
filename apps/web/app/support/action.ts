'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../src/persistence/database';
import {
  buildOperationalEvent,
  publishOperationalEvent,
} from '../../../../src/operations/observability';
import { createSupportRequest } from '../../../../src/workbench/support';
import { resolveRuntimeSession } from '../../lib/runtime-session';

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function submitSupportRequest(formData: FormData): Promise<never> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) redirect('/support?error=UNAVAILABLE');

  const session = await resolveRuntimeSession();
  const organizationId = text(formData, 'organizationId') || null;
  const category = text(formData, 'category');

  const database = createDatabase(databaseUrl);
  let requestId: string;
  try {
    const request = await createSupportRequest({
      db: database.db,
      userId: session?.userId ?? null,
      organizationId,
      category,
      subject: text(formData, 'subject'),
      message: text(formData, 'message'),
    });
    requestId = request.id;

    await publishOperationalEvent(
      buildOperationalEvent({
        eventName: 'support_request',
        requestId: randomUUID(),
        route: '/support',
        status: 'OK',
        statusCode: 200,
        durationMs: 0,
        organizationId,
        actorKind: session === null ? 'ANONYMOUS' : 'SESSION',
        safeErrorCategory: category,
      }),
      {
        webhookUrl: process.env.OPS_ALERT_WEBHOOK_URL,
        signingSecret: process.env.OPS_ALERT_WEBHOOK_SECRET,
      },
    );
  } catch {
    redirect('/support?error=INVALID');
  } finally {
    await database.close();
  }

  redirect('/support?submitted=' + encodeURIComponent(requestId));
}
