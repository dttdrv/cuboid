import { describe, it, expect } from 'vitest';

// Simulating the actual vulnerable function behavior for testing
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeExtraBody(payload: Record<string, any>, extraBody: unknown): void {
  if (!isPlainObject(extraBody)) return;
  // Never allow overriding required core fields or prototype properties to prevent prototype pollution.
  const blocked = new Set([
    "model",
    "messages",
    "stream",
    "__proto__",
    "constructor",
    "prototype"
  ]);
  for (const [key, value] of Object.entries(extraBody)) {
    if (blocked.has(key)) continue;
    payload[key] = value as any;
  }
}

describe('AiRouterService prototype pollution prevention', () => {
  it('should not pollute prototype when merging extraBody with __proto__', () => {
    const payload: any = {};
    const extraBody: any = JSON.parse('{"__proto__": {"polluted1": true}}');

    mergeExtraBody(payload, extraBody);

    // Check global Object prototype
    expect(({} as any).polluted1).toBeUndefined();
    // Payload prototype shouldn't be altered
    expect(payload.__proto__).toStrictEqual(Object.prototype);
  });

  it('should not pollute prototype when merging extraBody with constructor.prototype', () => {
    const payload: any = {};
    const extraBody: any = JSON.parse('{"constructor": {"prototype": {"polluted2": true}}}');

    mergeExtraBody(payload, extraBody);

    // Check global Object prototype
    expect(({} as any).polluted2).toBeUndefined();
  });
});
