import { describe, expect, it } from 'vitest';
import { buildAnalysisDepth } from '../../src/efficiency/analysis-depth.js';
import { buildWorkMriSnapshot } from '../../src/efficiency/work-mri.js';

describe('buildWorkMriSnapshot', () => {
  it('shows evidence-backed spend while explicitly withholding unsupported intelligence', () => {
    const snapshot = buildWorkMriSnapshot({
      additionalFacts: [],
      depth: buildAnalysisDepth(['USAGE_CSV']),
      observedSpend: {
        amount: '1200.00',
        currency: 'USD',
        evidenceRef: 'usage-window-1',
      },
      strongestAction: null,
      verifiedNetSavings: null,
    });

    expect(snapshot.facts).toEqual([
      {
        label: 'Observed AI spend',
        value: 'USD 1200.00',
        evidenceRef: 'usage-window-1',
      },
    ]);
    expect(snapshot.withheldClaims.join(' ')).toContain('Prompt-quality claims');
    expect(snapshot.withheldClaims.join(' ')).toContain(
      'Cost-per-successful-outcome',
    );
    expect(snapshot.nextUnlock).toContain('sanitized AI-history export');
  });

  it('surfaces the strongest action without upgrading opportunity into tested or verified savings', () => {
    const snapshot = buildWorkMriSnapshot({
      additionalFacts: [],
      depth: buildAnalysisDepth(['USAGE_CSV']),
      observedSpend: null,
      strongestAction: {
        title: 'Right-size classification traffic',
        state: 'OPPORTUNITY',
        confidenceBand: 'HIGH',
        saving: {
          amount: '420.00',
          currency: 'USD',
          evidenceRef: 'recommendation-1',
        },
        principalLimitation: 'Candidate has not been benchmarked yet.',
        nextAction: 'Run controlled benchmark',
      },
      verifiedNetSavings: null,
    });

    expect(snapshot.strongestAction?.state).toBe('OPPORTUNITY');
    expect(snapshot.strongestAction?.savingLabel).toBe('USD 420.00');
    expect(snapshot.strongestAction?.limitation).toBe(
      'Candidate has not been benchmarked yet.',
    );
  });

  it('removes withheld claims as the evidence boundary expands', () => {
    const snapshot = buildWorkMriSnapshot({
      additionalFacts: [],
      depth: buildAnalysisDepth([
        'USAGE_CSV',
        'SANITIZED_AI_EXPORT',
        'AUTHORIZED_WORKSPACE',
        'PRODUCTION_TELEMETRY',
      ]),
      observedSpend: null,
      strongestAction: null,
      verifiedNetSavings: null,
    });

    expect(snapshot.withheldClaims).toEqual([]);
    expect(snapshot.nextUnlock).toBeNull();
  });
});
