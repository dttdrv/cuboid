import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { basename } from "node:path";
import { AiRouterService } from "./services/aiRouter.js";
import { CompileQueueService } from "./services/compileQueue.js";
import { LocalStore } from "./store/localStore.js";
import {
  AiChatRequest,
  AiEditsRequest,
  AiToggleRequest,
  CompileJobRequest,
  ProjectCreateRequest,
  ProjectFileWriteRequest,
  ProjectFileReadResponse,
  SettingsUpdateRequest,
} from "./types.js";
import { HttpError, assertCorsAllowed, getRawPath, readJsonBody, sendError, sendJson, setCorsHeaders } from "./utils/http.js";
import { decodeUrlPathComponent } from "./utils/path.js";

const API_PREFIX = "/v1";
const PORT = Number(process.env.CUBOID_BACKEND_PORT || "4173");

function normalizePath(pathValue: string): string {
  if (!pathValue || pathValue === "/") return "/";
  return pathValue.endsWith("/") ? pathValue.slice(0, -1) : pathValue;
}

function requireMethod(req: IncomingMessage, method: string): void {
  if (req.method !== method) {
    throw new HttpError(405, "Method not allowed.");
  }
}

function unwrapEditContent(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const strings = raw.filter((item) => typeof item === "string") as string[];
    if (strings.length > 0) return strings.join("\n");
    const textParts = raw
      .map((item) => {
        if (item && typeof item === "object") {
          const maybeType = (item as any).type;
          const maybeText = (item as any).text;
          if (maybeType === "text" && typeof maybeText === "string") return maybeText;
          if (typeof maybeText === "string") return maybeText;
        }
        return "";
      })
      .filter((s) => typeof s === "string" && s.length > 0);
    if (textParts.length > 0) return textParts.join("\n");
  }
  return "";
}

