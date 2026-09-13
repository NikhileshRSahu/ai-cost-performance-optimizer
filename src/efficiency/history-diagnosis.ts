import { createHash } from 'node:crypto';
import type {
  SanitizedAiExport,
  SanitizedAiMessage,
} from './history-contracts.js';

export type PromptStructureSignal =
  | 'LOW_CONTEXT'
  | 'NO_EXPLICIT_CONSTRAINT_LANGUAGE'
  | 'NO_EXPLICIT_OUTPUT_SHAPE';

export type PromptStructureFinding = Readonly<{
  signal: PromptStructureSignal;
  affectedPrompts: number;
  promptShareNumerator: number;
  promptShareDenominator: number;
  interpretation: string;
  advice: string;
}>;

export type RepeatedPromptPattern = Readonly<{
  fingerprint: string;
  occurrences: number;
  charactersPerOccurrence: number;
  avoidableRepeatedCharactersAfterFirst: number;
  automationCandidate: boolean;
}>;

export type SanitizedHistoryDiagnosis = Readonly<{
  messagesAnalyzed: number;
  userPromptsAnalyzed: number;
  conversationsAnalyzed: number;
  repeatedPromptPatterns: readonly RepeatedPromptPattern[];
  promptStructureFindings: readonly PromptStructureFinding[];
  limitations: readonly string[];
}>;

function normalizedText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function fingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function userPrompts(
  messages: readonly SanitizedAiMessage[],
): SanitizedAiMessage[] {
  return messages.filter((message) => message.role === 'USER');
}

function hasConstraintLanguage(value: string): boolean {
  return /\b(must|should|avoid|do not|don't|limit|maximum|minimum|under|at least|only|never|required|constraint|criteria)\b/i.test(
    value,
  );
}

function hasOutputShapeLanguage(value: string): boolean {
  return /\b(json|table|bullet|bullets|list|format|schema|csv|markdown|paragraph|steps?|columns?|fields?|output)\b/i.test(
    value,
  );
}

function structureFinding(
  signal: PromptStructureSignal,
  affectedPrompts: number,
  totalPrompts: number,
  interpretation: string,
  advice: string,
): PromptStructureFinding {
  return Object.freeze({
    signal,
    affectedPrompts,
    promptShareNumerator: affectedPrompts,
    promptShareDenominator: totalPrompts,
    interpretation,
    advice,
  });
}

export function diagnoseSanitizedHistory(
  input: Readonly<{
    export: SanitizedAiExport;
    minimumRepeatCharacters?: number;
    automationOccurrenceThreshold?: number;
  }>,
): SanitizedHistoryDiagnosis {
  const prompts = userPrompts(input.export.messages);
  const minimumRepeatCharacters = input.minimumRepeatCharacters ?? 80;
  const automationOccurrenceThreshold =
    input.automationOccurrenceThreshold ?? 3;
  const groups = new Map<string, { occurrences: number; characters: number }>();

  for (const prompt of prompts) {
    const normalized = normalizedText(prompt.content);
    if (normalized.length < minimumRepeatCharacters) continue;
    const key = fingerprint(normalized);
    const current = groups.get(key);
    groups.set(key, {
      occurrences: (current?.occurrences ?? 0) + 1,
      characters: normalized.length,
    });
  }

  const repeatedPromptPatterns = [...groups.entries()]
    .filter(([, value]) => value.occurrences >= 2)
    .map(([key, value]) =>
      Object.freeze({
        fingerprint: key,
        occurrences: value.occurrences,
        charactersPerOccurrence: value.characters,
        avoidableRepeatedCharactersAfterFirst:
          value.characters * (value.occurrences - 1),
        automationCandidate: value.occurrences >= automationOccurrenceThreshold,
      }),
    )
    .sort(
      (a, b) =>
        b.avoidableRepeatedCharactersAfterFirst -
        a.avoidableRepeatedCharactersAfterFirst,
    );

  const findings: PromptStructureFinding[] = [];
  if (prompts.length > 0) {
    const lowContext = prompts.filter(
      (prompt) => normalizedText(prompt.content).length < 40,
    ).length;
    const noConstraintLanguage = prompts.filter(
      (prompt) => !hasConstraintLanguage(prompt.content),
    ).length;
    const noOutputShape = prompts.filter(
      (prompt) => !hasOutputShapeLanguage(prompt.content),
    ).length;

    if (lowContext > 0) {
      findings.push(
        structureFinding(
          'LOW_CONTEXT',
          lowContext,
          prompts.length,
          'These prompts are short enough that they may depend heavily on prior conversational context.',
          'For recurring work, test a reusable task template that states the goal and required context explicitly.',
        ),
      );
    }

    if (noConstraintLanguage > 0) {
      findings.push(
        structureFinding(
          'NO_EXPLICIT_CONSTRAINT_LANGUAGE',
          noConstraintLanguage,
          prompts.length,
          'No explicit constraint language was detected in these prompts.',
          'For important recurring tasks, test adding acceptance criteria, boundaries, or failure conditions instead of relying on implied expectations.',
        ),
      );
    }

    if (noOutputShape > 0) {
      findings.push(
        structureFinding(
          'NO_EXPLICIT_OUTPUT_SHAPE',
          noOutputShape,
          prompts.length,
          'No explicit output-shape language was detected in these prompts.',
          'When downstream use benefits from consistency, test an explicit output structure such as required fields, bullets, a table, or a schema.',
        ),
      );
    }
  }

  const limitations = [
    'Prompt-structure findings are deterministic heuristics, not a universal score of prompt quality.',
    'Exact-repeat detection does not claim that semantically similar wording is duplicated.',
    'Repeated text is not automatically waste; automation or templating should be tested against the real task.',
  ];

  return Object.freeze({
    messagesAnalyzed: input.export.messages.length,
    userPromptsAnalyzed: prompts.length,
    conversationsAnalyzed: new Set(
      input.export.messages.map((message) => message.conversationId),
    ).size,
    repeatedPromptPatterns: Object.freeze(repeatedPromptPatterns),
    promptStructureFindings: Object.freeze(findings),
    limitations: Object.freeze(limitations),
  });
}
