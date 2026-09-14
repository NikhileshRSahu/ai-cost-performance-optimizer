import { randomUUID } from 'node:crypto';

export type OperationalStatus = 'OK' | 'ERROR' | 'RATE_LIMITED';

export type OperationalEvent = Readonly<{
  eventVersion: 'operational-event-v1';
  eventName:
    | 'health_check'
    | 'telemetry_ingest'
    | 'telemetry_auth'
    | 'telemetry_rate_limit';
  requestId: string;
  route: string;
  status: OperationalStatus;
  statusCode: number;
  durationMs: number;
  organizationId: string | null;
  actorKind: 'SESSION' | 'MACHINE' | 'ANONYMOUS' | 'SYSTEM';
  safeErrorCategory: string | null;
  acceptedCount: number | null;
  skippedCount: number | null;
  occurredAt: string;
}>;

const MAX_IDENTIFIER_LENGTH = 128;

function safeIdentifier(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, MAX_IDENTIFIER_LENGTH);
}

export function resolveRequestId(headerValue: string | null): string {
  return safeIdentifier(headerValue) ?? randomUUID();
}

export function buildOperationalEvent(
  input: Readonly<{
    eventName: OperationalEvent['eventName'];
    requestId: string;
    route: string;
    status: OperationalStatus;
    statusCode: number;
    durationMs: number;
    organizationId?: string | null;
    actorKind: OperationalEvent['actorKind'];
    safeErrorCategory?: string | null;
    acceptedCount?: number | null;
    skippedCount?: number | null;
    occurredAt?: string;
  }>,
): OperationalEvent {
  return Object.freeze({
    eventVersion: 'operational-event-v1',
    eventName: input.eventName,
    requestId: safeIdentifier(input.requestId) ?? randomUUID(),
    route: safeIdentifier(input.route) ?? 'unknown',
    status: input.status,
    statusCode: Math.trunc(input.statusCode),
    durationMs: Math.max(0, Math.trunc(input.durationMs)),
    organizationId: safeIdentifier(input.organizationId),
    actorKind: input.actorKind,
    safeErrorCategory: safeIdentifier(input.safeErrorCategory),
    acceptedCount:
      input.acceptedCount === undefined ? null : input.acceptedCount,
    skippedCount: input.skippedCount === undefined ? null : input.skippedCount,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  });
}

export function emitOperationalEvent(event: OperationalEvent): void {
  process.stdout.write(JSON.stringify(event) + '\n');
}

export function elapsedMs(startedAtMs: number): number {
  return Math.max(0, Date.now() - startedAtMs);
}
