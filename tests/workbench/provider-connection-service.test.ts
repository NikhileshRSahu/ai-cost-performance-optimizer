import { describe, expect, it } from 'vitest';
import { providerConnectionSafeError } from '../../src/workbench/provider-connection-service.js';

describe('provider connector safe errors', () => {
  it('maps provider authorization and rate-limit errors to categorical UI codes', () => {
    expect(providerConnectionSafeError(new Error('OPENAI_USAGE_401'))).toBe(
      'PROVIDER_CREDENTIAL_REJECTED',
    );
    expect(providerConnectionSafeError(new Error('ANTHROPIC_COST_403'))).toBe(
      'PROVIDER_CREDENTIAL_REJECTED',
    );
    expect(providerConnectionSafeError(new Error('OPENAI_COST_429'))).toBe(
      'PROVIDER_RATE_LIMITED',
    );
  });

  it('does not echo raw provider or credential-bearing error text', () => {
    const raw =
      'upstream failed for Authorization: Bearer sk-admin-do-not-return';
    const safe = providerConnectionSafeError(new Error(raw));

    expect(safe).toBe('PROVIDER_SYNC_FAILED');
    expect(safe).not.toContain('sk-admin');
    expect(safe).not.toContain('Authorization');
  });

  it('classifies transient database termination without returning database text', () => {
    const safe = providerConnectionSafeError(
      new Error('57P01 terminating connection due to administrator command'),
    );
    expect(safe).toBe('PROVIDER_TEMPORARY_ERROR');
  });
});
