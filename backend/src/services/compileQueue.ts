import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { LocalStore } from "../store/localStore.js";
import { CompileJobEvent, CompileJobRecord, CompileJobRequest, CompileWorkerRequest, CompileWorkerResponse } from "../types.js";
import { HttpError } from "../utils/http.js";
import { createId, nowIso } from "../utils/id.js";
import { fileExists } from "../utils/fs.js";

const MAX_QUEUE_ITEMS = 8;

interface DiagnosticLike {
  id: string;
  severity: "error" | "warning" | "note";
  fileId: string;
  line: number;
  column: number;
  message: string;
}

type QueueItem = {
  jobId: string;
};

export interface CompileJobView {
  id: string;
  projectId: string;
  mainFile: string;
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  log: string;
  diagnostics: DiagnosticLike[];
  pdfBase64?: string;
  error?: string;
}

function parseDiagnostics(log: string, fileId: string): DiagnosticLike[] {
  const lines = log.split(/\r?\n/g);
  const out: DiagnosticLike[] = [];
  let fallback = 1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const lineMatch = line.match(/(?:^|\s)l\.(\d+)/);
    if (lineMatch) {
      fallback = Number(lineMatch[1] || fallback);
    }
    if (line.startsWith("! ")) {
      out.push({
        id: `diag-${i}`,
        severity: "error",
        line: fallback,
        column: 1,
        message: line.replace(/^!\s*/, "") || "LaTeX compile error",
        fileId,
      });
    } else if (/warning/i.test(line)) {
      out.push({
        id: `diag-${i}`,
        severity: "warning",
        line: fallback,
        column: 1,
        message: line.trim() || "LaTeX warning",
        fileId,
      });
    }
  }
  return out;
}

function normalizeWorkerError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function readBase64(pathValue: string | null): Promise<string | undefined> {
  if (!pathValue) return undefined;
  if (!(await fileExists(pathValue))) return undefined;
  const bytes = await readFile(pathValue);
  return bytes.toString("base64");
}

export class CompileQueueService {
  private readonly store: LocalStore;
  private readonly queue: QueueItem[] = [];
  private activeJobId: string | null = null;
  private activeChild: ReturnType<typeof spawn> | null = null;
  private readonly cancelRequested = new Set<string>();

  constructor(store: LocalStore) {
    this.store = store;
  }

  async enqueue(request: CompileJobRequest): Promise<CompileJobRecord> {
    if (!request.projectId || request.projectId.trim().length === 0) {
      throw new HttpError(400, "projectId is required.");
    }

    const settings = await this.store.getSettings();
    const projectId = request.projectId.trim();
    const mainFile = request.mainFile?.trim() || "main.tex";
    const timeoutMs = request.timeoutMs ?? settings.compileTimeoutMs;
    const jobId = createId("job");

    if (this.queue.length >= MAX_QUEUE_ITEMS) {
      throw new HttpError(429, "Compile queue is full.");
    }

    await this.store.ensureProject(projectId);
    if (typeof request.content === "string") {
      await this.store.writeProjectFile(projectId, mainFile, request.content, "utf8");
    }
    const buildDir = this.store.getBuildDir(projectId, jobId);
    const now = nowIso();
    const job: CompileJobRecord = {
      id: jobId,
      projectId,
      mainFile,
      timeoutMs,
      status: "queued",
      workerPath: settings.compileWorkerPath,
      buildDir,
      createdAt: now,
      updatedAt: now,
    };

    await this.store.saveCompileJob(job);
    await this.appendEvent(job.id, {
      timestamp: nowIso(),
      level: "info",
      message: "Compile job queued.",
      data: {
        mainFile,
      },
    });
    this.queue.push({ jobId: job.id });
    void this.pump();
    return job;
  }

  async cancel(jobId: string): Promise<CompileJobView | null> {
    const job = await this.store.getCompileJob(jobId);
    if (!job) return null;

    // If queued, drop from the queue immediately.
    const before = this.queue.length;
    for (let i = this.queue.length - 1; i >= 0; i -= 1) {
      if (this.queue[i]?.jobId === jobId) {
        this.queue.splice(i, 1);
      }
    }
    const removedFromQueue = this.queue.length !== before;

    if (job.status === "queued" && removedFromQueue) {
      const now = nowIso();
      await this.store.saveCompileJob({
        ...job,
        status: "cancelled",
        finishedAt: now,
        updatedAt: now,
        errorMessage: "Cancelled.",
      });
      await this.appendEvent(jobId, {
        timestamp: nowIso(),
        level: "info",
        message: "Compile job cancelled (queued).",
      });
      return await this.getJob(jobId);
    }

    // If running, mark cancel requested and kill the worker process.
    if (job.status === "running" && this.activeJobId === jobId) {
      this.cancelRequested.add(jobId);
      if (this.activeChild && !this.activeChild.killed) {
        try {
          this.activeChild.kill();
        } catch {
          // ignore
        }
      }
      await this.appendEvent(jobId, {
        timestamp: nowIso(),
        level: "info",
        message: "Cancel requested for running compile job.",
      });
      return await this.getJob(jobId);
    }

    // If already terminal, return state as-is.
    return await this.getJob(jobId);
  }

