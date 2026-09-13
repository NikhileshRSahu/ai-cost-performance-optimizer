import type {
  AnalysisCapability,
  AnalysisDepth,
  AnalysisDepthLevel,
  EvidenceSourceKind,
} from './contracts.js';

function capabilityList(
  ...values: AnalysisCapability[]
): readonly AnalysisCapability[] {
  return Object.freeze(values);
}

const LEVEL_CAPABILITIES: Readonly<
  Record<AnalysisDepthLevel, readonly AnalysisCapability[]>
> = Object.freeze({
  1: capabilityList(
    'COST_EFFICIENCY',
    'MODEL_RIGHT_SIZING',
    'RETRY_WASTE',
    'TOKEN_OUTPUT_WASTE',
  ),
  2: capabilityList(
    'COST_EFFICIENCY',
    'MODEL_RIGHT_SIZING',
    'RETRY_WASTE',
    'TOKEN_OUTPUT_WASTE',
    'PROMPT_STRUCTURE',
    'REPEATED_CONTEXT',
    'WORKFLOW_AUTOMATION',
  ),
  3: capabilityList(
    'COST_EFFICIENCY',
    'MODEL_RIGHT_SIZING',
    'RETRY_WASTE',
    'TOKEN_OUTPUT_WASTE',
    'PROMPT_STRUCTURE',
    'REPEATED_CONTEXT',
    'WORKFLOW_AUTOMATION',
    'KNOWLEDGE_RETRIEVAL',
  ),
  4: capabilityList(
    'COST_EFFICIENCY',
    'MODEL_RIGHT_SIZING',
    'RETRY_WASTE',
    'TOKEN_OUTPUT_WASTE',
    'PROMPT_STRUCTURE',
    'REPEATED_CONTEXT',
    'WORKFLOW_AUTOMATION',
    'KNOWLEDGE_RETRIEVAL',
    'COST_PER_SUCCESSFUL_OUTCOME',
    'CONTINUOUS_VERIFICATION',
  ),
});

function deriveLevel(
  sources: ReadonlySet<EvidenceSourceKind>,
): AnalysisDepthLevel {
  if (sources.has('PRODUCTION_TELEMETRY')) return 4;
  if (sources.has('AUTHORIZED_WORKSPACE')) return 3;
  if (sources.has('SANITIZED_AI_EXPORT')) return 2;
  return 1;
}

function labelFor(level: AnalysisDepthLevel): AnalysisDepth['label'] {
  switch (level) {
    case 1:
      return 'Usage evidence';
    case 2:
      return 'Content-assisted evidence';
    case 3:
      return 'Authorized workspace evidence';
    case 4:
      return 'Continuous production evidence';
  }
}

function missingForNextLevel(
  level: AnalysisDepthLevel,
): readonly EvidenceSourceKind[] {
  switch (level) {
    case 1:
      return capabilityList('SANITIZED_AI_EXPORT']);
    case 2:
      return capabilityList('AUTHORIZED_WORKSPACE']);
    case 3:
      return capabilityList('PRODUCTION_TELEMETRY']);
    case 4:
      return capabilityList(]);
  }
}

export function buildAnalysisDepth(
  inputSources: readonly EvidenceSourceKind[],
): AnalysisDepth {
  const sources = new Set<EvidenceSourceKind>(inputSources);
  const level = deriveLevel(sources);

  return Object.freeze({
    level,
    label: labelFor(level),
    capabilities: LEVEL_CAPABILITIES[level],
    missingForNextLevel: missingForNextLevel(level),
  });
}
