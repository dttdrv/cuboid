import { ModelCapabilities } from './types';

const STORAGE_KEY = 'cuboid_ai_capabilities';
const TTL_MS = 12 * 60 * 60 * 1000;

type CapabilityStore = Record<string, ModelCapabilities>;

const nowIso = () => new Date().toISOString();

const defaultCapabilities = (source: ModelCapabilities['source'] = 'default'): ModelCapabilities => ({
  text_generation: true,
  tool_calling: false,
  vision_input: false,
  audio_input: false,
  audio_output: false,
  structured_output: false,
  max_context_estimate: 8192,
  source,
  confidence: source === 'default' ? 0.5 : 0.9,
  updatedAt: nowIso(),
});

const providerBaseline = (providerId: string): Partial<ModelCapabilities> => {
  const normalized = providerId.toLowerCase();
  if (normalized === 'mistral') {
    return {
      text_generation: true,
      tool_calling: false,
      vision_input: false,
      audio_input: false,
      audio_output: false,
      structured_output: true,
      max_context_estimate: 32000,
    };
  }
  if (normalized === 'openai' || normalized === 'anthropic') {
    return {
      text_generation: true,
      tool_calling: true,
      structured_output: true,
      max_context_estimate: 128000,
    };
  }
  return {};
};

export class ModelCapabilityResolver {
  private readStore(): CapabilityStore {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as CapabilityStore;
    } catch {
      return {};
    }
  }

  private writeStore(store: CapabilityStore) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  private key(providerId: string, model: string) {
    return `${providerId.toLowerCase()}::${model.toLowerCase()}`;
  }

  private isExpired(capabilities: ModelCapabilities) {
    const ts = new Date(capabilities.updatedAt).getTime();
    return Number.isNaN(ts) || Date.now() - ts > TTL_MS;
  }

  async resolve(
    providerId: string,
    model: string | undefined,
    providerMetadata?: Partial<ModelCapabilities> | null,
  ): Promise<ModelCapabilities> {
    const effectiveModel = model || 'default';
    const store = this.readStore();
    const id = this.key(providerId, effectiveModel);
    const cached = store[id];
    if (cached && !this.isExpired(cached)) return cached;

    const resolved: ModelCapabilities = {
      ...defaultCapabilities('default'),
      ...providerBaseline(providerId),
      ...(providerMetadata || {}),
      updatedAt: nowIso(),
      source: providerMetadata ? 'metadata' : 'default',
      confidence: providerMetadata ? 0.9 : 0.6,
    };

    store[id] = resolved;
    this.writeStore(store);
    return resolved;
  }

  override(providerId: string, model: string | undefined, patch: Partial<ModelCapabilities>): ModelCapabilities {
    const effectiveModel = model || 'default';
    const store = this.readStore();
    const id = this.key(providerId, effectiveModel);
    const next: ModelCapabilities = {
      ...(store[id] || defaultCapabilities()),
      ...patch,
      source: 'override',
      confidence: 1,
      updatedAt: nowIso(),
    };
    store[id] = next;
    this.writeStore(store);
    return next;
  }
}

