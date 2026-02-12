import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { URL } from "node:url";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";
import { AiChatRequest, AiEditsRequest, JsonObject, StoredSettings } from "../types.js";
import { HttpError } from "../utils/http.js";
import { sanitizeHostname } from "../utils/path.js";
import { LocalStore } from "../store/localStore.js";
import { cuboidEditSystemPrompt, cuboidSystemPrompt } from "./aiPrompts.js";

function decodeBody(res: any, chunks: Buffer[]): string {
  const body = Buffer.concat(chunks);
  const encoding = String(res?.headers?.["content-encoding"] || "").toLowerCase();
  try {
    if (encoding.includes("gzip")) {
      return gunzipSync(body).toString("utf8");
    }
    if (encoding.includes("deflate")) {
      return inflateSync(body).toString("utf8");
    }
    if (encoding.includes("br")) {
      return brotliDecompressSync(body).toString("utf8");
    }
  } catch {
    // fall through to plain decode
  }
  return body.toString("utf8");
}

function parseEventStream(raw: string): JsonObject | null {
  const lines = raw.split(/\r?\n/g);
  let aggregated = "";
  let last: any = null;

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      last = parsed;
      const delta = parsed?.choices?.[0]?.delta;
      if (typeof delta?.content === "string") {
        aggregated += delta.content;
      }
    } catch {
      continue;
    }
  }

  if (!last) return null;
  if (aggregated.length > 0) {
    const baseChoice = last?.choices?.[0] ?? {};
    return {
      ...last,
      choices: [{
        ...baseChoice,
        message: { role: "assistant", content: aggregated }
      }]
    } as JsonObject;
  }
  return last as JsonObject;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeExtraBody(payload: JsonObject, extraBody: unknown): void {
  if (!isPlainObject(extraBody)) return;
  // Never allow overriding required core fields.
  const blocked = new Set(["model", "messages", "stream"]);
  for (const [key, value] of Object.entries(extraBody)) {
    if (blocked.has(key)) continue;
    payload[key] = value as any;
  }
}

function requestJson(url: URL, method: string, headers: Record<string, string>, payload: unknown): Promise<JsonObject> {
  return new Promise<JsonObject>((resolve, reject) => {
    const body = JSON.stringify(payload);
    const fn = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = fn(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number(url.port) : undefined,
        method,
        path: `${url.pathname}${url.search}`,
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body).toString()
        },
        timeout: 120000
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const raw = decodeBody(res, chunks);
          let parsed: JsonObject;
          try {
            parsed = raw.length > 0 ? (JSON.parse(raw) as JsonObject) : {};
          } catch {
            const maybeStream = parseEventStream(raw);
            if (maybeStream) {
              resolve(maybeStream);
              return;
            }
            const ct = String(res.headers["content-type"] || "");
            const enc = String(res.headers["content-encoding"] || "");
            const snippet = raw.slice(0, 240).replace(/\s+/g, " ").trim();
            reject(new HttpError(502, `AI provider returned invalid JSON (ct=${ct} enc=${enc}): ${snippet}`));
            return;
          }
          if ((res.statusCode ?? 500) >= 400) {
            const maybeError = parsed.error;
            const message =
              typeof maybeError === "string"
                ? maybeError
                : "AI provider rejected the request.";
            reject(new HttpError(502, message));
            return;
          }
          resolve(parsed);
        });
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
      reject(new HttpError(504, "AI provider timeout."));
    });
    req.on("error", (error: Error) => {
      const detail = error?.message ? `: ${error.message}` : "";
      reject(new HttpError(502, `AI provider request failed${detail}`));
    });
    req.write(body);
    req.end();
  });
}

