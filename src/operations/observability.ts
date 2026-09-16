import { createHmac, randomUUID } from 'node:crypto';

export type OperationalStatus = 'OK' | 'ERROR' | 'RATE_LIMITED';
export type OperationalAlertSeverity = 'WARNING' | 'CRITICAL';

export type OperationalEvent = Readonly<{
  eventVersion: 'operational-event-v1';
  eventName:
    | 'health_check'
    | 'telemetry_ingest'
    | 'telemetry_auth'
    | 'telemetry_rate_limit'
    | 'pilot_invoice_request';
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

export type OperationalAlert = Readonly<{
  alertVersion: 'operational-alert-v1';
  severity: OperationalAlertSeverity;
  event: OperationalEvent;
}>;

export type OperationalAlertDelivery = Readonly<{
  routed: boolean;
  delivered: boolean;
  statusCode: number | null;
  reason: 'NOT_ALERTABLE' | 'NOT_CONFIGURED' | 'DELIVERED' | 'DELIVERY_FAILED';
}>;

const MAX_IDENTIFIER_LENGTH = 128;
const DEFAULT_ALERT_TIMEOUT_MS = 1500;

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

export function classifyOperationalAlert(
  event: OperationalEvent,
): OperationalAlertSeverity | null {
  if (event.eventName === 'health_check' && event.status === 'ERROR') {
    return 'CRITICAL';
  }
  if (event.eventName === 'telemetry_ingest' && event.statusCode >= 500) {
    return 'CRITICAL';
  }
  if (event.eventName === 'telemetry_auth' && event.status === 'ERROR') {
    return 'WARNING';
  }
  if (
    event.eventName === 'telemetry_rate_limit' &&
    event.status === 'RATE_LIMITED'
  ) {
    return 'WARNING';
  }
  if (event.eventName === 'pilot_invoice_request' && event.status === 'OK') {
    return 'WARNING';
  }
  return null;
}

export function buildOperationalAlert(
  event: OperationalEvent,
): OperationalAlert | null {
  const severity = classifyOperationalAlert(event);
  if (severity === null) return null;
  return Object.freeze({
    alertVersion: 'operational-alert-v1',
    severity,
    event,
  });
}

function signAlertBody(body: string, signingSecret: string): string {
  return (
    'sha256=' + createHmac('sha256', signingSecret).update(body).digest('hex')
  );
}

export async function routeOperationalAlert(
  event: OperationalEvent,
  input: Readonly<{
    webhookUrl?: string;
    signingSecret?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }> = {},
): Promise<OperationalAlertDelivery> {
  const alert = buildOperationalAlert(event);
  if (alert === null) {
    return Object.freeze({
      routed: false,
      delivered: false,
      statusCode: null,
      reason: 'NOT_ALERTABLE',
    });
  }

  const webhookUrl = input.webhookUrl?.trim();
  const signingSecret = input.signingSecret?.trim();
  if (
    webhookUrl === undefined ||
    webhookUrl.length === 0 ||
    signingSecret === undefined ||
    signingSecret.length < 16
  ) {
    return Object.freeze({
      routed: false,
      delivered: false,
      statusCode: null,
      reason: 'NOT_CONFIGURED',
    });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(webhookUrl);
  } catch {
    return Object.freeze({
      routed: false,
      delivered: false,
      statusCode: null,
      reason: 'NOT_CONFIGURED',
    });
  }
  if (parsedUrl.protocol !== 'https:') {
    return Object.freeze({
      routed: false,
      delivered: false,
      statusCode: null,
      reason: 'NOT_CONFIGURED',
    });
  }

  const body = JSON.stringify(alert);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': 'ai-efficiency-intelligence-alert-router/1',
    'x-ai-efficiency-signature': signAlertBody(body, signingSecret),
  };

  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(input.timeoutMs ?? DEFAULT_ALERT_TIMEOUT_MS),
    });
    return Object.freeze({
      routed: true,
      delivered: response.ok,
      statusCode: response.status,
      reason: response.ok ? 'DELIVERED' : 'DELIVERY_FAILED',
    });
  } catch {
    return Object.freeze({
      routed: true,
      delivered: false,
      statusCode: null,
      reason: 'DELIVERY_FAILED',
    });
  }
}

export async function publishOperationalEvent(
  event: OperationalEvent,
  input: Readonly<{
    webhookUrl?: string;
    signingSecret?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }> = {},
): Promise<OperationalAlertDelivery> {
  emitOperationalEvent(event);
  return routeOperationalAlert(event, input);
}

export function elapsedMs(startedAtMs: number): number {
  return Math.max(0, Date.now() - startedAtMs);
}
