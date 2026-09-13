import { describe, expect, it } from 'vitest';
import { createProductEvent } from '../../src/product-events/events.js';

describe('safe product events', () => {
  it('accepts only documented scalar evidence properties', () => {
    const event = createProductEvent({
      name: 'VERIFICATION_COMPLETED',
      organizationId: 'org-1',
      occurredAt: '2026-09-13T12:00:00Z',
      properties: {
        recommendationId: 'rec-1',
        state: 'VERIFIED',
        count: 1,
        durationMs: 120,
        money: '0.35',
      },
    });
    expect(event.name).toBe('VERIFICATION_COMPLETED');
    expect(Object.isFrozen(event.properties)).toBe(true);
  });

  it.each([
    ['prompt', 'customer prompt'],
    ['responseText', 'model response'],
    ['credentialId', 'secret-ref'],
    ['apiToken', 'token'],
    ['requestHeader', 'header'],
    ['uploadedRow', 'row-data'],
    ['errorMessage', 'unrestricted stack text'],
  ])('rejects sensitive property %s', (key, value) => {
    expect(() =>
      createProductEvent({
        name: 'IMPORT_FAILED',
        organizationId: 'org-1',
        occurredAt: '2026-09-13T12:00:00Z',
        properties: { safeErrorCategory: 'VALIDATION_ERROR', [key]: value },
      }),
    ).toThrow('UNSAFE_PRODUCT_EVENT_PROPERTY');
  });

  it('rejects nested objects and arrays', () => {
    for (const value of [{ nested: true }, ['row']]) {
      expect(() =>
        createProductEvent({
          name: 'ANALYSIS_COMPLETED',
          organizationId: 'org-1',
          occurredAt: '2026-09-13T12:00:00Z',
          properties: { metadata: value },
        }),
      ).toThrow();
    }
  });
});
