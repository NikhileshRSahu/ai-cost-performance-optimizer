import { describe, expect, it, vi } from 'vitest';
import {
  buildOperationalAlert,
  buildOperationalEvent,
  classifyOperationalAlert,
  emitOperationalEvent,
  publishOperationalEvent,
  resolveRequestId,
  routeOperationalAlert,
} from '../../src/operations/observability.js';

describe('safe operational observability', () => {
  it('keeps the event shape limited to approved metadata', () => {
    const event = buildOperationalEvent({
      eventName: 'telemetry_ingest',
      requestId: 'req-1',
      route: '/o/:organizationId/telemetry/ingest',
      status: 'OK',
      statusCode: 202,
      durationMs: 42,
      organizationId: 'org-1',
      actorKind: 'MACHINE',
      acceptedCount: 12,
      skippedCount: 2,
      occurredAt: '2026-09-14T07:30:00Z',
    });

    expect(Object.keys(event).sort()).toEqual(
      [
        'acceptedCount',
        'actorKind',
        'durationMs',
        'eventName',
        'eventVersion',
        'occurredAt',
        'organizationId',
        'requestId',
        'route',
        'safeErrorCategory',
        'skippedCount',
        'status',
        'statusCode',
      ].sort(),
    );
    expect(JSON.stringify(event)).not.toMatch(
      /authorization|prompt|response|token|secret|password|body/i,
    );
  });

  it('truncates untrusted identifiers before logging', () => {
    const event = buildOperationalEvent({
      eventName: 'health_check',
      requestId: 'r'.repeat(500),
      route: '/api/health',
      status: 'OK',
      statusCode: 200,
      durationMs: 1,
      actorKind: 'SYSTEM',
    });

    expect(event.requestId).toHaveLength(128);
  });

  it('writes exactly one JSON line to stdout', () => {
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const event = buildOperationalEvent({
      eventName: 'health_check',
      requestId: 'req-1',
      route: '/api/health',
      status: 'OK',
      statusCode: 200,
      durationMs: 1,
      actorKind: 'SYSTEM',
    });

    emitOperationalEvent(event);

    expect(write).toHaveBeenCalledTimes(1);
    expect(String(write.mock.calls[0]?.[0])).toContain(
      '"eventVersion":"operational-event-v1"',
    );
    write.mockRestore();
  });

  it('uses a caller request id when it is safe and non-empty', () => {
    expect(resolveRequestId('  abc-123  ')).toBe('abc-123');
  });

  it('classifies only operationally meaningful failures for external alerting', () => {
    const healthy = buildOperationalEvent({
      eventName: 'health_check',
      requestId: 'healthy',
      route: '/api/health',
      status: 'OK',
      statusCode: 200,
      durationMs: 1,
      actorKind: 'SYSTEM',
    });
    const unhealthy = buildOperationalEvent({
      eventName: 'health_check',
      requestId: 'unhealthy',
      route: '/api/health',
      status: 'ERROR',
      statusCode: 503,
      durationMs: 1,
      actorKind: 'SYSTEM',
      safeErrorCategory: 'DATABASE_UNAVAILABLE',
    });
    const throttled = buildOperationalEvent({
      eventName: 'telemetry_rate_limit',
      requestId: 'throttled',
      route: '/o/:organizationId/telemetry/ingest',
      status: 'RATE_LIMITED',
      statusCode: 429,
      durationMs: 1,
      organizationId: 'org-1',
      actorKind: 'MACHINE',
      safeErrorCategory: 'RATE_LIMITED',
    });

    expect(classifyOperationalAlert(healthy)).toBeNull();
    expect(classifyOperationalAlert(unhealthy)).toBe('CRITICAL');
    expect(classifyOperationalAlert(throttled)).toBe('WARNING');
    expect(buildOperationalAlert(unhealthy)).toMatchObject({
      alertVersion: 'operational-alert-v1',
      severity: 'CRITICAL',
    });
  });

  it('does not call an external webhook for non-alertable success events', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const event = buildOperationalEvent({
      eventName: 'telemetry_ingest',
      requestId: 'req-1',
      route: '/o/:organizationId/telemetry/ingest',
      status: 'OK',
      statusCode: 202,
      durationMs: 5,
      organizationId: 'org-1',
      actorKind: 'MACHINE',
    });

    const result = await routeOperationalAlert(event, {
      webhookUrl: 'https://alerts.example.test/hook',
      signingSecret: 'test-signing-secret',
      fetchImpl,
    });

    expect(result).toEqual({
      routed: false,
      delivered: false,
      statusCode: null,
      reason: 'NOT_ALERTABLE',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends a signed allowlisted alert payload without customer content', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const event = buildOperationalEvent({
      eventName: 'health_check',
      requestId: 'req-critical',
      route: '/api/health',
      status: 'ERROR',
      statusCode: 503,
      durationMs: 9,
      actorKind: 'SYSTEM',
      safeErrorCategory: 'DATABASE_UNAVAILABLE',
      occurredAt: '2026-09-14T08:00:00Z',
    });

    const result = await routeOperationalAlert(event, {
      webhookUrl: 'https://alerts.example.test/hook',
      signingSecret: 'test-signing-secret',
      fetchImpl,
    });

    expect(result).toEqual({
      routed: true,
      delivered: true,
      statusCode: 204,
      reason: 'DELIVERED',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe('https://alerts.example.test/hook');
    expect(init?.method).toBe('POST');

    const headers = init?.headers as Record<string, string>;
    expect(headers['x-ai-efficiency-signature']).toMatch(/^sha256=[a-f0-9]{64}$/);

    const body = String(init?.body);
    expect(body).toContain('"severity":"CRITICAL"');
    expect(body).toContain('"safeErrorCategory":"DATABASE_UNAVAILABLE"');
    expect(body).not.toMatch(
      /authorization|prompt|response|bearer|password|customer content/i,
    );
  });

  it('isolates webhook delivery failures from the caller', async () => {
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(
      new Error('network unavailable'),
    );
    const event = buildOperationalEvent({
      eventName: 'telemetry_auth',
      requestId: 'req-warning',
      route: '/o/:organizationId/telemetry/ingest',
      status: 'ERROR',
      statusCode: 401,
      durationMs: 4,
      organizationId: 'org-1',
      actorKind: 'ANONYMOUS',
      safeErrorCategory: 'TELEMETRY_CREDENTIAL_REJECTED',
    });

    await expect(
      publishOperationalEvent(event, {
        webhookUrl: 'https://alerts.example.test/hook',
        fetchImpl,
      }),
    ).resolves.toEqual({
      routed: true,
      delivered: false,
      statusCode: null,
      reason: 'DELIVERY_FAILED',
    });
    expect(write).toHaveBeenCalledTimes(1);
    write.mockRestore();
  });
});
