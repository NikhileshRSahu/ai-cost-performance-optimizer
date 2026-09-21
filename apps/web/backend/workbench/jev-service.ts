export type JevWasteType =
  | 'MODEL_OVERKILL'
  | 'REPEATED_CONTEXT'
  | 'PROMPT_BLOAT'
  | 'CACHING_OPPORTUNITY'
  | 'NO_SIGNIFICANT_WASTE';

export type JevOptimization =
  | 'CHEAPER_MODEL'
  | 'PROMPT_CACHE'
  | 'SHORTEN_PROMPT'
  | 'BATCH_REQUESTS'
  | 'NO_CHANGE';

export type JevTriageResult = Readonly<{
  wasteType: JevWasteType;
  wasteConfidence: number;
  optimization: JevOptimization;
  optimizationConfidence: number;
  qualityRiskScore: number;
  shouldBenchmarkProbability: number;
}>;

type JevChoiceAnswer = Readonly<{
  type: 'choice';
  choice: string;
  confidence?: number;
  probabilities?: Readonly<Record<string, number>>;
}>;

type JevScoreAnswer = Readonly<{
  type: 'score';
  score: number;
  probabilities?: Readonly<Record<string, number>>;
}>;

type JevNoulAnswer = Readonly<{
  type: 'noul';
  noul: number;
}>;

type JevApiResponse = Readonly<{
  answers?: Readonly<Record<string, JevChoiceAnswer | JevScoreAnswer | JevNoulAnswer>>;
}>;

export function jevConfigured(): boolean {
  return (
    process.env.JEV_ENABLED === 'true' &&
    typeof process.env.JEV_API_KEY === 'string' &&
    process.env.JEV_API_KEY.length > 0 &&
    typeof process.env.JEV_API_URL === 'string' &&
    process.env.JEV_API_URL.length > 0
  );
}

function probabilityFor(answer: JevChoiceAnswer): number {
  if (typeof answer.confidence === 'number') return answer.confidence;
  const probability = answer.probabilities?.[answer.choice];
  return typeof probability === 'number' ? probability : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function parseResult(payload: JevApiResponse): JevTriageResult {
  const answers = payload.answers;
  if (answers === undefined) throw new Error('JEV_INVALID_RESPONSE');

  const waste = answers.waste_type;
  const optimization = answers.best_optimization;
  const risk = answers.quality_risk;
  const benchmark = answers.benchmark_required;

  if (waste?.type !== 'choice') throw new Error('JEV_WASTE_TYPE_MISSING');
  if (optimization?.type !== 'choice') {
    throw new Error('JEV_OPTIMIZATION_MISSING');
  }
  if (risk?.type !== 'score') throw new Error('JEV_RISK_SCORE_MISSING');
  if (benchmark?.type !== 'noul') {
    throw new Error('JEV_BENCHMARK_GATE_MISSING');
  }

  return Object.freeze({
    wasteType: waste.choice as JevWasteType,
    wasteConfidence: clamp01(probabilityFor(waste)),
    optimization: optimization.choice as JevOptimization,
    optimizationConfidence: clamp01(probabilityFor(optimization)),
    qualityRiskScore: risk.score,
    shouldBenchmarkProbability: clamp01(benchmark.noul),
  });
}

/**
 * Cheap decision layer for Evalomics.
 *
 * Jev does NOT calculate money, token costs, savings, or final evidence state.
 * Those remain deterministic Evalomics calculations. Jev only triages:
 *   1. likely waste type,
 *   2. best optimization hypothesis,
 *   3. quality risk,
 *   4. whether Counterfactual Replay / benchmark is worth running.
 *
 * Returns null when Jev is disabled or unconfigured, so existing Evalomics
 * behavior remains unchanged and no API spend can occur accidentally.
 */
export async function triageWithJev(
  state: Readonly<Record<string, unknown>>,
): Promise<JevTriageResult | null> {
  if (!jevConfigured()) return null;

  const response = await fetch(process.env.JEV_API_URL!, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.JEV_API_KEY!}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.JEV_MODEL ?? 'jev-latest',
      state,
      questions: {
        waste_type: {
          type: 'choice',
          instructions:
            'Classify the dominant AI-efficiency issue. Choose NO_SIGNIFICANT_WASTE when evidence is insufficient.',
          criteria: {
            MODEL_OVERKILL:
              'The workload appears simpler than the current model capability/cost.',
            REPEATED_CONTEXT:
              'Large or recurring context is repeatedly sent without reuse.',
            PROMPT_BLOAT:
              'Prompt/context contains unnecessary material that can likely be reduced.',
            CACHING_OPPORTUNITY:
              'Stable repeated context is a strong candidate for provider prompt caching.',
            NO_SIGNIFICANT_WASTE:
              'No sufficiently supported inefficiency is visible from the supplied evidence.',
          },
        },
        best_optimization: {
          type: 'choice',
          instructions:
            'Choose the first optimization hypothesis Evalomics should investigate. Prefer NO_CHANGE when evidence is weak.',
          criteria: {
            CHEAPER_MODEL: 'Test a less expensive model against the same quality floor.',
            PROMPT_CACHE: 'Use provider prompt/context caching where supported.',
            SHORTEN_PROMPT: 'Reduce unnecessary prompt/context tokens.',
            BATCH_REQUESTS: 'Batch compatible requests to reduce repeated overhead.',
            NO_CHANGE: 'Do not recommend a change from this evidence alone.',
          },
        },
        quality_risk: {
          type: 'score',
          instructions:
            'Score the likely quality risk of applying the selected optimization. 1 is very low risk; 10 is very high risk.',
          min: 1,
          max: 10,
        },
        benchmark_required: {
          type: 'noul',
          instructions:
            'Return the probability that Evalomics should run Counterfactual Replay or a benchmark before recommending a production change.',
        },
      },
    }),
    signal: AbortSignal.timeout(4000),
  });

  if (!response.ok) {
    throw new Error(`JEV_REQUEST_FAILED_${response.status}`);
  }

  return parseResult((await response.json()) as JevApiResponse);
}
