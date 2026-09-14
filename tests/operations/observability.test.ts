import { describe, expect, it, vi } from 'vitest';
import {
  buildOperationalEvent,
  emitOperationalEvent,
  resolveRequestId,
} from '../../src/operations/observability.js';

describe('safe operational observability', () => {
  it('keeps the event shape limited to approved metadata', () => {
    const event = buildOperationalEvent({
      eventName: 'telemetry_ingest',
      requestId: 'req-1',
      route: '/o/:organizationId/telemetry',
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
});
