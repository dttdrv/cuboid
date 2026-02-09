import { ensureSessionKey, readSessionKey } from '../auth/sessionKeyLifecycle';

const VAULT_STORAGE_KEY = 'cuboid_crypto_vault_v1';

interface VaultRecord {
  iv: string;
  ciphertext: string;
  updatedAt: string;
}

type VaultStore = Record<string, VaultRecord>;

export interface CryptoVault {
  setSecret(secretId: string, plaintext: string): Promise<void>;
  getSecret(secretId: string): Promise<string | null>;
  deleteSecret(secretId: string): Promise<void>;
}

const toBase64 = (bytes: Uint8Array) => {
  const bin = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(bin);
};

const fromBase64 = (value: string) => {
  const bin = atob(value);
  return Uint8Array.from(bin, (char) => char.codePointAt(0) || 0);
};

const readStore = (): VaultStore => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    return JSON.parse(window.localStorage.getItem(VAULT_STORAGE_KEY) || '{}') as VaultStore;
  } catch {
    return {};
  }
};

const writeStore = (store: VaultStore) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(store));
};

class BrowserCryptoVault implements CryptoVault {
  private cachedSessionKeyId: string | null = null;
  private cachedCipherKey: CryptoKey | null = null;

  private async resolveCipherKey(forWrite: boolean): Promise<CryptoKey | null> {
    const sessionKeyBase64 = forWrite ? ensureSessionKey('vault-write') : readSessionKey();
    if (!sessionKeyBase64) return null;

    const sessionKeyId = sessionKeyBase64.slice(0, 12);
    if (this.cachedCipherKey && this.cachedSessionKeyId === sessionKeyId) {
      return this.cachedCipherKey;
    }

    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      fromBase64(sessionKeyBase64),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
    this.cachedSessionKeyId = sessionKeyId;
    this.cachedCipherKey = key;
    return key;
  }

  async setSecret(secretId: string, plaintext: string): Promise<void> {
    const cipherKey = await this.resolveCipherKey(true);
    if (!cipherKey) {
      throw new Error('Unable to resolve vault key.');
    }
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cipherKey,
      new TextEncoder().encode(plaintext),
    );

    const store = readStore();
    store[secretId] = {
      iv: toBase64(iv),
      ciphertext: toBase64(new Uint8Array(ciphertext)),
      updatedAt: new Date().toISOString(),
    };
    writeStore(store);
  }

  async getSecret(secretId: string): Promise<string | null> {
    const store = readStore();
    const record = store[secretId];
    if (!record) return null;

    const cipherKey = await this.resolveCipherKey(false);
    if (!cipherKey) return null;

    try {
      const decrypted = await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(record.iv) },
        cipherKey,
        fromBase64(record.ciphertext),
      );
      return new TextDecoder().decode(new Uint8Array(decrypted));
    } catch {
      return null;
    }
  }

  async deleteSecret(secretId: string): Promise<void> {
    const store = readStore();
    if (!(secretId in store)) return;
    delete store[secretId];
    writeStore(store);
  }
}

const cryptoVault = new BrowserCryptoVault();

export const getCryptoVault = (): CryptoVault => cryptoVault;

