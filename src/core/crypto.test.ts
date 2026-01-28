import { describe, it, expect } from 'vitest';
import {
  deriveMasterKey,
  deriveDocumentKey,
  encrypt,
  decrypt,
} from './crypto';

describe('Crypto Suite', () => {
  it('should derive a master key from password and salt', async () => {
    const password = 'super-secret-password';
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    const key = await deriveMasterKey(password, salt);

    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('HKDF'); // Master Key is now KDK (HKDF)
    expect(key.extractable).toBe(false);
    expect(key.type).toBe('secret');
  });

  it('should derive a document key from a master key', async () => {
    const password = 'master-password';
    const salt = new Uint8Array(16);
    const info = new Uint8Array([1]); // Context identifier

    const masterKey = await deriveMasterKey(password, salt);
    const docKey = await deriveDocumentKey(masterKey, salt, info);

    expect(docKey).toBeDefined();
    expect(docKey.algorithm.name).toBe('AES-GCM');
    expect(docKey).not.toEqual(masterKey);
  });

  it('should encrypt and decrypt data successfully using Document Key', async () => {
    const password = 'test-pass';
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const info = new Uint8Array([1]);
    const plaintext = 'Hello, this is a secret message!';

    const masterKey = await deriveMasterKey(password, salt);
    const docKey = await deriveDocumentKey(masterKey, salt, info); // MUST derive Doc Key

    const { iv, ciphertext } = await encrypt(docKey, plaintext); // Encrypt with Doc Key

    expect(iv).toBeInstanceOf(Uint8Array);
    expect(iv.length).toBe(12);
    expect(ciphertext).toBeInstanceOf(Uint8Array);
    expect(ciphertext.length).toBeGreaterThan(0);

    const decrypted = await decrypt(docKey, iv, ciphertext); // Decrypt with Doc Key

    expect(decrypted).toBe(plaintext);
  });

  it('should fail to decrypt with wrong key', async () => {
    const password1 = 'password-one';
    const password2 = 'password-two';
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const info = new Uint8Array([1]);
    const plaintext = 'Sensitive Data';

    const masterKey1 = await deriveMasterKey(password1, salt);
    const docKey1 = await deriveDocumentKey(masterKey1, salt, info);

    const masterKey2 = await deriveMasterKey(password2, salt);
    const docKey2 = await deriveDocumentKey(masterKey2, salt, info);

    const { iv, ciphertext } = await encrypt(docKey1, plaintext);

    await expect(decrypt(docKey2, iv, ciphertext)).rejects.toThrow();
  });

  it('should handle empty strings correctly', async () => {
    const password = 'empty';
    const salt = new Uint8Array(16);
    const info = new Uint8Array([1]);
    const masterKey = await deriveMasterKey(password, salt);
    const docKey = await deriveDocumentKey(masterKey, salt, info);

    const { iv, ciphertext } = await encrypt(docKey, '');
    const decrypted = await decrypt(docKey, iv, ciphertext);

    expect(decrypted).toBe('');
  });
});