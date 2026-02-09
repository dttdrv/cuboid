import { beforeEach, describe, expect, it } from 'vitest';
import { LocalAuth } from './local';

class InMemoryStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length() {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] || null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('LocalAuth magic-link validation', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new InMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  it('requires matching token and invalidates it after first use', async () => {
    const email = 'user@example.com';
    const { token } = await LocalAuth.sendMagicLink(email);

    const wrongToken = await LocalAuth.consumeMagicLink(email, 'wrong-token');
    expect('error' in wrongToken ? wrongToken.error : '').toContain('not found');

    const accepted = await LocalAuth.consumeMagicLink(email, token);
    expect(accepted).toEqual({ ok: true });

    const replay = await LocalAuth.consumeMagicLink(email, token);
    expect('error' in replay ? replay.error : '').toContain('not found');
  });
});

