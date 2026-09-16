'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import {
  buildOperationalEvent,
  publishOperationalEvent,
} from '../../../../../../src/operations/observability';
import { requestPilotInvoice } from '../../../../../../src/workbench/pilot-invoice';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function submitPilotInvoiceRequest(
  formData: FormData,
): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const companyName = textEntry(formData, 'companyName');
  const contactEmail = textEntry(formData, 'contactEmail');
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;

  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    await requestPilotInvoice({
      db: database.db,
      session,
      input: { organizationId, companyName, contactEmail },
    });

    await publishOperationalEvent(
      buildOperationalEvent({
        eventName: 'pilot_invoice_request',
        requestId: randomUUID(),
        route: '/o/[organizationId]/pilot',
        status: 'OK',
        statusCode: 200,
        durationMs: 0,
        organizationId,
        actorKind: 'SESSION',
      }),
      {
        webhookUrl: process.env.OPS_ALERT_WEBHOOK_URL,
        signingSecret: process.env.OPS_ALERT_WEBHOOK_SECRET,
      },
    );
  } finally {
    await database.close();
  }

  redirect('/o/' + organizationId + '/pilot?requested=true');
}
