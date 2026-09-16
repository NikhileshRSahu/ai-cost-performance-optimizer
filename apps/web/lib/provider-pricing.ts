export type ProviderPricingPreset = Readonly<{
  id: string;
  label: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google';
  model: string;
  inputPerMillionUsd: string;
  outputPerMillionUsd: string;
  asOf: string;
  sourceUrl: string;
  note: string;
}>;

export const providerPricingPresets: readonly ProviderPricingPreset[] =
  Object.freeze([
    {
      id: 'openai-gpt-5.6-sol-standard',
      label: 'OpenAI · GPT-5.6 Sol · Standard',
      provider: 'OpenAI',
      model: 'GPT-5.6 Sol',
      inputPerMillionUsd: '4',
      outputPerMillionUsd: '20',
      asOf: '2026-09-16',
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
      note: 'Promotional standard pricing; OpenAI states it is available at least through 2026-11-21. Long-context, cached, batch, fast, tools, and regional pricing can differ.',
    },
    {
      id: 'anthropic-claude-sonnet-5-standard',
      label: 'Anthropic · Claude Sonnet 5 · Standard',
      provider: 'Anthropic',
      model: 'Claude Sonnet 5',
      inputPerMillionUsd: '2',
      outputPerMillionUsd: '10',
      asOf: '2026-09-16',
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      note: 'Base input/output pricing only. Cache writes, cache reads, fast mode, batch, data residency, and cloud-platform pricing can differ.',
    },
    {
      id: 'anthropic-claude-opus-5-standard',
      label: 'Anthropic · Claude Opus 5 · Standard',
      provider: 'Anthropic',
      model: 'Claude Opus 5',
      inputPerMillionUsd: '5',
      outputPerMillionUsd: '25',
      asOf: '2026-09-16',
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      note: 'Base input/output pricing only. Cache writes, cache reads, fast mode, batch, data residency, and cloud-platform pricing can differ.',
    },
    {
      id: 'google-gemini-3.6-flash-standard',
      label: 'Google · Gemini 3.6 Flash · Standard',
      provider: 'Google',
      model: 'Gemini 3.6 Flash',
      inputPerMillionUsd: '0.75',
      outputPerMillionUsd: '3.75',
      asOf: '2026-09-16',
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      note: 'Paid standard pricing through 2026-12-31. Google documents higher pricing beginning 2027-01-01; caching and grounding are separate.',
    },
    {
      id: 'google-gemini-3.5-flash-lite-standard',
      label: 'Google · Gemini 3.5 Flash-Lite · Standard',
      provider: 'Google',
      model: 'Gemini 3.5 Flash-Lite',
      inputPerMillionUsd: '0.30',
      outputPerMillionUsd: '2.50',
      asOf: '2026-09-16',
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      note: 'Paid standard text/image/video/audio input pricing and output pricing; caching and grounding are separate.',
    },
  ]);
