export type ProviderEvidenceSource =
  | 'OPENAI_ADMIN_API'
  | 'ANTHROPIC_ADMIN_API';

export type ProviderUsageEvidence = Readonly<{
  source: ProviderEvidenceSource;
  provider: 'openai' | 'anthropic';
  organizationId: string;
  intervalStart: string;
  intervalEnd: string;
  requests: string;
  inputTokens: string;
  outputTokens: string;
  cachedInputTokens: string;
  model: string | null;
  projectId: string | null;
  apiKeyId: string | null;
  fingerprint: string;
}>;

export type ProviderCostEvidence = Readonly<{
  source: ProviderEvidenceSource;
  provider: 'openai' | 'anthropic';
  organizationId: string;
  intervalStart: string;
  intervalEnd: string;
  amount: string;
  currency: string;
  projectId: string | null;
  description: string | null;
  fingerprint: string;
}>;

export type NormalizedProviderEvidence = Readonly<{
  usage: readonly ProviderUsageEvidence[];
  costs: readonly ProviderCostEvidence[];
}>;
