import { describe, expect, it } from 'vitest';
import { rankRecommendations } from '../../src/ranking/ranking.js';

describe('recommendation ranking', () => {
  it('maps tested boundary safety to 0.5 and ten-percent margin to 1', () => {
    const ranked = rankRecommendations([
      {
        findingId: 'boundary',
        positiveNetMonthlySaving: '100',
        organizationMaterialityTarget: '100',
        confidence: 1,
        ease: 'CONFIGURATION_ONLY',
        tested: true,
        constraints: [
          {
            kind: 'MINIMUM',
            measured: '0.9',
            threshold: '0.9',
            passed: true,
          },
        ],
      },
      {
        findingId: 'margin',
        positiveNetMonthlySaving: '100',
        organizationMaterialityTarget: '100',
        confidence: 1,
        ease: 'CONFIGURATION_ONLY',
        tested: true,
        constraints: [
          {
            kind: 'MINIMUM',
            measured: '0.99',
            threshold: '0.9',
            passed: true,
          },
        ],
      },
    ]);

    const boundary = ranked.find((item) => item.findingId === 'boundary');
    const margin = ranked.find((item) => item.findingId === 'margin');
    expect(boundary?.performanceSafety).toBe(0.5);
    expect(margin?.performanceSafety).toBe(1);
  });

  it('uses 0.25 performance safety for untested hypotheses', () => {
    const [item] = rankRecommendations([
      {
        findingId: 'untested',
        positiveNetMonthlySaving: '50',
        organizationMaterialityTarget: '100',
        confidence: 0.8,
        ease: 'CONFIGURATION_ONLY',
        tested: false,
        constraints: [],
      },
    ]);

    expect(item?.performanceSafety).toBe(0.25);
  });

  it('resolves exact ties by stable finding id', () => {
    const ranked = rankRecommendations([
      {
        findingId: 'b',
        positiveNetMonthlySaving: '100',
        organizationMaterialityTarget: '100',
        confidence: 0.8,
        ease: 'CONFIGURATION_ONLY',
        tested: false,
        constraints: [],
      },
      {
        findingId: 'a',
        positiveNetMonthlySaving: '100',
        organizationMaterialityTarget: '100',
        confidence: 0.8,
        ease: 'CONFIGURATION_ONLY',
        tested: false,
        constraints: [],
      },
    ]);

    expect(ranked.map((item) => item.findingId)).toEqual(['a', 'b']);
  });

  it('rejects a non-positive organization materiality target', () => {
    expect(() =>
      rankRecommendations([
        {
          findingId: 'x',
          positiveNetMonthlySaving: '10',
          organizationMaterialityTarget: '0',
          confidence: 0.8,
          ease: 'CONFIGURATION_ONLY',
          tested: false,
          constraints: [],
        },
      ]),
    ).toThrow('MATERIALITY_TARGET_MUST_BE_POSITIVE');
  });
});