  async getJob(jobId: string): Promise<CompileJobView | null> {
    const job = await this.store.getCompileJob(jobId);
    if (!job) return null;

    const logParts: string[] = [];
    if (job.workerResult?.stdout) logParts.push(job.workerResult.stdout);
    if (job.workerResult?.stderr) logParts.push(job.workerResult.stderr);
    if (job.errorMessage) logParts.push(job.errorMessage);
    const log = logParts.join("\n").trim();
    const diagnostics = parseDiagnostics(log, job.mainFile);
    const pdfBase64 = job.status === "success"
      ? await readBase64(job.workerResult?.pdfPath ?? null)
      : undefined;

    const view: CompileJobView = {
      id: job.id,
      projectId: job.projectId,
      mainFile: job.mainFile,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      log,
      diagnostics,
    };
    if (job.startedAt) view.startedAt = job.startedAt;
    if (job.finishedAt) view.finishedAt = job.finishedAt;
    if (pdfBase64) view.pdfBase64 = pdfBase64;
    if (job.errorMessage) view.error = job.errorMessage;
    return view;
  }

  async getEvents(jobId: string): Promise<CompileJobEvent[]> {
    return this.store.getCompileJobEvents(jobId);
  }

  private async pump(): Promise<void> {
    if (this.activeJobId || this.queue.length === 0) return;
    const next = this.queue.shift();
    if (!next) return;
    this.activeJobId = next.jobId;
    try {
      await this.run(next.jobId);
    } finally {
      this.activeJobId = null;
      if (this.queue.length > 0) {
        void this.pump();
      }
    }
  }

  private async run(jobId: string): Promise<void> {
    const job = await this.store.getCompileJob(jobId);
    if (!job) return;

    const startedAt = nowIso();
    const runningJob: CompileJobRecord = {
      ...job,
      status: "running",
      startedAt,
      updatedAt: startedAt,
    };
    await this.store.saveCompileJob(runningJob);
    await this.appendEvent(jobId, {
      timestamp: nowIso(),
      level: "info",
      message: "Compile job started.",
      data: {
        workerPath: runningJob.workerPath,
      },
    });

    let workerResult: CompileWorkerResponse | undefined;
    let finalStatus: CompileJobRecord["status"] = "failed";
    let errorMessage: string | undefined;

    try {
      const projectRoot = this.store.getProjectFilesRoot(job.projectId);
      workerResult = await this.invokeWorker(runningJob.workerPath, {
        projectRoot,
        mainFile: runningJob.mainFile,
        buildDir: runningJob.buildDir,
        timeoutMs: runningJob.timeoutMs,
      });

      if (this.cancelRequested.has(jobId)) {
        finalStatus = "cancelled";
        errorMessage = "Cancelled.";
      } else if (workerResult.success) {
        finalStatus = "success";
      } else {
        finalStatus = workerResult.timedOut ? "cancelled" : "failed";
        errorMessage = workerResult.error || "Compilation failed.";
      }
    } catch (error) {
      finalStatus = "failed";
      errorMessage = normalizeWorkerError(error);
    }

    const finishedAt = nowIso();
    const finalJob: CompileJobRecord = {
      ...runningJob,
      status: finalStatus,
      finishedAt,
      updatedAt: finishedAt,
    };
    if (workerResult) {
      finalJob.workerResult = workerResult;
    }
    if (errorMessage) {
      finalJob.errorMessage = errorMessage;
    }
    await this.store.saveCompileJob(finalJob);
    const eventData: Record<string, string> = {};
    if (errorMessage) {
      eventData.errorMessage = errorMessage;
    }
    await this.appendEvent(jobId, {
      timestamp: nowIso(),
      level: finalStatus === "success" ? "info" : "error",
      message: `Compile job ${finalStatus}.`,
      data: eventData,
    });

    this.cancelRequested.delete(jobId);
  }

  private async appendEvent(jobId: string, event: CompileJobEvent): Promise<void> {
    await this.store.appendCompileJobEvent(jobId, event);
  }

  private async invokeWorker(workerPath: string, request: CompileWorkerRequest): Promise<CompileWorkerResponse> {
    if (!(await fileExists(workerPath))) {
      const fallbackManifest = join(process.cwd(), "backend", "rust", "compile_worker", "Cargo.toml");
      if (await fileExists(fallbackManifest)) {
        return this.spawnWorker("cargo", [
          "run",
          "--manifest-path",
          fallbackManifest,
          "--release",
          "--quiet",
        ], request);
      }
      throw new HttpError(500, `Compile worker not found at ${workerPath}`);
    }

    return this.spawnWorker(workerPath, [], request);
  }

  private async spawnWorker(command: string, args: string[], request: CompileWorkerRequest): Promise<CompileWorkerResponse> {
    return await new Promise<CompileWorkerResponse>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });
      this.activeChild = child;
      let stdout = "";
      let stderr = "";

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });
      child.on("error", reject);

      child.on("close", (code) => {
        if (this.activeChild === child) {
          this.activeChild = null;
        }
        const raw = stdout.trim();
        if (raw.length === 0) {
          resolve({
            success: false,
            timedOut: false,
            exitCode: code,
            stdout,
            stderr,
            pdfPath: null,
            logPath: null,
            pdfBytes: null,
            logBytes: null,
            error: "Compile worker produced empty output.",
          });
          return;
        }

        try {
          const parsed = JSON.parse(raw) as CompileWorkerResponse;
          resolve(parsed);
        } catch {
          resolve({
            success: false,
            timedOut: false,
            exitCode: code,
            stdout,
            stderr,
            pdfPath: null,
            logPath: null,
            pdfBytes: null,
            logBytes: null,
            error: "Compile worker returned non-JSON output.",
          });
        }
      });

      child.stdin.write(`${JSON.stringify(request)}\n`);
      child.stdin.end();
    });
  }
}
