export type EvidenceSourceKind =
  | 'USAGE_CSV'
  | 'PROVIDER_ADMIN_USAGE'
  | 'SANITIZED_AI_EXPORT'
  | 'AUTHORIZED_WORKSPACE'
  | 'PRODUCTION_TELEMETRY';

export type AnalysisCapability =
  | 'COST_EFFICIENCY'
  | 'MODEL_RIGHT_SIZING'
  | 'RETRY_WASTE'
  | 'TOKEN_OUTPUT_WASTE'
  | 'PROMPT_STRUCTURE'
  | 'REPEATED_CONTEXT'
  | 'WORKFLOW_AUTOMATION'
  | 'KNOWLEDGE_RETRIEVAL'
  | 'COST_PER_SUCCESSFUL_OUTCOME'
  | 'CONTINUOUS_VERIFICATION';

export type AnalysisDepthLevel = 1 | 2 | 3 | 4;

export type AnalysisDepth = Readonly<{
  level: AnalysisDepthLevel;
  label:
    | 'Usage evidence'
    | 'Content-assisted evidence'
    | 'Authorized workspace evidence'
    | 'Continuous production evidence';
  capabilities: readonly AnalysisCapability[];
  missingForNextLevel: readonly EvidenceSourceKind[];
}>;

export type EfficiencyEvidenceBoundary = Readonly<{
  sources: readonly EvidenceSourceKind[];
  depth: AnalysisDepth;
}>;
