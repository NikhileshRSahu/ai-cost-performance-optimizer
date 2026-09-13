export type DetectorStatus = 'FINDING' | 'NO_FINDING' | 'INSUFFICIENT_EVIDENCE';

export type FindingType =
  | 'EXCESSIVE_OUTPUT'
  | 'RETRY_REPEATED_CALL'
  | 'PROMPT_CACHING'
  | 'MODEL_RIGHT_SIZING'
  | 'COST_ANOMALY';

export type DetectorFinding = Readonly<{
  id: string;
  type: FindingType;
  measuredFacts: Readonly<Record<string, string>>;
  inference: string;
  recommendation: string;
  notClaimed: string;
}>;

export type DetectorResult = Readonly<{
  status: DetectorStatus;
  finding: DetectorFinding | null;
  reasons: readonly string[];
}>;
