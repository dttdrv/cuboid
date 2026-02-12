import { appendFile, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function ensureDir(pathValue: string): Promise<void> {
  await mkdir(pathValue, { recursive: true });
}

export async function fileExists(pathValue: string): Promise<boolean> {
  try {
    await stat(pathValue);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(pathValue: string): Promise<T | null> {
  try {
    const raw = await readFile(pathValue, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonFileAtomic(pathValue: string, value: unknown): Promise<void> {
  await ensureDir(dirname(pathValue));
  const tempPath = `${pathValue}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, pathValue);
}

export async function appendJsonLine(pathValue: string, value: unknown): Promise<void> {
  await ensureDir(dirname(pathValue));
  await appendFile(pathValue, `${JSON.stringify(value)}\n`, "utf8");
}

export async function readJsonLines<T>(pathValue: string): Promise<T[]> {
  try {
    const raw = await readFile(pathValue, "utf8");
    return raw
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

export async function listFilesRecursive(rootDir: string): Promise<string[]> {
  const out: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
      } else if (entry.isFile()) {
        out.push(absolute);
      }
    }
  }

  return out;
}
