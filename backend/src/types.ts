export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {}

export interface HealthResponse {
  status: "ok";
  now: string;
}

export interface ProjectManifest {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateRequest {
  name?: string;
}

export interface ProjectFileEntry {
  path: string;
  size: number;
  modifiedAt: string;
}

export interface ProjectFileReadResponse {
  projectId: string;
  path: string;
  encoding: "utf8" | "base64";
  content: string;
}

export interface ProjectFileWriteRequest {
  content: string;
  encoding?: "utf8" | "base64";
}

export interface StoredSettings {
  aiEnabled: boolean;
  aiProvider: "nvidia";
  aiBaseUrl: string;
  allowedAiDomains: string[];
  aiModel: string;
  compileWorkerPath: string;
  compileTimeoutMs: number;
}

export interface SettingsResponse extends StoredSettings {
  hasAiApiKey: boolean;
}

export interface SettingsUpdateRequest {
  aiEnabled?: boolean;
  aiProvider?: "nvidia";
  aiBaseUrl?: string;
  allowedAiDomains?: string[];
  aiModel?: string;
  compileWorkerPath?: string;
  compileTimeoutMs?: number;
  aiApiKey?: string | null;
}

export interface AiToggleRequest {
  enabled: boolean;
}

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  // NVIDIA's OpenAI-compatible endpoint supports multimodal content arrays
  // for some models (e.g. [{type:"text",...},{type:"image_url",...}]).
  content: JsonValue;
}

export interface AiChatRequest {
  model?: string;
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  // Provider-specific extensions (e.g. Kimi "thinking" controls) can be sent here.
  extraBody?: JsonObject;
}

export interface AiChatResponse {
  provider: "nvidia";
  raw: JsonObject;
}

export interface AiEditsRequest {
  model?: string;
  instruction: string;
  input: string;
  temperature?: number;
}

export interface CompileJobRequest {
  projectId: string;
  mainFile?: string;
  timeoutMs?: number;
  content?: string;
}

export type CompileJobStatus = "queued" | "running" | "success" | "failed" | "cancelled";

export interface CompileWorkerRequest {
  projectRoot: string;
  mainFile: string;
  buildDir: string;
  timeoutMs: number;
}

export interface CompileWorkerResponse {
  success: boolean;
  timedOut: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  pdfPath: string | null;
  logPath: string | null;
  pdfBytes: number | null;
  logBytes: number | null;
  error?: string;
}

export interface CompileJobRecord {
  id: string;
  projectId: string;
  mainFile: string;
  timeoutMs: number;
  status: CompileJobStatus;
  workerPath: string;
  buildDir: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
  workerResult?: CompileWorkerResponse;
}

export interface CompileJobEvent {
  timestamp: string;
  level: "info" | "error";
  message: string;
  data?: JsonObject;
}
