import type { FounderDashboardView } from './dashboard-view.js';

export type EvalomicsAiAction = Readonly<{
  label: string;
  href: string;
}>;

export type EvalomicsAiAnswer = Readonly<{
  answer: string;
  facts: readonly string[];
  action: EvalomicsAiAction | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}>;

function money(
  value: Readonly<{ amount: string; currency: string }> | null,
): string {
  return value === null ? 'unavailable' : value.currency + ' ' + value.amount;
}

function estimatedSaving(view: FounderDashboardView): string | null {
  const aggregate = view.nonOverlappingModeledTotal;
  if (aggregate !== null) {
    return aggregate.currency + ' ' + aggregate.base;
  }

  const action = view.bestFirstMove;
  if (action?.modeledRange !== null && action?.modeledRange !== undefined) {
    return action.modeledRange.currency + ' ' + action.modeledRange.base;
  }

  if (action?.saving !== null && action?.saving !== undefined) {
    return action.saving.currency + ' ' + action.saving.amount;
  }

  return null;
}

function evaluationStatus(view: FounderDashboardView): string {
  const action = view.bestFirstMove;
  if (view.verifiedNetSavings !== null) return 'PROVEN';
  if (action === null) return 'ANALYZING';
  if (action.decision === 'DO_NOT_CHANGE') return 'KEEP_CURRENT';
  if (action.state === 'TESTED' && action.decision === 'OPTIMIZE') {
    return 'READY_TO_OPTIMIZE';
  }
  if (action.state === 'TESTED') return 'EVALUATED';
  return 'CANDIDATE_IDENTIFIED';
}

function normalizedQuestion(question: string): string {
  return question.trim().toLowerCase();
}

