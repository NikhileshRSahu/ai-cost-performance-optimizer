import { describe, expect, it } from 'vitest';
import { LAB_COPY } from '../../apps/web/lib/lab-copy.js';

describe('Optimization Lab copy', () => {
  it('uses comparison and evidence language without guarantees', () => {
    const copy = JSON.stringify(LAB_COPY);
    expect(copy).not.toMatch(/guaranteed|guarantee|risk-free/i);
    expect(LAB_COPY.currentLabel).toBe('Current configuration');
    expect(LAB_COPY.candidateLabel).toBe('Candidate configuration');
  });

  it('keeps the synthetic disclaimer explicit', () => {
    expect(LAB_COPY.demoDisclaimer).toBe(
      'Synthetic demo data — not a customer result.',
    );
  });
});
