import { describe, expect, it } from 'vitest';
import { buildAnalysisDepth } from '../../src/efficiency/analysis-depth.js';

describe('buildAnalysisDepth', () => {
  it('keeps CSV-only analysis inside evidence-supported capabilities', () => {
    const depth = buildAnalysisDepth(['USAGE_CSV']);

    expect(depth.level).toBe(1);
    expect(depth.capabilities).toContain('COST_EFFICIENCY');
    expect(depth.capabilities).not.toContain('PROMPT_STRUCTURE');
    expect(depth.missingForNextLevel).toEqual(['SANITIZED_AI_EXPORT']);
  });

  it('unlocks prompt/workflow analysis only with content evidence', () => {
    const depth = buildAnalysisDepth(['USAGE_CSV', 'SANITIZED_AI_EXPORT']);

    expect(depth.level).toBe(2);
    expect(depth.capabilities).toContain('PROMPT_STRUCTURE');
    expect(depth.capabilities).toContain('REPEATED_CONTEXT');
    expect(depth.capabilities).not.toContain('KNOWLEDGE_RETRIEVAL');
  });

  it('unlocks cross-workspace knowledge analysis only with authorized workspace evidence', () => {
    const depth = buildAnalysisDepth(['USAGE_CSV', 'AUTHORIZED_WORKSPACE']);

    expect(depth.level).toBe(3);
    expect(depth.capabilities).toContain('KNOWLEDGE_RETRIEVAL');
    expect(depth.capabilities).not.toContain('CONTINUOUS_VERIFICATION');
  });

  it('reserves continuous verification for production telemetry', () => {
    const depth = buildAnalysisDepth(['USAGE_CSV', 'PRODUCTION_TELEMETRY']);

    expect(depth.level).toBe(4);
    expect(depth.capabilities).toContain('COST_PER_SUCCESSFUL_OUTCOME');
    expect(depth.capabilities).toContain('CONTINUOUS_VERIFICATION');
    expect(depth.missingForNextLevel).toEqual([]);
  });
});
