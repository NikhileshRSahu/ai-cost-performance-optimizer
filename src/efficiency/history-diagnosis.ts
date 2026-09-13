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

export type NearDuplicatePromptPattern = Readonly<{
  leftFingerprint: string;
  rightFingerprint: string;
  similarityNumerator: number;
  similarityDenominator: number;
  sharedTokenCount: number;
  unionTokenCount: number;
  automationCandidate: boolean;
}>;

export type SanitizedHistoryDiagnosis = Readonly<{
  messagesAnalyzed: number;
  userPromptsAnalyzed: number;
  conversationsAnalyzed: number;
  repeatedPromptPatterns: readonly RepeatedPromptPattern[];
  nearDuplicatePromptPatterns: readonly NearDuplicatePromptPattern[];
  similarityPromptsConsidered: number;
  similarityComparisonCapped: boolean;
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

function tokenSet(value: string): ReadonlySet<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  );
}

function jaccard(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): Readonly<{ shared: number; union: number }> {
  if (left.size === 0 && right.size === 0) {
    return Object.freeze({ shared: 0, union: 0 });
  }

  let shared = 0;
  for (const token of left) {
    if (right.has(token)) shared += 1;
  }

  return Object.freeze({
    shared,
    union: left.size + right.size - shared,
  });
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

function nearDuplicatePatterns(
  prompts: readonly SanitizedAiMessage[],
  input: Readonly<{
    minimumCharacters: number;
    threshold: number;
    maximumPrompts: number;
    maximumResults: number;
  }>,
): Readonly<{
  patterns: readonly NearDuplicatePromptPattern[];
  promptsConsidered: number;
  capped: boolean;
}> {
  const candidates = prompts
    .map((prompt) => {
      const normalized = normalizedText(prompt.content);
      return Object.freeze({
        fingerprint: fingerprint(normalized),
        normalized,
        tokens: tokenSet(normalized),
      });
    })
    .filter(
      (candidate) =>
        candidate.normalized.length >= input.minimumCharacters &&
        candidate.tokens.size >= 3,
    )
    .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));

  const capped = candidates.length > input.maximumPrompts;
  const considered = candidates.slice(0, input.maximumPrompts);
  const patterns: NearDuplicatePromptPattern[] = [];

  for (let leftIndex = 0; leftIndex < considered.length; leftIndex += 1) {
    const left = considered[leftIndex];
    if (left === undefined) continue;

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < considered.length;
      rightIndex += 1
    ) {
      const right = considered[rightIndex];
      if (right === undefined) continue;
      if (left.fingerprint === right.fingerprint) continue;

      const similarity = jaccard(left.tokens, right.tokens);
      if (similarity.union === 0) continue;
      if (similarity.shared / similarity.union < input.threshold) continue;

      patterns.push(
        Object.freeze({
          leftFingerprint: left.fingerprint,
          rightFingerprint: right.fingerprint,
          similarityNumerator: similarity.shared,
          similarityDenominator: similarity.union,
          sharedTokenCount: similarity.shared,
          unionTokenCount: similarity.union,
          automationCandidate:
            similarity.shared >= 6 &&
            similarity.shared / similarity.union >= Math.max(0.8, input.threshold),
        }),
      );
    }
  }

  patterns.sort((a, b) => {
    const leftScore =
      a.similarityNumerator * b.similarityDenominator -
      b.similarityNumerator * a.similarityDenominator;
    if (leftScore !== 0) return -leftScore;
    return a.leftFingerprint.localeCompare(b.leftFingerprint);
  });

  return Object.freeze({
    patterns: Object.freeze(patterns.slice(0, input.maximumResults)),
    promptsConsidered: considered.length,
    capped,
  });
}

export function diagnoseSanitizedHistory(
  input: Readonly<{
    export: SanitizedAiExport;
    minimumRepeatCharacters?: number;
    automationOccurrenceThreshold?: number;
    nearDuplicateThreshold?: number;
    maximumSimilarityPrompts?: number;
    maximumNearDuplicateResults?: number;
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

  const nearDuplicates = nearDuplicatePatterns(prompts, {
    minimumCharacters: minimumRepeatCharacters,
    threshold: input.nearDuplicateThreshold ?? 0.72,
    maximumPrompts: input.maximumSimilarityPrompts ?? 500,
    maximumResults: input.maximumNearDuplicateResults ?? 25,
  });

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
    'Near-duplicate detection uses bounded lexical token overlap, not embeddings or a semantic equivalence guarantee.',
    'Repeated or similar text is not automatically waste; automation or templating should be tested against the real task.',
    nearDuplicates.capped
      ? 'Near-duplicate comparison was capped for bounded runtime; the result is deterministic but not exhaustive for this export.'
      : 'Near-duplicate comparison covered every eligible prompt in this export.',
  ];

  return Object.freeze({
    messagesAnalyzed: input.export.messages.length,
    userPromptsAnalyzed: prompts.length,
    conversationsAnalyzed: new Set(
      input.export.messages.map((message) => message.conversationId),
    ).size,
    repeatedPromptPatterns: Object.freeze(repeatedPromptPatterns),
    nearDuplicatePromptPatterns: nearDuplicates.patterns,
    similarityPromptsConsidered: nearDuplicates.promptsConsidered,
    similarityComparisonCapped: nearDuplicates.capped,
    promptStructureFindings: Object.freeze(findings),
    limitations: Object.freeze(limitations),
  });
}
