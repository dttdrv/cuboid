import { describe, expect, it } from 'vitest';
import { isAIProviderId, normalizeAIProviderId } from './providerIds';

describe('AI provider id normalization', () => {
  it('normalizes mixed-case and alias values', () => {
    expect(normalizeAIProviderId('Mistral')).toBe('mistral');
    expect(normalizeAIProviderId('OpenAI')).toBe('openai');
    expect(normalizeAIProviderId('claude')).toBe('anthropic');
  });

  it('rejects unsupported ids', () => {
    expect(normalizeAIProviderId('')).toBeNull();
    expect(normalizeAIProviderId('local')).toBeNull();
    expect(isAIProviderId('mistral')).toBe(true);
    expect(isAIProviderId('LOCAL')).toBe(false);
  });
});

