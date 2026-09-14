import { and, eq, isNull, sql } from 'drizzle-orm';
import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import type { PersistenceDatabase } from '../persistence/database.js';
import {
  rateLimitWindows,
  telemetryCredentials,
} from '../persistence/schema.js';
import { requireOrganizationAccess } from '../persistence/tenant.js';
import type { AuthenticatedSession } from './authz.js';

const TOKEN_PREFIX = 'aie_tlm_';

export type IssuedTelemetryCredential = Readonly<{
  credentialId: string;
  label: string;
  token: string;
  createdAt: string;
}>;

export type AuthenticatedTelemetryCredential = Readonly<{
  credentialId: string;
  organizationId: string;
  label: string;
}>;

function hashSecret(secret: string, pepper: string): string {
  if (pepper.length < 16) throw new Error('TELEMETRY_CREDENTIAL_PEPPER_REQUIRED');
  return createHmac('sha256', pepper).update(secret).digest('hex');
}

function secretsMatch(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, 'hex');
  const right = Buffer.from(rightHex, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseBearer(authorizationHeader: string | null): {
  credentialId: string;
  secret: string;
} | null {
  if (authorizationHeader === null) return null;
  const match = /^Bearer\s+aie_tlm_([a-f0-9]{32})\.([A-Za-z0-9_-]{32,})$/.exec(
    authorizationHeader.trim(),
  );
  if (match === null) return null;
  return { credentialId: match[1], secret: match[2] };
}

function issueSecret(): { credentialId: string; secret: string; token: string } {
  const credentialId = randomUUID().replaceAll('-', '');
  const secret = randomBytes(32).toString('base64url');
  return {
    credentialId,
    secret,
    token: TOKEN_PREFIX + credentialId + '.' + secret,
  };
}

function validateLabel(label: string): string {
  const value = label.trim();
  if (value.length < 2 || value.length > 80) {
    throw new Error('INVALID_TELEMETRY_CREDENTIAL_LABEL');
  }
  return value;
}

export async function createTelemetryCredential(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    label: string;
    pepper: string;
    now: string;
  }>,
): Promise<IssuedTelemetryCredential> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_CREDENTIAL_REFERENCE',
  });

  const label = validateLabel(input.label);
  const issued = issueSecret();
  await input.db.insert(telemetryCredentials).values({
    id: issued.credentialId,
    organizationId: input.organizationId,
    label,
    secretHash: hashSecret(issued.secret, input.pepper),
    createdByUserId: input.session.userId,
    createdAt: input.now,
    lastUsedAt: null,
    revokedAt: null,
  });

  return Object.freeze({
    credentialId: issued.credentialId,
    label,
    token: issued.token,
    createdAt: input.now,
  });
}

export async function revokeTelemetryCredential(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    credentialId: string;
    now: string;
  }>,
): Promise<void> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_CREDENTIAL_REFERENCE',
  });

  const updated = await input.db
    .update(telemetryCredentials)
    .set({ revokedAt: input.now })
    .where(
      and(
        eq(telemetryCredentials.organizationId, input.organizationId),
        eq(telemetryCredentials.id, input.credentialId),
        isNull(telemetryCredentials.revokedAt),
      ),
    )
    .returning({ id: telemetryCredentials.id });

  if (updated.length === 0) throw new Error('TELEMETRY_CREDENTIAL_NOT_FOUND');
}

