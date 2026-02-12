import { randomBytes } from "node:crypto";

export function createId(prefix: string): string {
  const suffix = randomBytes(6).toString("hex");
  return `${prefix}_${Date.now().toString(36)}_${suffix}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
