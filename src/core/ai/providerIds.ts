export const AI_PROVIDER_IDS = ['mistral', 'openai', 'anthropic'] as const;

export type AIProviderId = (typeof AI_PROVIDER_IDS)[number];

const PROVIDER_ALIAS_MAP: Record<string, AIProviderId> = {
  mistral: 'mistral',
  mistralai: 'mistral',
  openai: 'openai',
  gpt: 'openai',
  anthropic: 'anthropic',
  claude: 'anthropic',
};

export const normalizeAIProviderId = (value: string | null | undefined): AIProviderId | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return PROVIDER_ALIAS_MAP[normalized] || null;
};

export const isAIProviderId = (value: string): value is AIProviderId => {
  return AI_PROVIDER_IDS.includes(value as AIProviderId);
};

