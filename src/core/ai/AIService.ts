import { AIConfig, AIProvider, AICompletionOptions } from './types';
import * as Crypto from '../crypto';

class OpenAIProvider implements AIProvider {
    id = 'openai';
    name = 'OpenAI';
    private apiKey: string = '';
    private endpoint: string = 'https://api.openai.com/v1/chat/completions';

    configure(apiKey: string, endpoint?: string) {
        this.apiKey = apiKey;
        if (endpoint) this.endpoint = endpoint;
    }

    async generate(prompt: string, options?: AICompletionOptions): Promise<string> {
        if (!this.apiKey) throw new Error('OpenAI API Key not configured');

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: options?.systemPrompt || 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI Error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

class AIService {
    private providers: Map<string, AIProvider> = new Map();
    private activeProviderId: string = 'openai';
    private config: AIConfig | null = null;
    private configLoaded = false;

    constructor() {
        this.registerProvider(new OpenAIProvider());
    }

    registerProvider(provider: AIProvider) {
        this.providers.set(provider.id, provider);
    }

    setActiveProvider(id: string) {
        if (this.providers.has(id)) {
            this.activeProviderId = id;
        }
    }

    // Legacy (Plaintext) - Removed/Deprecated
    // getConfig() { return this.config; }

    async configure(config: AIConfig) {
        this.config = config;
        const provider = this.providers.get(config.providerId);
        if (provider) {
            provider.configure(config.apiKey, config.endpoint);
            this.activeProviderId = config.providerId;
        }
    }

    async saveEncryptedConfig(config: AIConfig, masterKey: CryptoKey): Promise<void> {
        // 1. Derive Config Key
        // We use a static salt for the config just to separate it from document keys
        // In production, we might want a unique salt per config, but static is fine for local-first
        const salt = new TextEncoder().encode("cuboid_ai_config_salt_v1");
        // Pad salt to 16 bytes if needed, or PBKDF2 handles it? 
        // HKDF needs salt.
        // Let's use PBKDF2 from masterKey? No, masterKey is HKDF-suitable.
        // Use HKDF to derive subkey.
        const configKey = await Crypto.deriveDocumentKey(masterKey, salt, new Uint8Array(0));

        // 2. Encrypt
        const json = JSON.stringify(config);
        const { iv, ciphertext } = await Crypto.encrypt(configKey, json);

        // 3. Store
        localStorage.setItem('cuboid_ai_config_encrypted', Crypto.toBase64(ciphertext));
        localStorage.setItem('cuboid_ai_config_iv', Crypto.toBase64(iv));

        // Update in-memory
        await this.configure(config);
    }

    async loadEncryptedConfig(masterKey: CryptoKey): Promise<AIConfig | null> {
        try {
            const encrypted = localStorage.getItem('cuboid_ai_config_encrypted');
            const ivStr = localStorage.getItem('cuboid_ai_config_iv');

            if (!encrypted || !ivStr) return null;

            const salt = new TextEncoder().encode("cuboid_ai_config_salt_v1");
            const configKey = await Crypto.deriveDocumentKey(masterKey, salt, new Uint8Array(0));

            const ciphertext = Crypto.fromBase64(encrypted);
            const iv = Crypto.fromBase64(ivStr);

            const json = await Crypto.decrypt(configKey, iv, ciphertext);
            const config = JSON.parse(json) as AIConfig;

            await this.configure(config);
            return config;
        } catch (e) {
            console.error("Failed to load encrypted AI config", e);
            return null;
        }
    }

    async generate(prompt: string, options?: AICompletionOptions): Promise<string> {
        const provider = this.providers.get(this.activeProviderId);
        if (!provider) throw new Error('Active AI provider not found');
        return provider.generate(prompt, options);
    }
}

export const aiService = new AIService();
