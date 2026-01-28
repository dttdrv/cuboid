const subtle = globalThis.crypto.subtle;

/**
 * Encodes a string to Uint8Array.
 */
function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Decodes a Uint8Array to string.
 */
function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Derives a Master Key from a password using PBKDF2.
 * Returns an HKDF key suitable for deriving further keys (Document Keys).
 * 
 * @param password - The user's password.
 * @param salt - The salt for key derivation.
 * @returns A CryptoKey suitable for HKDF operations.
 */
export async function deriveMasterKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await subtle.importKey(
    "raw",
    encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return subtle.importKey(
    "raw",
    derivedBits,
    { name: "HKDF" },
    false,
    ["deriveKey", "deriveBits"]
  );
}

/**
 * Derives a Document Key from a Master Key using HKDF.
 * 
 * @param masterKey - The master CryptoKey (must be HKDF).
 * @param salt - The salt for key derivation.
 * @param info - Contextual info for the key derivation.
 * @returns A CryptoKey suitable for AES-GCM operations.
 */
export async function deriveDocumentKey(
  masterKey: CryptoKey,
  salt: Uint8Array,
  info: Uint8Array
): Promise<CryptoKey> {
  return subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: info,
    },
    masterKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts plaintext using AES-GCM.
 * 
 * @param key - The CryptoKey to use for encryption (AES-GCM).
 * @param plaintext - The data to encrypt.
 * @returns An object containing the IV and Ciphertext.
 */
export async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encode(plaintext)
  );

  return {
    iv,
    ciphertext: new Uint8Array(encryptedContent),
  };
}

/**
 * Decrypts ciphertext using AES-GCM.
 * 
 * @param key - The CryptoKey to use for decryption.
 * @param iv - The Initialization Vector used during encryption.
 * @param ciphertext - The encrypted data.
 * @returns The decrypted plaintext string.
 */
export async function decrypt(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Promise<string> {
  const decryptedContent = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  return decode(new Uint8Array(decryptedContent));
}