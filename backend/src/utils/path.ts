import { isAbsolute, normalize, relative, resolve } from "node:path";
import { HttpError } from "./http.js";

export function decodeUrlPathComponent(value: string, field: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new HttpError(400, `Invalid URL encoding for ${field}.`);
  }
}

export function toSafeRelativePath(pathValue: string): string {
  const normalized = normalize(pathValue).replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.length === 0 || normalized === "." || normalized.includes("\u0000")) {
    throw new HttpError(400, "File path is invalid.");
  }
  if (normalized.startsWith("../") || normalized === "..") {
    throw new HttpError(400, "Path traversal is not allowed.");
  }
  return normalized;
}

export function safeJoin(baseDir: string, relativePath: string): string {
  const clean = toSafeRelativePath(relativePath);
  const target = resolve(baseDir, clean);
  const rel = relative(baseDir, target);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new HttpError(400, "Path traversal is not allowed.");
  }
  return target;
}

export function sanitizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase();
}