export function answerEvalomicsQuestion(
  view: FounderDashboardView,
  organizationId: string,
  question: string,
): EvalomicsAiAnswer {
  const q = normalizedQuestion(question);
  const action = view.bestFirstMove;
  const estimate = estimatedSaving(view);
  const status = evaluationStatus(view);
  const spend = money(view.observedSpend);

  if (
    q.includes('what should') ||
    q.includes('optimize first') ||
    q.includes('biggest') ||
    q.includes('recommend')
  ) {
    if (action === null) {
      return Object.freeze({
        answer:
          'Evalomics does not have enough supported evidence to recommend a production change yet. The next useful step is to add or refresh usage evidence so the optimizer can rank a candidate.',
        facts: Object.freeze([
          'Observed spend: ' + spend,
          'Supported opportunities: 0',
          'Evaluation status: ' + status,
        ]),
        action: Object.freeze({
          label: 'Add usage evidence',
          href: '/o/' + organizationId + '/import',
        }),
        confidence: 'HIGH',
      });
    }

    return Object.freeze({
      answer:
        'Your highest-priority supported action is “' +
        action.title +
        '”. Evalomics selected it from the current evidence and recommends: ' +
        action.nextAction,
      facts: Object.freeze([
        'Detection confidence: ' + action.detectionConfidence,
        'Evidence state: ' + action.state,
        'Estimated saving: ' + (estimate ?? 'pending evaluation'),
      ]),
      action: Object.freeze({
        label: 'Open recommendation',
        href: '/o/' + organizationId + '/recommendations',
      }),
      confidence: action.detectionConfidence,
    });
  }

  if (
    q.includes('saving') ||
    q.includes('how much') ||
    q.includes('cost reduction') ||
    q.includes('upside')
  ) {
    return Object.freeze({
      answer:
        estimate === null
          ? 'Evalomics has identified the optimization evidence, but it does not yet have enough comparable evidence to publish a responsible savings estimate. The estimate will appear after the candidate economics are supported.'
          : 'Evalomics currently supports an estimated saving of ' +
            estimate +
            ' for the selected evidence window. This is shown separately from production-proven savings so the estimate remains useful without being overstated.',
      facts: Object.freeze([
        'Observed spend: ' + spend,
        'Estimated saving: ' + (estimate ?? 'pending evaluation'),
        'Evaluation status: ' + status,
      ]),
      action: Object.freeze({
        label: 'Review opportunity',
        href: '/o/' + organizationId + '/recommendations',
      }),
      confidence:
        action?.savingsConfidence === 'VERIFIED' ||
        action?.savingsConfidence === 'TESTED'
          ? 'HIGH'
          : action?.savingsConfidence === 'MODELED'
            ? 'MEDIUM'
            : 'LOW',
    });
  }

  if (
    q.includes('why') &&
    (q.includes('spend') || q.includes('cost') || q.includes('expensive'))
  ) {
    const facts = view.diagnosticFacts.slice(0, 4).map(
      (fact) => fact.label + ': ' + fact.value,
    );
    return Object.freeze({
      answer:
        facts.length === 0
          ? 'Evalomics can confirm the observed spend, but this source does not expose enough diagnostic dimensions to explain the main cost driver yet.'
          : 'The strongest cost signals in this evidence window are listed below. Evalomics uses these measured facts to decide which optimization hypotheses are worth evaluating.',
      facts: Object.freeze(['Observed spend: ' + spend, ...facts]),
      action: Object.freeze({
        label: 'Open usage evidence',
        href: '/o/' + organizationId + '/import',
      }),
      confidence: facts.length > 0 ? 'HIGH' : 'LOW',
    });
  }

  if (
    q.includes('verified') ||
    q.includes('proven') ||
    q.includes('trust') ||
    q.includes('evidence')
  ) {
    return Object.freeze({
      answer:
        status === 'PROVEN'
          ? 'This workspace has production evidence supporting a proven result. Evalomics still keeps the calculation trail available so the claim can be inspected.'
          : 'You do not need to wait for production proof to get value. Evalomics first identifies and evaluates an optimization using observed evidence. “Proven” is the final post-change confirmation, not a prerequisite for receiving a recommendation.',
      facts: Object.freeze([
        'Evaluation status: ' + status.replaceAll('_', ' '),
        'Current recommendation: ' + (action?.title ?? 'none yet'),
        'Estimated saving: ' + (estimate ?? 'pending evaluation'),
      ]),
      action: Object.freeze({
        label: 'View evidence trail',
        href: '/o/' + organizationId + '/proof',
      }),
      confidence: 'HIGH',
    });
  }

  if (
    q.includes('implement') ||
    q.includes('how do i change') ||
    q.includes('how to change') ||
    q.includes('apply')
  ) {
    return Object.freeze({
      answer:
        action === null
          ? 'There is no supported implementation change yet. Evalomics will only give implementation guidance after it has identified a candidate from your evidence.'
          : 'For “' +
            action.title +
            '”, the current next action is: ' +
            action.nextAction +
            (action.state === 'TESTED' && action.decision === 'OPTIMIZE'
              ? ' The candidate has passed the configured evaluation gate and is ready for a staged rollout.'
              : ' Evalomics will keep the recommendation separate from production proof until the change is actually deployed.'),
      facts: Object.freeze([
        'Evaluation status: ' + status.replaceAll('_', ' '),
        'Detection confidence: ' + (action?.detectionConfidence ?? 'n/a'),
        'Savings confidence: ' + (action?.savingsConfidence ?? 'n/a'),
      ]),
      action: Object.freeze({
        label: 'Open implementation path',
        href:
          action?.state === 'TESTED' && action.decision === 'OPTIMIZE'
            ? '/o/' +
              organizationId +
              '/implement/' +
              action.recommendationId
            : '/o/' + organizationId + '/recommendations',
      }),
      confidence: action?.detectionConfidence ?? 'LOW',
    });
  }

  if (
    q.includes('what is evalomics') ||
    q.includes('how does evalomics') ||
    q.includes('what does this product')
  ) {
    return Object.freeze({
      answer:
        'Evalomics is an AI efficiency decision system. It analyzes usage and cost evidence, detects optimization opportunities, evaluates candidates against cost/quality/performance constraints when comparable evidence is available, gives implementation guidance, and later reconciles production results.',
      facts: Object.freeze([
        'Observed evidence stays separate from estimates.',
        'Candidate evaluation stays separate from production proof.',
        'Financial claims come from deterministic Evalomics calculations, not generated text.',
      ]),
      action: null,
      confidence: 'HIGH',
    });
  }

  return Object.freeze({
    answer:
      action === null
        ? 'I can explain this workspace, but the most useful next step is to load enough usage evidence for Evalomics to identify and rank an optimization.'
        : 'The main result in this workspace is “' +
          action.title +
          '”. Ask me why it was selected, how much it may save, how to implement it, or what evidence supports it.',
    facts: Object.freeze([
      'Observed spend: ' + spend,
      'Opportunities: ' + String(view.recommendations.length),
      'Evaluation status: ' + status.replaceAll('_', ' '),
    ]),
    action:
      action === null
        ? Object.freeze({
            label: 'Add usage evidence',
            href: '/o/' + organizationId + '/import',
          })
        : Object.freeze({
            label: 'Review recommendation',
            href: '/o/' + organizationId + '/recommendations',
          }),
    confidence: 'MEDIUM',
  });
}

export function dashboardEstimatedSaving(
  view: FounderDashboardView,
): string | null {
  return estimatedSaving(view);
}

export function dashboardEvaluationStatus(
  view: FounderDashboardView,
): 'PROVEN' | 'ANALYZING' | 'KEEP_CURRENT' | 'READY_TO_OPTIMIZE' | 'EVALUATED' | 'CANDIDATE_IDENTIFIED' {
  return evaluationStatus(view) as
    | 'PROVEN'
    | 'ANALYZING'
    | 'KEEP_CURRENT'
    | 'READY_TO_OPTIMIZE'
    | 'EVALUATED'
    | 'CANDIDATE_IDENTIFIED';
}
