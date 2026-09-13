import { describe, expect, it } from 'vitest';
import { diagnoseSanitizedHistory } from '../../src/efficiency/history-diagnosis.js';
import { sanitizedAiExportSchema } from '../../src/efficiency/history-contracts.js';

function parsed(messages: unknown[]) {
  return sanitizedAiExportSchema.parse({
    schemaVersion: 'sanitized-ai-export-v1',
    exportedAt: '2026-09-14T00:00:00Z',
    messages,
  });
}

function message(
  id: string,
  content: string,
  conversationId = 'conversation-1',
) {
  return {
    source: 'CHATGPT',
    conversationId,
    messageId: id,
    createdAt: '2026-09-14T00:00:00Z',
    role: 'USER',
    content,
    model: null,
  };
}

describe('sanitized AI history diagnosis', () => {
  it('detects exact repeated context without returning raw prompt text', () => {
    const content =
      'Analyze the attached weekly support metrics and return a table with root causes and the top three actions.';
    const result = diagnoseSanitizedHistory({
      export: parsed([
        message('m1', content),
        message('m2', content, 'conversation-2'),
        message('m3', content, 'conversation-3'),
      ]),
    });

    expect(result.repeatedPromptPatterns).toHaveLength(1);
    expect(result.repeatedPromptPatterns[0]?.occurrences).toBe(3);
    expect(result.repeatedPromptPatterns[0]?.automationCandidate).toBe(true);
    expect(
      JSON.stringify(result.repeatedPromptPatterns),
    ).not.toContain('Analyze the attached');
  });

  it('reports prompt-structure opportunities as heuristics rather than quality verdicts', () => {
    const result = diagnoseSanitizedHistory({
      export: parsed([message('m1', 'Help with this')]),
    });

    expect(result.promptStructureFindings.map((item) => item.signal)).toEqual([
      'LOW_CONTEXT',
      'NO_EXPLICIT_CONSTRAINT_LANGUAGE',
      'NO_EXPLICIT_OUTPUT_SHAPE',
    ]);
    expect(result.limitations.join(' ')).toContain(
      'not a universal score of prompt quality',
    );
  });

  it('does not call two exact repeats an automation candidate below the configured threshold', () => {
    const content =
      'Summarize this customer interview using the required product research template and list the strongest evidence.';
    const result = diagnoseSanitizedHistory({
      automationOccurrenceThreshold: 3,
      export: parsed([message('m1', content), message('m2', content)]),
    });

    expect(result.repeatedPromptPatterns[0]?.automationCandidate).toBe(false);
  });

  it('rejects unbounded or malformed content at the import contract', () => {
    expect(() =>
      parsed([
        {
          source: 'CHATGPT',
          conversationId: 'c1',
          messageId: 'm1',
          createdAt: 'not-a-date',
          role: 'USER',
          content: 'hello',
          model: null,
        },
      ]),
    ).toThrow();
  });
});
