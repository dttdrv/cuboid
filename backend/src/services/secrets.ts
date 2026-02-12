import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ensureDir, fileExists, writeJsonFileAtomic } from "../utils/fs.js";
import { HttpError } from "../utils/http.js";

interface EncryptedEnvelope {
  version: number;
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

const ENVELOPE_VERSION = 1;
const KEY_LENGTH = 32;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_LENGTH);
}

function encrypt(passphrase: string, plaintext: string): EncryptedEnvelope {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = deriveKey(passphrase, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: ENVELOPE_VERSION,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };
}

function decrypt(passphrase: string, envelope: EncryptedEnvelope): string {
  if (envelope.version !== ENVELOPE_VERSION) {
    throw new Error("Unsupported encrypted secret envelope version.");
  }

  const salt = Buffer.from(envelope.salt, "base64");
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  const ciphertext = Buffer.from(envelope.ciphertext, "base64");
  const key = deriveKey(passphrase, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

export class SecretStore {
  private readonly filePath: string;
  private readonly keyPath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.keyPath = `${filePath}.key`;
  }

  async get(key: string): Promise<string | null> {
    const all = await this.readAll();
    const value = all[key];
    return typeof value === "string" ? value : null;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async set(key: string, value: string): Promise<void> {
    const all = await this.readAll();
    all[key] = value;
    await this.writeAll(all);
  }

  async delete(key: string): Promise<void> {
    const all = await this.readAll();
    if (key in all) {
      delete all[key];
      await this.writeAll(all);
    }
  }

  private async readAll(): Promise<Record<string, string>> {
    if (!(await fileExists(this.filePath))) {
      return {};
    }
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch {
      throw new HttpError(500, "Unable to read encrypted secrets.");
    }
    let envelope: EncryptedEnvelope;
    try {
      envelope = JSON.parse(raw) as EncryptedEnvelope;
    } catch {
      throw new HttpError(500, "Encrypted secret file is corrupted.");
    }
    try {
      const passphrase = await this.resolvePassphrase();
      const plaintext = decrypt(passphrase, envelope);
      const parsed = JSON.parse(plaintext) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") {
          out[key] = value;
        }
      }
      return out;
    } catch {
      // If the user explicitly pinned a passphrase, failing closed is correct.
      // In early local-first development, passphrase/key mismatches are common
      // (e.g. a regenerated local key file). In that case, quarantine the secrets
      // file and continue with an empty store so the app can boot.
      if (process.env.CUBOID_SECRET_PASSPHRASE?.trim()) {
        throw new HttpError(
          500,
          "Unable to decrypt local secrets. Check CUBOID_SECRET_PASSPHRASE value."
        );
      }
      await this.quarantine();
      return {};
    }
  }

  private async writeAll(data: Record<string, string>): Promise<void> {
    const plaintext = JSON.stringify(data);
    const passphrase = await this.resolvePassphrase();
    const envelope = encrypt(passphrase, plaintext);
    await writeJsonFileAtomic(this.filePath, envelope);
  }

  private async quarantine(): Promise<void> {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const badPath = `${this.filePath}.bad.${stamp}`;
      await rename(this.filePath, badPath);
    } catch {
      // ignore
    }
  }

  private async resolvePassphrase(): Promise<string> {
    const configured = process.env.CUBOID_SECRET_PASSPHRASE;
    if (configured && configured.trim().length > 0) {
      return configured;
    }

    if (await fileExists(this.keyPath)) {
      const persisted = (await readFile(this.keyPath, "utf8")).trim();
      if (persisted.length > 0) {
        return persisted;
      }
    }

    const generated = randomBytes(32).toString("base64url");
    await ensureDir(dirname(this.keyPath));
    await writeFile(this.keyPath, `${generated}\n`, { encoding: "utf8", mode: 0o600 });
    return generated;
  }
}
