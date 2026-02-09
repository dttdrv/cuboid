import { z } from 'zod';

/**
 * Configuration options for an AI completion request.
 */
export interface AICompletionOptions {
  /** The model identifier to use. Defaults to the provider's default if omitted. */
  model?: string;
  /** Sampling temperature to use, between 0.0 and 2.0. Higher values like 0.8 make output more random, lower values like 0.2 make it more focused and deterministic. */
  temperature?: number;
  /** The maximum number of tokens to generate in the completion. */
  maxTokens?: number;
  /** Additional provider-specific parameters. */
  extra?: Record<string, unknown>;
}

export interface ModelCapabilities {
  text_generation: boolean;
  tool_calling: boolean;
  vision_input: boolean;
  audio_input: boolean;
  audio_output: boolean;
  structured_output: boolean;
  max_context_estimate: number;
  source: 'metadata' | 'probe' | 'override' | 'default';
  confidence: number;
  updatedAt: string;
}

/**
 * Configuration for the AI service (persisted).
 */
export interface AIConfig {
  /** The active provider ID (e.g., 'mistral', 'openai'). */
  activeProvider: string;
  /** API Keys mapped by provider ID. */
  apiKeys: Record<string, string>;
  /** Default options per provider. */
  defaults?: Record<string, AICompletionOptions>;
}

/**
 * Interface that all AI Providers must implement.
 */
export interface AIProvider {
  /** Unique identifier for the provider (e.g., 'mistral'). */
  readonly id: string;

  /** Display name for the provider. */
  readonly name: string;

  /**
   * Generates a complete response for the given prompt.
   * @param prompt The input text.
   * @param options Optional configuration for the generation.
   * @returns A Promise resolving to the generated string.
   */
  generate(prompt: string, options?: AICompletionOptions): Promise<string>;

  /**
   * Generates a streaming response for the given prompt.
   * @param prompt The input text.
   * @param options Optional configuration for the generation.
   * @returns An AsyncGenerator yielding chunks of the generated string.
   */
  generateStream(prompt: string, options?: AICompletionOptions): AsyncGenerator<string, void, unknown>;

  /**
   * Optional capability resolver from provider-side metadata.
   */
  getModelCapabilities?(model?: string): Promise<Partial<ModelCapabilities> | null>;
}

/**
 * Schema for validating Mistral API responses.
 */
export const MistralResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
      finish_reason: z.string(),
    })
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

/**
 * Schema for validating Mistral Stream chunks.
 */
export const MistralStreamChunkSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      delta: z.object({
        role: z.string().optional(),
        content: z.string().optional(),
      }),
      finish_reason: z.string().nullable(),
    })
  ),
});
