import { readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
import { URL } from "node:url";
import {
  CompileJobEvent,
  CompileJobRecord,
  ProjectFileEntry,
  ProjectManifest,
  SettingsResponse,
  SettingsUpdateRequest,
  StoredSettings
} from "../types.js";
import {
  appendJsonLine,
  ensureDir,
  fileExists,
  listFilesRecursive,
  readJsonFile,
  readJsonLines,
  writeJsonFileAtomic
} from "../utils/fs.js";
import { HttpError } from "../utils/http.js";
import { createId, nowIso } from "../utils/id.js";
import { safeJoin, sanitizeHostname, toSafeRelativePath } from "../utils/path.js";
import { SecretStore } from "../services/secrets.js";

const NVIDIA_API_KEY = "nvidia.api_key";
const NVIDIA_ALLOWED_DOMAINS = new Set(["integrate.api.nvidia.com", "build.nvidia.com"]);

function defaultCompileWorkerPath(): string {
  const binary = process.platform === "win32" ? "compile_worker.exe" : "compile_worker";
  return join(process.cwd(), "backend", "rust", "compile_worker", "target", "release", binary);
}

function defaultSettings(): StoredSettings {
  return {
    aiEnabled: true,
    aiProvider: "nvidia",
    aiBaseUrl: "https://integrate.api.nvidia.com",
    allowedAiDomains: ["integrate.api.nvidia.com", "build.nvidia.com"],
    aiModel: "moonshotai/kimi-k2.5",
    compileWorkerPath: process.env.CUBOID_COMPILE_WORKER_PATH ?? defaultCompileWorkerPath(),
    compileTimeoutMs: 120000
  };
}

export class LocalStore {
  readonly baseDir: string;
  readonly projectsDir: string;
  readonly compileJobsDir: string;
  readonly compileEventsDir: string;
  readonly buildRootDir: string;
  private readonly settingsPath: string;
  private readonly secrets: SecretStore;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? process.env.CUBOID_HOME ?? join(homedir(), ".cuboid");
    this.projectsDir = join(this.baseDir, "projects");
    this.compileJobsDir = join(this.baseDir, "compile", "jobs");
    this.compileEventsDir = join(this.baseDir, "compile", "events");
    this.buildRootDir = join(this.baseDir, "build");
    this.settingsPath = join(this.baseDir, "settings.json");
    this.secrets = new SecretStore(join(this.baseDir, "secrets.enc"));
  }

  async init(): Promise<void> {
    await Promise.all([
      ensureDir(this.baseDir),
      ensureDir(this.projectsDir),
      ensureDir(this.compileJobsDir),
      ensureDir(this.compileEventsDir),
      ensureDir(this.buildRootDir)
    ]);
    if (!(await fileExists(this.settingsPath))) {
      await writeJsonFileAtomic(this.settingsPath, defaultSettings());
    }
    const envKey = process.env.CUBOID_NVIDIA_API_KEY?.trim();
    if (envKey && envKey.length > 0) {
      await this.secrets.set(NVIDIA_API_KEY, envKey);
    }
  }

  async createProject(name?: string): Promise<ProjectManifest> {
    const now = nowIso();
    const id = createId("proj");
    const manifest: ProjectManifest = {
      id,
      name: name?.trim() ? name.trim() : `Project ${id}`,
      createdAt: now,
      updatedAt: now
    };
    await ensureDir(this.projectFilesDir(id));
    await writeJsonFileAtomic(this.projectManifestPath(id), manifest);
    return manifest;
  }

  async ensureProject(projectId: string, name?: string): Promise<ProjectManifest> {
    const existing = await this.getProjectManifest(projectId);
    if (existing) {
      return existing;
    }

    const now = nowIso();
    const manifest: ProjectManifest = {
      id: projectId,
      name: name?.trim() ? name.trim() : `Project ${projectId}`,
      createdAt: now,
      updatedAt: now,
    };
    await ensureDir(this.projectFilesDir(projectId));
    await writeJsonFileAtomic(this.projectManifestPath(projectId), manifest);
    return manifest;
  }

  async listProjects(): Promise<ProjectManifest[]> {
    const entries = await listFilesRecursive(this.projectsDir);
    const manifests: ProjectManifest[] = [];
    for (const filePath of entries) {
      if (!filePath.endsWith("manifest.json")) {
        continue;
      }
      const manifest = await readJsonFile<ProjectManifest>(filePath);
      if (manifest) {
        manifests.push(manifest);
      }
    }
    manifests.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return manifests;
  }

  async getProjectManifest(projectId: string): Promise<ProjectManifest | null> {
    return await readJsonFile<ProjectManifest>(this.projectManifestPath(projectId));
  }

  async listProjectFiles(projectId: string): Promise<ProjectFileEntry[]> {
    const root = this.projectFilesDir(projectId);
    const files = await listFilesRecursive(root);
    const out: ProjectFileEntry[] = [];
    for (const absolutePath of files) {
      try {
        const stats = await stat(absolutePath);
        const rel = relative(root, absolutePath).replace(/\\/g, "/");
        out.push({
          path: rel,
          size: stats.size,
          modifiedAt: stats.mtime.toISOString()
        });
      } catch {
        continue;
      }
    }
    out.sort((a, b) => a.path.localeCompare(b.path));
    return out;
  }

  async writeProjectFile(
    projectId: string,
    relativePath: string,
    content: string,
    encoding: "utf8" | "base64"
  ): Promise<void> {
    const manifest = await this.getProjectManifest(projectId);
    if (!manifest) {
      throw new HttpError(404, "Project not found.");
    }
    const cleanPath = toSafeRelativePath(relativePath);
    const target = safeJoin(this.projectFilesDir(projectId), cleanPath);
    await ensureDir(dirname(target));
    const data = encoding === "base64" ? Buffer.from(content, "base64") : Buffer.from(content, "utf8");
    await writeFile(target, data);
    const updated: ProjectManifest = { ...manifest, updatedAt: nowIso() };
    await writeJsonFileAtomic(this.projectManifestPath(projectId), updated);
  }

  async readProjectFile(
    projectId: string,
    relativePath: string,
    encoding: "utf8" | "base64",
  ): Promise<string> {
    const manifest = await this.getProjectManifest(projectId);
    if (!manifest) {
      throw new HttpError(404, "Project not found.");
    }
    const cleanPath = toSafeRelativePath(relativePath);
    const target = safeJoin(this.projectFilesDir(projectId), cleanPath);
    let data: Buffer;
    try {
      data = await readFile(target);
    } catch {
      throw new HttpError(404, "File not found.");
    }
    return encoding === "base64" ? data.toString("base64") : data.toString("utf8");
  }

  async getSettings(): Promise<StoredSettings> {
    const fromDisk = await readJsonFile<Record<string, unknown>>(this.settingsPath);
    if (!fromDisk) {
      const defaults = defaultSettings();
      await writeJsonFileAtomic(this.settingsPath, defaults);
      return defaults;
    }
    const fallback = defaultSettings();
    const legacyBaseUrl = typeof fromDisk.openRouterBaseUrl === "string" ? fromDisk.openRouterBaseUrl : null;
    const baseUrlRaw = typeof fromDisk.aiBaseUrl === "string"
      ? fromDisk.aiBaseUrl
      : legacyBaseUrl || fallback.aiBaseUrl;
    const rawAllowedDomains = Array.isArray(fromDisk.allowedAiDomains)
      ? fromDisk.allowedAiDomains
        .map((domain) => (typeof domain === "string" ? sanitizeHostname(domain) : ""))
        .filter((domain) => domain.length > 0)
      : fallback.allowedAiDomains;
    const allowedAiDomains = rawAllowedDomains.filter((domain) => NVIDIA_ALLOWED_DOMAINS.has(domain));
    let parsedBaseUrl: URL | null = null;
    try {
      parsedBaseUrl = new URL(baseUrlRaw);
    } catch {
      parsedBaseUrl = null;
    }
    const baseUrl = parsedBaseUrl && parsedBaseUrl.protocol === "https:" && NVIDIA_ALLOWED_DOMAINS.has(sanitizeHostname(parsedBaseUrl.hostname))
      ? parsedBaseUrl.origin
      : fallback.aiBaseUrl;
    return {
      aiEnabled: typeof fromDisk.aiEnabled === "boolean" ? fromDisk.aiEnabled : fallback.aiEnabled,
      aiProvider: "nvidia",
      aiBaseUrl: baseUrl,
      allowedAiDomains: allowedAiDomains.length > 0 ? allowedAiDomains : fallback.allowedAiDomains,
      aiModel: (() => {
        const raw = typeof fromDisk.aiModel === "string" ? fromDisk.aiModel.trim() : "";
        if (!raw) return fallback.aiModel;
        if (raw === "moonshotai/kimi-k2-5") return "moonshotai/kimi-k2.5";
        return raw;
      })(),
      compileWorkerPath: typeof fromDisk.compileWorkerPath === "string" && fromDisk.compileWorkerPath.trim().length > 0
        ? fromDisk.compileWorkerPath
        : fallback.compileWorkerPath,
      compileTimeoutMs:
        typeof fromDisk.compileTimeoutMs === "number" && Number.isFinite(fromDisk.compileTimeoutMs)
          ? fromDisk.compileTimeoutMs
          : fallback.compileTimeoutMs
    };
  }

  async getSettingsResponse(): Promise<SettingsResponse> {
    const settings = await this.getSettings();
    return {
      ...settings,
      hasAiApiKey: await this.secrets.has(NVIDIA_API_KEY)
    };
  }

  async updateSettings(update: SettingsUpdateRequest): Promise<SettingsResponse> {
    const current = await this.getSettings();
    const nextBaseUrl = update.aiBaseUrl?.trim() || current.aiBaseUrl;
    let parsedBaseUrl: URL;
    try {
      parsedBaseUrl = new URL(nextBaseUrl);
    } catch {
      throw new HttpError(400, "aiBaseUrl must be a valid URL.");
    }
    if (parsedBaseUrl.protocol !== "https:") {
      throw new HttpError(400, "aiBaseUrl must use https.");
    }
    const sanitizedBaseHost = sanitizeHostname(parsedBaseUrl.hostname);
    if (!NVIDIA_ALLOWED_DOMAINS.has(sanitizedBaseHost)) {
      throw new HttpError(400, "aiBaseUrl host is not allowed.");
    }

    const requestedDomains = update.allowedAiDomains
      ?.map((domain) => sanitizeHostname(domain))
      .filter((domain) => domain.length > 0) ?? current.allowedAiDomains;
    const safeDomains = requestedDomains.filter((domain) => NVIDIA_ALLOWED_DOMAINS.has(domain));
    if (safeDomains.length === 0) {
      throw new HttpError(400, "allowedAiDomains must contain at least one allowed NVIDIA domain.");
    }

    const next: StoredSettings = {
      aiEnabled: update.aiEnabled ?? current.aiEnabled,
      aiProvider: "nvidia",
      aiBaseUrl: parsedBaseUrl.origin,
      allowedAiDomains: safeDomains,
      aiModel: update.aiModel?.trim() || current.aiModel,
      compileWorkerPath: update.compileWorkerPath?.trim() || current.compileWorkerPath,
      compileTimeoutMs: update.compileTimeoutMs ?? current.compileTimeoutMs
    };

    if (next.compileTimeoutMs < 1000 || next.compileTimeoutMs > 10 * 60 * 1000) {
      throw new HttpError(400, "compileTimeoutMs must be between 1000 and 600000.");
    }

    await writeJsonFileAtomic(this.settingsPath, next);

    if (typeof update.aiApiKey === "string" && update.aiApiKey.trim().length > 0) {
      await this.secrets.set(NVIDIA_API_KEY, update.aiApiKey.trim());
    }
    if (update.aiApiKey === null) {
      await this.secrets.delete(NVIDIA_API_KEY);
    }

    return await this.getSettingsResponse();
  }

  async getAiApiKey(): Promise<string | null> {
    return await this.secrets.get(NVIDIA_API_KEY);
  }

  getProjectFilesRoot(projectId: string): string {
    return this.projectFilesDir(projectId);
  }

  getBuildDir(projectId: string, jobId: string): string {
    return join(this.buildRootDir, projectId, jobId);
  }

  async saveCompileJob(job: CompileJobRecord): Promise<void> {
    await writeJsonFileAtomic(this.compileJobPath(job.id), job);
  }

  async getCompileJob(jobId: string): Promise<CompileJobRecord | null> {
    return await readJsonFile<CompileJobRecord>(this.compileJobPath(jobId));
  }

  async appendCompileJobEvent(jobId: string, event: CompileJobEvent): Promise<void> {
    await appendJsonLine(this.compileEventsPath(jobId), event);
  }

  async getCompileJobEvents(jobId: string): Promise<CompileJobEvent[]> {
    return await readJsonLines<CompileJobEvent>(this.compileEventsPath(jobId));
  }

  private projectDir(projectId: string): string {
    return join(this.projectsDir, projectId);
  }

  private projectManifestPath(projectId: string): string {
    return join(this.projectDir(projectId), "manifest.json");
  }

  private projectFilesDir(projectId: string): string {
    return join(this.projectDir(projectId), "files");
  }

  private compileJobPath(jobId: string): string {
    return join(this.compileJobsDir, `${jobId}.json`);
  }

  private compileEventsPath(jobId: string): string {
    return join(this.compileEventsDir, `${jobId}.jsonl`);
  }
}