function buildEditSuggestions(prompt: string, response: any): Array<{ title: string; summary: string }> {
  const firstChoice = response?.choices?.[0];
  const content = unwrapEditContent(firstChoice?.message?.content);
  const reasoning = unwrapEditContent(
    firstChoice?.message?.reasoning
    ?? firstChoice?.message?.reasoning_content
    ?? firstChoice?.reasoning
    ?? firstChoice?.reasoning_content,
  );
  const summarySource = content.length > 0 ? content : reasoning;
  const summary = summarySource.length > 0
    ? summarySource.slice(0, 1200)
    : "AI returned no concrete patch; review prompt and retry.";
  return [{
    title: prompt.trim().slice(0, 120) || "AI suggestion",
    summary,
  }];
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  deps: {
    store: LocalStore;
    queue: CompileQueueService;
    aiRouter: AiRouterService;
  },
): Promise<void> {
  assertCorsAllowed(req);

  if (req.method === "OPTIONS") {
    setCorsHeaders(req, res);
    res.statusCode = 204;
    res.end();
    return;
  }

  const rawPath = normalizePath(getRawPath(req.url));
  if (!rawPath.startsWith(API_PREFIX)) {
    throw new HttpError(404, "Not found.");
  }

  if (rawPath === "/v1/health") {
    requireMethod(req, "GET");
    sendJson(req, res, 200, { status: "ok", now: new Date().toISOString() });
    return;
  }

  if (rawPath === "/v1/projects") {
    if (req.method === "GET") {
      const projects = await deps.store.listProjects();
      sendJson(req, res, 200, { projects });
      return;
    }
    if (req.method === "POST") {
      const body = await readJsonBody<ProjectCreateRequest>(req);
      const project = await deps.store.createProject(body?.name);
      await deps.store.writeProjectFile(project.id, "main.tex", "\\documentclass{article}\n\\begin{document}\n\\end{document}\n", "utf8");
      sendJson(req, res, 201, project);
      return;
    }
    throw new HttpError(405, "Method not allowed.");
  }

  const projectFilesMatch = rawPath.match(/^\/v1\/projects\/([^/]+)\/files$/);
  if (projectFilesMatch) {
    requireMethod(req, "GET");
    const projectIdPart = projectFilesMatch[1];
    if (!projectIdPart) throw new HttpError(400, "Project id is required.");
    const projectId = decodeUrlPathComponent(projectIdPart, "project id");
    const manifest = await deps.store.getProjectManifest(projectId);
    if (!manifest) throw new HttpError(404, "Project not found.");
    const files = await deps.store.listProjectFiles(projectId);
    sendJson(req, res, 200, { project: manifest, files });
    return;
  }

  const projectFileMatch = rawPath.match(/^\/v1\/projects\/([^/]+)\/files\/(.+)$/);
  if (projectFileMatch) {
    const projectIdPart = projectFileMatch[1];
    const filePathPart = projectFileMatch[2];
    if (!projectIdPart || !filePathPart) throw new HttpError(400, "Project id and file path are required.");
    const projectId = decodeUrlPathComponent(projectIdPart, "project id");
    const filePath = decodeUrlPathComponent(filePathPart, "file path");

    if (req.method === "GET") {
      const url = new URL(req.url || "", "http://127.0.0.1");
      const encoding = url.searchParams.get("encoding") === "base64" ? "base64" : "utf8";
      const content = await deps.store.readProjectFile(projectId, filePath, encoding);
      const payload: ProjectFileReadResponse = {
        projectId,
        path: filePath,
        encoding,
        content,
      };
      sendJson(req, res, 200, payload);
      return;
    }

    if (req.method === "PUT") {
      const body = await readJsonBody<ProjectFileWriteRequest>(req);
      if (typeof body.content !== "string") {
        throw new HttpError(400, "content is required.");
      }
      await deps.store.ensureProject(projectId);
      await deps.store.writeProjectFile(projectId, filePath, body.content, body.encoding ?? "utf8");
      sendJson(req, res, 200, { ok: true, projectId, path: filePath });
      return;
    }

    throw new HttpError(405, "Method not allowed.");
  }

  if (rawPath === "/v1/compile/jobs") {
    requireMethod(req, "POST");
    const body = await readJsonBody<CompileJobRequest>(req);
    const job = await deps.queue.enqueue(body);
    sendJson(req, res, 202, { jobId: job.id, status: job.status });
    return;
  }

  const compileJobMatch = rawPath.match(/^\/v1\/compile\/jobs\/([^/]+)$/);
  if (compileJobMatch) {
    requireMethod(req, "GET");
    const jobIdPart = compileJobMatch[1];
    if (!jobIdPart) throw new HttpError(400, "Job id is required.");
    const jobId = decodeUrlPathComponent(jobIdPart, "job id");
    const job = await deps.queue.getJob(jobId);
    if (!job) throw new HttpError(404, "Compile job not found.");
    sendJson(req, res, 200, job);
    return;
  }

  const compileEventsMatch = rawPath.match(/^\/v1\/compile\/jobs\/([^/]+)\/events$/);
  if (compileEventsMatch) {
    requireMethod(req, "GET");
    const jobIdPart = compileEventsMatch[1];
    if (!jobIdPart) throw new HttpError(400, "Job id is required.");
    const jobId = decodeUrlPathComponent(jobIdPart, "job id");
    const events = await deps.queue.getEvents(jobId);
    sendJson(req, res, 200, { events });
    return;
  }

  const compileCancelMatch = rawPath.match(/^\/v1\/compile\/jobs\/([^/]+)\/cancel$/);
  if (compileCancelMatch) {
    requireMethod(req, "PUT");
    const jobIdPart = compileCancelMatch[1];
    if (!jobIdPart) throw new HttpError(400, "Job id is required.");
    const jobId = decodeUrlPathComponent(jobIdPart, "job id");
    const cancelled = await deps.queue.cancel(jobId);
    if (!cancelled) throw new HttpError(404, "Compile job not found.");
    sendJson(req, res, 200, cancelled);
    return;
  }

  if (rawPath === "/v1/settings") {
    if (req.method === "GET") {
      const settings = await deps.store.getSettingsResponse();
      sendJson(req, res, 200, settings);
      return;
    }
    if (req.method === "PUT") {
      const body = await readJsonBody<SettingsUpdateRequest & { openRouterApiKey?: string | null }>(req);
      const update: SettingsUpdateRequest = {};
      if (typeof body.aiEnabled === "boolean") update.aiEnabled = body.aiEnabled;
      if (body.aiProvider === "nvidia") update.aiProvider = body.aiProvider;
      if (typeof body.aiBaseUrl === "string") update.aiBaseUrl = body.aiBaseUrl;
      if (Array.isArray(body.allowedAiDomains)) update.allowedAiDomains = body.allowedAiDomains;
      if (typeof body.aiModel === "string") update.aiModel = body.aiModel;
      if (typeof body.compileWorkerPath === "string") update.compileWorkerPath = body.compileWorkerPath;
      if (typeof body.compileTimeoutMs === "number") update.compileTimeoutMs = body.compileTimeoutMs;
      const candidateApiKey = typeof body.aiApiKey !== "undefined" ? body.aiApiKey : body.openRouterApiKey;
      if (candidateApiKey === null || typeof candidateApiKey === "string") {
        update.aiApiKey = candidateApiKey;
      }
      const updated = await deps.store.updateSettings(update);
      sendJson(req, res, 200, updated);
      return;
    }
    throw new HttpError(405, "Method not allowed.");
  }

  if (rawPath === "/v1/settings/ai-toggle") {
    requireMethod(req, "PUT");
    const body = await readJsonBody<AiToggleRequest>(req);
    if (typeof body.enabled !== "boolean") {
      throw new HttpError(400, "enabled (boolean) is required.");
    }
    const updated = await deps.store.updateSettings({ aiEnabled: body.enabled });
    sendJson(req, res, 200, updated);
    return;
  }

  if (rawPath === "/v1/ai/chat") {
    requireMethod(req, "POST");
    const body = await readJsonBody<AiChatRequest>(req);
    const response = await deps.aiRouter.chat(body);
    sendJson(req, res, 200, {
      provider: "nvidia",
      response,
    });
    return;
  }

  if (rawPath === "/v1/ai/models") {
    requireMethod(req, "GET");
    const response = await deps.aiRouter.models();
    sendJson(req, res, 200, {
      provider: "nvidia",
      response,
    });
    return;
  }

  if (rawPath === "/v1/ai/edits") {
    requireMethod(req, "POST");
    const body = await readJsonBody<any>(req);
    const prompt = String(body.prompt || body.instruction || "").trim();
    const content = String(body.content || body.input || "").trim();
    if (!prompt || !content) {
      throw new HttpError(400, "prompt and content are required.");
    }
    const editsReq: AiEditsRequest = {
      instruction: prompt,
      input: content,
    };
    if (typeof body.model === "string" && body.model.trim().length > 0) {
      editsReq.model = body.model.trim();
    }
    if (typeof body.temperature === "number") {
      editsReq.temperature = body.temperature;
    }
    const selection = typeof body.selection === "object" && body.selection
      ? body.selection
      : { startLine: 1, endLine: 1 };
    const response = await deps.aiRouter.edits(editsReq);
    const baseSuggestions = buildEditSuggestions(prompt, response);
    const suggestions = baseSuggestions.map((item) => ({
      ...item,
      startLine: Number(selection.startLine || 1),
      endLine: Number(selection.endLine || selection.startLine || 1),
    }));
    sendJson(req, res, 200, {
      provider: "nvidia",
      model: editsReq.model || "default",
      suggestions,
      raw: response,
    });
    return;
  }

  throw new HttpError(404, "Not found.");
}

async function main(): Promise<void> {
  const store = new LocalStore();
  await store.init();
  const queue = new CompileQueueService(store);
  const aiRouter = new AiRouterService(store);

  const server = createServer((req, res) => {
    void handleRequest(req, res, { store, queue, aiRouter }).catch((error) => {
      sendError(req, res, error);
    });
  });

  server.listen(PORT, "127.0.0.1", () => {
    const mode = process.env.NODE_ENV || "development";
    const workerName = basename((process.env.CUBOID_COMPILE_WORKER_PATH || "").trim() || "default");
    console.log(`[cuboidd] listening on http://127.0.0.1:${PORT} (${mode}, worker=${workerName})`);
  });
}

void main().catch((error) => {
  console.error("[cuboidd] startup failed", error);
  process.exit(1);
});
