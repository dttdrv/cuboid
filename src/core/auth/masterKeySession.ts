const MASTER_KEY_SESSION_PREFIX = 'cuboid_master_key_wrap_v1:';

interface WrappedKeyPayload {
  iv: string;
  ciphertext: string;
  wrappedAt: string;
}

const toBase64 = (bytes: Uint8Array): string => {
  const bin = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(bin);
};

const fromBase64 = (value: string): Uint8Array => {
  const bin = atob(value);
  return Uint8Array.from(bin, (char) => char.codePointAt(0) || 0);
};

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  return window.sessionStorage;
};

const storageKey = (userId: string) => `${MASTER_KEY_SESSION_PREFIX}${userId}`;

const importSessionWrappingKey = async (sessionKeyBase64: string): Promise<CryptoKey> => {
  return globalThis.crypto.subtle.importKey(
    'raw',
    fromBase64(sessionKeyBase64),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
};

export const persistWrappedMasterKey = async (
  userId: string,
  masterKey: CryptoKey,
  sessionKeyBase64: string,
): Promise<void> => {
  const storage = getStorage();
  if (!storage) return;

  try {
    const wrappingKey = await importSessionWrappingKey(sessionKeyBase64);
    const rawMasterKey = new Uint8Array(await globalThis.crypto.subtle.exportKey('raw', masterKey));
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(
      await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, rawMasterKey),
    );

    const payload: WrappedKeyPayload = {
      iv: toBase64(iv),
      ciphertext: toBase64(ciphertext),
      wrappedAt: new Date().toISOString(),
    };
    storage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // HKDF keys are non-extractable in WebCrypto; treat wrapping as best effort.
  }
};

export const restoreWrappedMasterKey = async (
  userId: string,
  sessionKeyBase64: string,
): Promise<CryptoKey | null> => {
  const storage = getStorage();
  if (!storage) return null;
  const payloadJson = storage.getItem(storageKey(userId));
  if (!payloadJson) return null;

  try {
    const payload = JSON.parse(payloadJson) as WrappedKeyPayload;
    const wrappingKey = await importSessionWrappingKey(sessionKeyBase64);
    const raw = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(payload.iv) },
      wrappingKey,
      fromBase64(payload.ciphertext),
    );

    return globalThis.crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'HKDF' },
      true,
      ['deriveKey', 'deriveBits'],
    );
  } catch {
    return null;
  }
};

export const clearWrappedMasterKey = (userId: string): void => {
  const storage = getStorage();
  storage?.removeItem(storageKey(userId));
};
