import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { telemetryCredentials } from '../../../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../../../src/persistence/tenant';
import { safeErrorFromUnknown } from '../../../../../../../src/workbench/safe-errors';
import {
  createTelemetryCredential,
  revokeTelemetryCredential,
  rotateTelemetryCredential,
} from '../../../../../../../src/workbench/telemetry-auth';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

const createSchema = z.object({ label: z.string().min(2).max(80) }).strict();
const credentialSchema = z
  .object({ credentialId: z.string().regex(/^[a-f0-9]{32}$/) })
  .strict();

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

async function parseJson(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (raw.trim().length === 0) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) {
    return noStore(
      { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
      401,
    );
  }

  const database = createDatabase(databaseUrl);
  try {
    requireOrganizationAccess({
      session,
      organizationId,
      action: 'MANAGE_CREDENTIAL_REFERENCE',
    });
    const credentials = await database.db
      .select({
        credentialId: telemetryCredentials.id,
        label: telemetryCredentials.label,
        createdAt: telemetryCredentials.createdAt,
        lastUsedAt: telemetryCredentials.lastUsedAt,
        revokedAt: telemetryCredentials.revokedAt,
      })
      .from(telemetryCredentials)
      .where(eq(telemetryCredentials.organizationId, organizationId));

    return noStore({ credentials });
  } catch (error) {
    const safe = safeErrorFromUnknown(error);
    return noStore({ error: safe.category, message: safe.message }, safe.status);
  } finally {
    await database.close();
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  const pepper = process.env.TELEMETRY_CREDENTIAL_PEPPER;
  if (session === null || databaseUrl === undefined || pepper === undefined) {
    return noStore(
      { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
      401,
    );
  }

  const parsed = createSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return noStore(
      { error: 'INVALID_INPUT', message: 'The supplied input is invalid.' },
      400,
    );
  }

  const database = createDatabase(databaseUrl);
  try {
    const issued = await createTelemetryCredential({
      db: database.db,
      session,
      organizationId,
      label: parsed.data.label,
      pepper,
      now: new Date().toISOString(),
    });
    return noStore(
      {
        ...issued,
        warning: 'Copy this token now. It cannot be retrieved later.',
      },
      201,
    );
  } catch (error) {
    const safe = safeErrorFromUnknown(error);
    return noStore({ error: safe.category, message: safe.message }, safe.status);
  } finally {
    await database.close();
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  const pepper = process.env.TELEMETRY_CREDENTIAL_PEPPER;
  if (session === null || databaseUrl === undefined || pepper === undefined) {
    return noStore(
      { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
      401,
    );
  }

  const parsed = credentialSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return noStore(
      { error: 'INVALID_INPUT', message: 'The supplied input is invalid.' },
      400,
    );
  }

  const database = createDatabase(databaseUrl);
  try {
    const issued = await rotateTelemetryCredential({
      db: database.db,
      session,
      organizationId,
      credentialId: parsed.data.credentialId,
      pepper,
      now: new Date().toISOString(),
    });
    return noStore({
      ...issued,
      warning:
        'The previous token is revoked. Copy this replacement now; it cannot be retrieved later.',
    });
  } catch (error) {
    const safe = safeErrorFromUnknown(error);
    return noStore({ error: safe.category, message: safe.message }, safe.status);
  } finally {
    await database.close();
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) {
    return noStore(
      { error: 'UNAUTHORIZED', message: 'Authentication is required.' },
      401,
    );
  }

  const parsed = credentialSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return noStore(
      { error: 'INVALID_INPUT', message: 'The supplied input is invalid.' },
      400,
    );
  }

  const database = createDatabase(databaseUrl);
  try {
    await revokeTelemetryCredential({
      db: database.db,
      session,
      organizationId,
      credentialId: parsed.data.credentialId,
      now: new Date().toISOString(),
    });
    return noStore({ revoked: true });
  } catch (error) {
    const safe = safeErrorFromUnknown(error);
    return noStore({ error: safe.category, message: safe.message }, safe.status);
  } finally {
    await database.close();
  }
}
