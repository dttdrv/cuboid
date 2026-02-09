import { AIProvider, AIConfig, AICompletionOptions } from './types';
import { MistralProvider } from './providers/MistralProvider';
import { ModelCapabilityResolver } from './capabilities';
import { literatureSearch, LiteratureToolOutput } from './tools';

const STORAGE_KEY_CONFIG = 'cuboid_ai_config';
const STORAGE_KEY_LOGS = 'cuboid_ai_logs';

interface InteractionLog {
  timestamp: number;
  provider: string;
  prompt: string;
  completionPreview: string;
  isStream: boolean;
}

/**
 * Singleton Service for managing AI interactions.
 */
class AIService {
  private static instance: AIService;

  private providers: Map<string, AIProvider> = new Map();
  private activeProviderId: string | null = null;
  private config: AIConfig;
  private capabilityResolver = new ModelCapabilityResolver();

  private constructor() {
    // Load configuration from localStorage
    this.config = this.loadConfig();

    // Initialize default providers if keys exist
    this.initializeProviders();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private loadConfig(): AIConfig {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { activeProvider: '', apiKeys: {} };
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_CONFIG);
      return stored ? JSON.parse(stored) : { activeProvider: '', apiKeys: {} };
    } catch (e) {
      console.error('Failed to load AI config', e);
      return { activeProvider: '', apiKeys: {} };
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

      // Limit logs to last 50 entries
      logs.push(log);
      if (logs.length > 50) logs = logs.slice(-50);

      window.localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log interaction', e);
    }
  }

  private initializeProviders(): void {
    if (this.config.apiKeys.mistral) {
      this.registerProvider(new MistralProvider(this.config.apiKeys.mistral));
      if (!this.activeProviderId) {
        this.setActiveProvider('mistral');
      }
    }
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      this.config.activeProvider = providerId;
      this.saveConfig();
      return true;
    }
    return false;
  }

  public getActiveProvider(): AIProvider | null {
    if (!this.activeProviderId) return null;
    return this.providers.get(this.activeProviderId) || null;
  }

  public async getActiveCapabilities(model?: string) {
    const provider = this.getActiveProvider();
    if (!provider) return null;
    const metadata = provider.getModelCapabilities ? await provider.getModelCapabilities(model) : null;
    return this.capabilityResolver.resolve(provider.id, model, metadata);
  }

  public overrideCapabilities(model: string | undefined, patch: Parameters<ModelCapabilityResolver['override']>[2]) {
    const provider = this.getActiveProvider();
    if (!provider) return null;
    return this.capabilityResolver.override(provider.id, model, patch);
  }

  public persistKey(providerId: string, apiKey: string): void {
    this.config.apiKeys[providerId] = apiKey;
    this.saveConfig();

    // Re-initialize to update provider instance with new key
    if (providerId === 'mistral') {
      this.registerProvider(new MistralProvider(apiKey));
    }
  }

  public isConfigured(): boolean {
    return !!this.getActiveProvider();
  }

  public async generate(prompt: string, options?: AICompletionOptions): Promise<string> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active AI provider configured. Please set an API key.');
    }

    try {
      const result = await provider.generate(prompt, options);

      this.logInteraction({
        timestamp: Date.now(),
        provider: provider.id,
        prompt,
        completionPreview: result.substring(0, 100) + (result.length > 100 ? '...' : ''),
        isStream: false,
      });

      return result;
    } catch (error) {
      console.error('AI Generation failed:', error);
      throw error;
    }
  }

  public async runLiteratureSearch(query: string): Promise<LiteratureToolOutput> {
    return literatureSearch(query);
  }

  public async *generateStream(prompt: string, options?: AICompletionOptions): AsyncGenerator<string> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active AI provider configured. Please set an API key.');
    }

    let fullContent = '';
    let hasError = false;

    try {
      for await (const chunk of provider.generateStream(prompt, options)) {
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
          prompt,
          completionPreview: fullContent.substring(0, 100) + (fullContent.length > 100 ? '...' : ''),
          isStream: true,
        });
      }
    }
  }
}

// Export singleton instance getter
export const getAIService = () => AIService.getInstance();
