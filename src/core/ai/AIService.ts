import { AIEgressPolicy, AICompletionOptions, AIConfig, AIProvider, AIRequestContext } from './types';
import { MistralProvider } from './providers/MistralProvider';
import { ModelCapabilityResolver } from './capabilities';
import { literatureSearch, LiteratureToolOutput } from './tools';
import { AIProviderId, normalizeAIProviderId } from './providerIds';
import { getCryptoVault } from '../security/CryptoVault';

const STORAGE_KEY_CONFIG = 'cuboid_ai_config';
const STORAGE_KEY_LOGS = 'cuboid_ai_logs';

const defaultConfig = (): AIConfig => ({
  version: 2,
  activeProvider: null,
  providers: {},
});

const keyRef = (providerId: AIProviderId) => `ai:provider:${providerId}:api-key`;

const providerDefaults: Record<AIProviderId, AIEgressPolicy> = {
  mistral: { allowedHosts: ['api.mistral.ai'], allowInsecureHttp: false },
  openai: { allowedHosts: ['api.openai.com'], allowInsecureHttp: false },
  anthropic: { allowedHosts: ['api.anthropic.com'], allowInsecureHttp: false },
};

const toolDefaultEgress: AIEgressPolicy = {
  allowedHosts: ['api.crossref.org', 'export.arxiv.org'],
  allowInsecureHttp: false,
};

interface LegacyAIConfig {
  activeProvider?: string;
  apiKeys?: Record<string, string>;
  defaults?: Record<string, AICompletionOptions>;
}

interface InteractionLog {
  timestamp: number;
  provider: AIProviderId;
  promptChars: number;
  completionPreview: string;
  isStream: boolean;
}

const normalizeConfig = (
  raw: unknown,
): { config: AIConfig; migratedKeys: Partial<Record<AIProviderId, string>> } => {
  const migratedKeys: Partial<Record<AIProviderId, string>> = {};
  if (!raw || typeof raw !== 'object') {
    return { config: defaultConfig(), migratedKeys };
  }

  const input = raw as Record<string, unknown>;
  if (input.version === 2) {
    const activeProvider = normalizeAIProviderId(String(input.activeProvider || ''));
    const providersInput =
      input.providers && typeof input.providers === 'object'
        ? (input.providers as Record<string, { hasKey?: boolean; defaults?: AICompletionOptions }>)
        : {};
    const providers = Object.entries(providersInput).reduce<AIConfig['providers']>((acc, [key, value]) => {
      const normalizedId = normalizeAIProviderId(key);
      if (!normalizedId || !value || typeof value !== 'object') return acc;
      acc[normalizedId] = {
        hasKey: Boolean(value.hasKey),
        defaults: value.defaults,
      };
      return acc;
    }, {});

    return {
      config: {
        version: 2,
        activeProvider,
        providers,
      },
      migratedKeys,
    };
  }

  const legacy = input as LegacyAIConfig;
  const providers: AIConfig['providers'] = {};
  if (legacy.defaults) {
    Object.entries(legacy.defaults).forEach(([key, defaults]) => {
      const providerId = normalizeAIProviderId(key);
      if (!providerId) return;
      providers[providerId] = {
        hasKey: false,
        defaults,
      };
    });
  }

  if (legacy.apiKeys) {
    Object.entries(legacy.apiKeys).forEach(([key, value]) => {
      const providerId = normalizeAIProviderId(key);
      if (!providerId || !value) return;
      migratedKeys[providerId] = value;
      providers[providerId] = {
        ...(providers[providerId] || {}),
        hasKey: true,
      };
    });
  }

  return {
    config: {
      version: 2,
      activeProvider: normalizeAIProviderId(legacy.activeProvider || ''),
      providers,
    },
    migratedKeys,
  };
};

const mergeEgressPolicy = (base: AIEgressPolicy, override?: AIEgressPolicy): AIEgressPolicy => {
  if (!override) return base;
  const overrideHosts = override.allowedHosts.map((host) => host.toLowerCase());
  return {
    allowedHosts: base.allowedHosts.filter((host) => overrideHosts.includes(host.toLowerCase())),
    allowInsecureHttp: Boolean(base.allowInsecureHttp && override.allowInsecureHttp),
  };
};

