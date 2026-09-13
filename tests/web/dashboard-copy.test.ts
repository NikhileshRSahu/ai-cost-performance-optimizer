import { describe, expect, it } from 'vitest';
import { DASHBOARD_COPY } from '../../apps/web/lib/dashboard-copy.js';

describe('founder dashboard customer copy', () => {
  it('uses evidence-state language instead of guarantee language', () => {
    const copy = JSON.stringify(DASHBOARD_COPY);
    expect(copy).not.toMatch(/guaranteed|guarantee|risk-free|proven customer/i);
    expect(DASHBOARD_COPY.observedSpendLabel).toBe('Observed spend');
    expect(DASHBOARD_COPY.strongestActionLabel).toBe('Strongest action');
    expect(DASHBOARD_COPY.verifiedSavingsLabel).toBe('Verified net impact');
  });

  it('keeps the synthetic disclaimer explicit', () => {
    expect(DASHBOARD_COPY.demoDisclaimer).toBe(
      'Synthetic demo data — not a customer result.',
    );
  });
});