function requestJsonNoBody(url: URL, method: string, headers: Record<string, string>): Promise<JsonObject> {
  return new Promise<JsonObject>((resolve, reject) => {
    const fn = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = fn(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number(url.port) : undefined,
        method,
        path: `${url.pathname}${url.search}`,
        headers,
        timeout: 120000
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const raw = decodeBody(res, chunks);
          let parsed: JsonObject;
          try {
            parsed = raw.length > 0 ? (JSON.parse(raw) as JsonObject) : {};
          } catch {
            const maybeStream = parseEventStream(raw);
            if (maybeStream) {
              resolve(maybeStream);
              return;
            }
            const ct = String(res.headers["content-type"] || "");
            const enc = String(res.headers["content-encoding"] || "");
            const snippet = raw.slice(0, 240).replace(/\s+/g, " ").trim();
            reject(new HttpError(502, `AI provider returned invalid JSON (ct=${ct} enc=${enc}): ${snippet}`));
            return;
          }
          if ((res.statusCode ?? 500) >= 400) {
            reject(new HttpError(502, "AI provider rejected the request."));
            return;
          }
          resolve(parsed);
        });
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
      reject(new HttpError(504, "AI provider timeout."));
    });
    req.on("error", (error: Error) => {
      const detail = error?.message ? `: ${error.message}` : "";
      reject(new HttpError(502, `AI provider request failed${detail}`));
    });
    req.end();
  });
}

function assertAiPolicy(settings: StoredSettings): URL {
  if (!settings.aiEnabled) {
    throw new HttpError(403, "AI is disabled by local policy.");
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(settings.aiBaseUrl);
  } catch {
    throw new HttpError(500, "Invalid aiBaseUrl setting.");
  }
  if (baseUrl.protocol !== "https:") {
    throw new HttpError(403, "AI base URL must use https.");
  }
  const host = sanitizeHostname(baseUrl.hostname);
  const allowed = settings.allowedAiDomains.map((domain) => sanitizeHostname(domain));
  if (!allowed.includes(host)) {
    throw new HttpError(403, "Outbound AI domain is blocked by policy.");
  }
  return baseUrl;
}

export class AiRouterService {
  private readonly store: LocalStore;

  constructor(store: LocalStore) {
    this.store = store;
  }

  async models(): Promise<JsonObject> {
    const settings = await this.store.getSettings();
    const baseUrl = assertAiPolicy(settings);
    const apiKey = await this.store.getAiApiKey();
    if (!apiKey) {
      throw new HttpError(400, "NVIDIA API key is not configured.");
    }
    const endpoint = new URL("/v1/models", baseUrl);
    return await requestJsonNoBody(endpoint, "GET", {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    });
  }

  async chat(input: AiChatRequest): Promise<JsonObject> {
    if (!Array.isArray(input.messages) || input.messages.length === 0) {
      throw new HttpError(400, "messages[] is required.");
    }
    const settings = await this.store.getSettings();
    const baseUrl = assertAiPolicy(settings);
    const apiKey = await this.store.getAiApiKey();
    if (!apiKey) {
      throw new HttpError(400, "NVIDIA API key is not configured.");
    }

    const messages = input.messages.slice();
    const first = messages[0] as any;
    if (!first || first.role !== "system") {
      messages.unshift({
        role: "system",
        content: cuboidSystemPrompt(),
      } as any);
    }

    const endpoint = new URL("/v1/chat/completions", baseUrl);
    const payload: JsonObject = {
      model: input.model ?? settings.aiModel,
      messages: messages as unknown as JsonObject[]
    };
    // Some NVIDIA models/examples default to streaming responses.
    // Cuboid v1 expects a single JSON response body.
    payload.stream = false;
    if (typeof input.temperature === "number") {
      payload.temperature = input.temperature;
    }
    if (typeof input.maxTokens === "number") {
      payload.max_tokens = input.maxTokens;
    }
    mergeExtraBody(payload, input.extraBody);

    return await requestJson(
      endpoint,
      "POST",
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      },
      payload
    );
  }

  async edits(input: AiEditsRequest): Promise<JsonObject> {
    if (!input.instruction || !input.input) {
      throw new HttpError(400, "instruction and input are required.");
    }
    const messages = [
      {
        role: "system" as const,
        content: cuboidEditSystemPrompt()
      },
      {
        role: "user" as const,
        content: `Instruction:\n${input.instruction}\n\nInput:\n${input.input}`
      }
    ];
    const req: AiChatRequest = { messages };
    if (typeof input.model === "string" && input.model.trim().length > 0) {
      req.model = input.model.trim();
    }
    if (typeof input.temperature === "number") {
      req.temperature = input.temperature;
    }
    return await this.chat(req);
  }
}
