import { createHash } from 'node:crypto';
import type { AnthropicAdminSnapshot } from './connectors/anthropic-admin.js';
import type { OpenAIAdminSnapshot } from './connectors/openai-admin.js';
import type {
  NormalizedProviderEvidence,
  ProviderCostEvidence,
  ProviderUsageEvidence,
} from './provider-evidence.js';

function fingerprint(value: Readonly<Record<string, unknown>>): string {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function requireOrganizationId(organizationId: string): void {
  if (organizationId.trim().length === 0) {
    throw new Error('ORGANIZATION_ID_REQUIRED');
  }
}

function sumIntegerStrings(...values: readonly string[]): string {
  return values.reduce((sum, value) => sum + BigInt(value), 0n).toString();
}

export function normalizeOpenAIAdminSnapshot(
  input: Readonly<{
    organizationId: string;
    snapshot: OpenAIAdminSnapshot;
  }>,
): NormalizedProviderEvidence {
  requireOrganizationId(input.organizationId);

  const usage: ProviderUsageEvidence[] = input.snapshot.usage.map((item) => {
    const canonical = Object.freeze({
      source: 'OPENAI_ADMIN_API' as const,
      provider: 'openai' as const,
      organizationId: input.organizationId,
      intervalStart: item.intervalStart,
      intervalEnd: item.intervalEnd,
      requests: item.requests,
      inputTokens: item.inputTokens,
      uncachedInputTokens: null,
      cachedInputTokens: item.inputCachedTokens,
      cacheWriteTokens: '0',
      outputTokens: item.outputTokens,
      model: item.model,
      projectId: item.projectId,
      workspaceId: null,
      apiKeyId: item.apiKeyId,
      serviceTier: item.serviceTier,
    });

    return Object.freeze({
      ...canonical,
      fingerprint: fingerprint(canonical),
    });
  });

  const costs: ProviderCostEvidence[] = input.snapshot.costs.map((item) => {
    const canonical = Object.freeze({
      source: 'OPENAI_ADMIN_API' as const,
      provider: 'openai' as const,
      organizationId: input.organizationId,
      intervalStart: item.intervalStart,
      intervalEnd: item.intervalEnd,
      amount: item.amount,
      amountUnit: 'MAJOR' as const,
      currency: item.currency,
      projectId: item.projectId,
      workspaceId: null,
      model: null,
      description: item.lineItem,
      serviceTier: null,
      tokenType: null,
      coverageLimitation: null,
    });

    return Object.freeze({
      ...canonical,
      fingerprint: fingerprint(canonical),
    });
  });

  return Object.freeze({
    usage: Object.freeze(usage),
    costs: Object.freeze(costs),
  });
}

export function normalizeAnthropicAdminSnapshot(
  input: Readonly<{
    organizationId: string;
    snapshot: AnthropicAdminSnapshot;
  }>,
): NormalizedProviderEvidence {
  requireOrganizationId(input.organizationId);

  const usage: ProviderUsageEvidence[] = input.snapshot.usage.map((item) => {
    const cacheWriteTokens = sumIntegerStrings(
      item.cacheCreationOneHourInputTokens,
      item.cacheCreationFiveMinuteInputTokens,
    );
    const totalInputTokens = sumIntegerStrings(
      item.uncachedInputTokens,
      item.cacheReadInputTokens,
      cacheWriteTokens,
    );
    const canonical = Object.freeze({
      source: 'ANTHROPIC_ADMIN_API' as const,
      provider: 'anthropic' as const,
      organizationId: input.organizationId,
      intervalStart: item.intervalStart,
      intervalEnd: item.intervalEnd,
      requests: null,
      inputTokens: totalInputTokens,
      uncachedInputTokens: item.uncachedInputTokens,
      cachedInputTokens: item.cacheReadInputTokens,
      cacheWriteTokens,
      outputTokens: item.outputTokens,
      model: item.model,
      projectId: null,
      workspaceId: item.workspaceId,
      apiKeyId: item.apiKeyId,
      serviceTier: item.serviceTier,
    });

    return Object.freeze({
      ...canonical,
      fingerprint: fingerprint(canonical),
    });
  });

  const costs: ProviderCostEvidence[] = input.snapshot.costs.map((item) => {
    const canonical = Object.freeze({
      source: 'ANTHROPIC_ADMIN_API' as const,
      provider: 'anthropic' as const,
      organizationId: input.organizationId,
      intervalStart: item.intervalStart,
      intervalEnd: item.intervalEnd,
      amount: item.amountLowestUnit,
      amountUnit: 'LOWEST' as const,
      currency: item.currency,
      projectId: null,
      workspaceId: item.workspaceId,
      model: item.model,
      description: item.description,
      serviceTier: item.serviceTier,
      tokenType: item.tokenType,
      coverageLimitation:
        'Priority Tier costs are not included in the Anthropic cost report.',
    });

    return Object.freeze({
      ...canonical,
      fingerprint: fingerprint(canonical),
    });
  });

  return Object.freeze({
    usage: Object.freeze(usage),
    costs: Object.freeze(costs),
  });
}