/**
 * Singleton Service for managing AI interactions.
 */
class AIService {
  private static instance: AIService;

  private providers: Map<AIProviderId, AIProvider> = new Map();
  private activeProviderId: AIProviderId | null = null;
  private config: AIConfig;
  private readonly capabilityResolver = new ModelCapabilityResolver();
  private readonly vault = getCryptoVault();
  private readonly providerEgress = { ...providerDefaults };
  private toolEgress = toolDefaultEgress;
  private initialization: Promise<void>;
  private migratedKeys: Partial<Record<AIProviderId, string>> = {};

  private constructor() {
    this.config = this.loadConfig();
    this.initialization = this.refreshProviders();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private loadConfig(): AIConfig {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultConfig();
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_CONFIG);
      const parsed = stored ? JSON.parse(stored) : null;
      const normalized = normalizeConfig(parsed);
      this.migratedKeys = normalized.migratedKeys;
      return normalized.config;
    } catch (e) {
      console.error('Failed to load AI config', e);
      return defaultConfig();
    }
  }

  private saveConfig(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      } catch (e) {
        console.error('Failed to save AI config', e);
      }
    }
  }

  private logInteraction(log: InteractionLog): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const logsStr = window.localStorage.getItem(STORAGE_KEY_LOGS);
      let logs: InteractionLog[] = logsStr ? JSON.parse(logsStr) : [];

      logs.push(log);
      if (logs.length > 50) logs = logs.slice(-50);

      window.localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log interaction', e);
    }
  }

  private async maybeMigrateLegacyKey(providerId: AIProviderId): Promise<void> {
    const legacy = this.migratedKeys[providerId];
    if (!legacy) return;
    await this.vault.setSecret(keyRef(providerId), legacy);
    delete this.migratedKeys[providerId];
    this.saveConfig();
  }

  private async buildProvider(providerId: AIProviderId): Promise<AIProvider | null> {
    if (!this.config.providers[providerId]?.hasKey) return null;
    await this.maybeMigrateLegacyKey(providerId);
    const key = await this.vault.getSecret(keyRef(providerId));
    if (!key) return null;

    if (providerId === 'mistral') {
      return new MistralProvider(key);
    }
    return null;
  }

  private hasConfiguredProviderKey(): boolean {
    return Object.values(this.config.providers).some((provider) => Boolean(provider?.hasKey));
  }

  private async refreshProviders(): Promise<void> {
    this.providers.clear();
    const ids = Object.keys(this.config.providers)
      .map((entry) => normalizeAIProviderId(entry))
      .filter((entry): entry is AIProviderId => Boolean(entry));

    for (const providerId of ids) {
      const provider = await this.buildProvider(providerId);
      if (!provider) continue;
      this.registerProvider(provider);
    }

    if (this.config.activeProvider && this.providers.has(this.config.activeProvider)) {
      this.activeProviderId = this.config.activeProvider;
      return;
    }

    const firstRegistered = this.providers.keys().next().value as AIProviderId | undefined;
    this.activeProviderId = firstRegistered || null;
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public setActiveProvider(providerIdInput: string): boolean {
    const providerId = normalizeAIProviderId(providerIdInput);
    if (!providerId) return false;
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      this.config.activeProvider = providerId;
      this.saveConfig();
      return true;
    }
    return false;
  }

  private resolveContext(providerId: AIProviderId, context?: AIRequestContext): AIRequestContext {
    const basePolicy = this.providerEgress[providerId];
    return {
      ...context,
      egress: mergeEgressPolicy(basePolicy, context?.egress),
    };
  }

  private async getResolvedActiveProvider(): Promise<AIProvider | null> {
    await this.initialization;
    if ((!this.activeProviderId || !this.providers.has(this.activeProviderId)) && this.hasConfiguredProviderKey()) {
      await this.refreshProviders();
    }
    if (!this.activeProviderId) return null;
    return this.providers.get(this.activeProviderId) || null;
  }

  public getActiveProviderSync(): AIProvider | null {
    if (!this.activeProviderId) return null;
    return this.providers.get(this.activeProviderId) || null;
  }

  public getActiveProvider(): AIProvider | null {
    return this.getActiveProviderSync();
  }

  public async getActiveCapabilities(model?: string) {
    const provider = await this.getResolvedActiveProvider();
    if (!provider) return null;
    const metadata = provider.getModelCapabilities ? await provider.getModelCapabilities(model) : null;
    return this.capabilityResolver.resolve(provider.id, model, metadata);
  }

  public overrideCapabilities(model: string | undefined, patch: Parameters<ModelCapabilityResolver['override']>[2]) {
    const provider = this.getActiveProviderSync();
    if (!provider) return null;
    return this.capabilityResolver.override(provider.id, model, patch);
  }

  public setProviderEgressPolicy(providerIdInput: string, policy: AIEgressPolicy): boolean {
    const providerId = normalizeAIProviderId(providerIdInput);
    if (!providerId) return false;
    this.providerEgress[providerId] = policy;
    return true;
  }

  public setToolEgressPolicy(policy: AIEgressPolicy): void {
    this.toolEgress = policy;
  }

  public async persistKey(providerIdInput: string, apiKey: string): Promise<boolean> {
    const providerId = normalizeAIProviderId(providerIdInput);
    if (!providerId) {
      throw new Error(`Unsupported AI provider: ${providerIdInput}`);
    }

    const normalizedKey = apiKey.trim();
    if (!normalizedKey) {
      throw new Error('API key cannot be empty.');
    }

    await this.vault.setSecret(keyRef(providerId), normalizedKey);
    this.config.providers[providerId] = {
      ...(this.config.providers[providerId] || {}),
      hasKey: true,
    };
    this.saveConfig();

    const provider = await this.buildProvider(providerId);
    if (provider) {
      this.registerProvider(provider);
      this.setActiveProvider(providerId);
      return true;
    }
    return false;
  }

  public async isConfigured(): Promise<boolean> {
    await this.initialization;
    if (!this.getActiveProviderSync() && this.hasConfiguredProviderKey()) {
      await this.refreshProviders();
    }
    return !!this.getActiveProviderSync();
  }

  public async generate(
    prompt: string,
    options?: AICompletionOptions,
    context?: AIRequestContext,
  ): Promise<string> {
    const provider = await this.getResolvedActiveProvider();
    if (!provider) {
      throw new Error('No active AI provider configured. Please set an API key.');
    }

    try {
      const result = await provider.generate(prompt, options, this.resolveContext(provider.id, context));

      this.logInteraction({
        timestamp: Date.now(),
        provider: provider.id,
        promptChars: prompt.length,
        completionPreview: result.substring(0, 100) + (result.length > 100 ? '...' : ''),
        isStream: false,
      });

      return result;
    } catch (error) {
      console.error('AI Generation failed:', error);
      throw error;
    }
  }

  public async runLiteratureSearch(query: string, context?: AIRequestContext): Promise<LiteratureToolOutput> {
    const egress = mergeEgressPolicy(this.toolEgress, context?.egress);
    return literatureSearch(query, { ...context, egress });
  }

  public async *generateStream(
    prompt: string,
    options?: AICompletionOptions,
    context?: AIRequestContext,
  ): AsyncGenerator<string> {
    const provider = await this.getResolvedActiveProvider();
    if (!provider) {
      throw new Error('No active AI provider configured. Please set an API key.');
    }

    let fullContent = '';
    let hasError = false;

    try {
      for await (const chunk of provider.generateStream(
        prompt,
        options,
        this.resolveContext(provider.id, context),
      )) {
        fullContent += chunk;
        yield chunk;
      }
    } catch (error) {
      hasError = true;
      console.error('AI Streaming failed:', error);
      throw error;
    } finally {
      if (!hasError && fullContent.length > 0) {
        this.logInteraction({
          timestamp: Date.now(),
          provider: provider.id,
          promptChars: prompt.length,
          completionPreview: fullContent.substring(0, 100) + (fullContent.length > 100 ? '...' : ''),
          isStream: true,
        });
      }
    }
  }
}

export const getAIService = () => AIService.getInstance();
