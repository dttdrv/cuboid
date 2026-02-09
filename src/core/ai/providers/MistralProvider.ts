import {
  AIProvider,
  AICompletionOptions,
  MistralResponseSchema,
  MistralStreamChunkSchema,
  ModelCapabilities,
  AIRequestContext,
} from '../types';
import { AIProviderId } from '../providerIds';

const DEFAULT_MODEL = 'mistral-tiny';
const BASE_URL = 'https://api.mistral.ai/v1/chat/completions';
const BASE_HOST = 'api.mistral.ai';

const assertEgressAllowed = (context?: AIRequestContext) => {
  const policy = context?.egress;
  if (!policy) return;
  const allowed = policy.allowedHosts.map((host) => host.toLowerCase());
  if (!allowed.includes(BASE_HOST)) {
    throw new Error(`Egress policy blocks host: ${BASE_HOST}`);
  }
  if (BASE_URL.startsWith('http://') && !policy.allowInsecureHttp) {
    throw new Error('Egress policy blocks insecure HTTP.');
  }
};

/**
 * Mistral AI Provider Implementation.
 */
export class MistralProvider implements AIProvider {
  readonly id: AIProviderId = 'mistral';
  readonly name = 'Mistral AI';

  constructor(private apiKey: string) {}

  async getModelCapabilities(): Promise<Partial<ModelCapabilities>> {
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

  /**
   * Helper to wait between retries.
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Implementation of generate with retry logic.
   */
  async generate(prompt: string, options?: AICompletionOptions, context?: AIRequestContext): Promise<string> {
    assertEgressAllowed(context);
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: options?.model || DEFAULT_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 1024,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mistral API Error ${response.status}: ${errorText}`);
        }

        const json = await response.json();
        
        // Validate response structure using Zod
        const validated = MistralResponseSchema.parse(json);
        
        return validated.choices[0]?.message?.content || '';
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`MistralProvider attempt ${attempt + 1} failed.`, lastError);
        
        // If it's a network error or 5xx, retry. Otherwise, throw immediately.
        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await this.wait(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError;
  }

  /**
   * Implementation of generateStream.
   */
  async *generateStream(
    prompt: string,
    options?: AICompletionOptions,
    context?: AIRequestContext,
  ): AsyncGenerator<string, void, unknown> {
    assertEgressAllowed(context);
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API Stream Error ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable.');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last potentially incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.substring(6);
              const json = JSON.parse(jsonStr);
              
              // Validate chunk
              const validated = MistralStreamChunkSchema.parse(json);
              const content = validated.choices[0]?.delta?.content;
              
              if (content) {
                yield content;
              }
            } catch (e) {
              // Ignore parsing errors for individual chunks to keep stream alive
              console.warn('Failed to parse stream chunk', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
