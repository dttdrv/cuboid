export interface AICompletionOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

export interface AIProvider {
    id: string; // 'openai', 'anthropic', 'mistral'
    name: string;
    generate(prompt: string, options?: AICompletionOptions): Promise<string>;
    configure(apiKey: string, endpoint?: string): void;
}

export interface AIConfig {
    providerId: string;
    apiKey: string;
    endpoint?: string;
}
