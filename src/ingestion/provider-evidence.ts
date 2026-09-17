export type ProviderEvidenceSource =
  | 'OPENAI_ADMIN_API'
  | 'ANTHROPIC_ADMIN_API';

export type ProviderName = 'openai' | 'anthropic';
export type ProviderCostAmountUnit = 'MAJOR' | 'LOWEST';

export type ProviderUsageEvidence = Readonly<{
  source: ProviderEvidenceSource;
  provider: ProviderName;
  organizationId: string;
  intervalStart: string;
  intervalEnd: string;
  requests: string | null;
  inputTokens: string;
  uncachedInputTokens: string | null;
  cachedInputTokens: string;
  cacheWriteTokens: string;
  outputTokens: string;
  model: string | null;
  projectId: string | null;
  workspaceId: string | null;
  apiKeyId: string | null;
  serviceTier: string | null;
  fingerprint: string;
}>;

export type ProviderCostEvidence = Readonly<{
  source: ProviderEvidenceSource;
  provider: ProviderName;
  organizationId: string;
  intervalStart: string;
  intervalEnd: string;
  amount: string;
  amountUnit: ProviderCostAmountUnit;
  currency: string;
  projectId: string | null;
  workspaceId: string | null;
  model: string | null;
  description: string | null;
  serviceTier: string | null;
  tokenType: string | null;
  coverageLimitation: string | null;
  fingerprint: string;
}>;

export type NormalizedProviderEvidence = Readonly<{
  usage: readonly ProviderUsageEvidence[];
  costs: readonly ProviderCostEvidence[];
}>;