export async function rotateTelemetryCredential(
  input: Readonly<{
    db: PersistenceDatabase;
    session: AuthenticatedSession;
    organizationId: string;
    credentialId: string;
    pepper: string;
    now: string;
  }>,
): Promise<IssuedTelemetryCredential> {
  requireOrganizationAccess({
    session: input.session,
    organizationId: input.organizationId,
    action: 'MANAGE_CREDENTIAL_REFERENCE',
  });

  const existing = (
    await input.db
      .select()
      .from(telemetryCredentials)
      .where(
        and(
          eq(telemetryCredentials.organizationId, input.organizationId),
          eq(telemetryCredentials.id, input.credentialId),
          isNull(telemetryCredentials.revokedAt),
        ),
      )
      .limit(1)
  ).at(0);

  if (existing === undefined) throw new Error('TELEMETRY_CREDENTIAL_NOT_FOUND');

  const issued = issueSecret();
  await input.db.transaction(async (tx) => {
    await tx
      .update(telemetryCredentials)
      .set({ revokedAt: input.now })
      .where(
        and(
          eq(telemetryCredentials.organizationId, input.organizationId),
          eq(telemetryCredentials.id, input.credentialId),
          isNull(telemetryCredentials.revokedAt),
        ),
      );

    await tx.insert(telemetryCredentials).values({
      id: issued.credentialId,
      organizationId: input.organizationId,
      label: existing.label,
      secretHash: hashSecret(issued.secret, input.pepper),
      createdByUserId: input.session.userId,
      createdAt: input.now,
      lastUsedAt: null,
      revokedAt: null,
    });
  });

  return Object.freeze({
    credentialId: issued.credentialId,
    label: existing.label,
    token: issued.token,
    createdAt: input.now,
  });
}

export async function authenticateTelemetryCredential(
  input: Readonly<{
    db: PersistenceDatabase;
    organizationId: string;
    authorizationHeader: string | null;
    pepper: string;
    now: string;
  }>,
): Promise<AuthenticatedTelemetryCredential | null> {
  const parsed = parseBearer(input.authorizationHeader);
  if (parsed === null) return null;

  const credential = (
    await input.db
      .select()
      .from(telemetryCredentials)
      .where(
        and(
          eq(telemetryCredentials.organizationId, input.organizationId),
          eq(telemetryCredentials.id, parsed.credentialId),
          isNull(telemetryCredentials.revokedAt),
        ),
      )
      .limit(1)
  ).at(0);
  if (credential === undefined) return null;

  const candidate = hashSecret(parsed.secret, input.pepper);
  if (!secretsMatch(candidate, credential.secretHash)) return null;

  await input.db
    .update(telemetryCredentials)
    .set({ lastUsedAt: input.now })
    .where(eq(telemetryCredentials.id, credential.id));

  return Object.freeze({
    credentialId: credential.id,
    organizationId: credential.organizationId,
    label: credential.label,
  });
}

export async function consumeDistributedRateLimit(
  input: Readonly<{
    db: PersistenceDatabase;
    organizationId: string;
    scopeKey: string;
    now: string;
    limit: number;
    windowSeconds?: number;
  }>,
): Promise<Readonly<{ allowed: boolean; count: number; retryAfterSeconds: number }>> {
  const windowSeconds = input.windowSeconds ?? 60;
  if (input.limit < 1 || windowSeconds < 1) {
    throw new Error('INVALID_RATE_LIMIT_CONFIGURATION');
  }

  const nowMs = new Date(input.now).getTime();
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs).toISOString();

  const row = (
    await input.db
      .insert(rateLimitWindows)
      .values({
        organizationId: input.organizationId,
        scopeKey: input.scopeKey,
        windowStart,
        requestCount: 1,
        updatedAt: input.now,
      })
      .onConflictDoUpdate({
        target: [
          rateLimitWindows.organizationId,
          rateLimitWindows.scopeKey,
          rateLimitWindows.windowStart,
        ],
        set: {
          requestCount: sql.raw('"rate_limit_windows"."request_count" + 1'),
          updatedAt: input.now,
        },
      })
      .returning({ requestCount: rateLimitWindows.requestCount })
  ).at(0);

  const count = row?.requestCount ?? input.limit + 1;
  const remainingMs = windowStartMs + windowMs - nowMs;
  return Object.freeze({
    allowed: count <= input.limit,
    count,
    retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
  });
}
