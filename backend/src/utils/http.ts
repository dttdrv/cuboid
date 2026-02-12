import type { IncomingMessage, ServerResponse } from "node:http";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "http://127.0.0.1:4174",
  "http://localhost:4174",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5174",
].join(",");

function allowedOrigins(): string[] {
  return (process.env.CUBOID_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function requestOrigin(req: IncomingMessage): string | null {
  const origin = req.headers.origin;
  return typeof origin === "string" && origin.length > 0 ? origin : null;
}

function resolvedCorsOrigin(req: IncomingMessage): string | null {
  const origin = requestOrigin(req);
  if (!origin) return null;
  return allowedOrigins().includes(origin) ? origin : null;
}

export function assertCorsAllowed(req: IncomingMessage): void {
  const origin = requestOrigin(req);
  if (!origin) return;
  if (!resolvedCorsOrigin(req)) {
    throw new HttpError(403, "Origin is not allowed.");
  }
}

export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function getRawPath(urlValue: string | undefined): string {
  if (!urlValue) {
    return "/";
  }
  const queryIndex = urlValue.indexOf("?");
  return queryIndex === -1 ? urlValue : urlValue.slice(0, queryIndex);
}

export async function readJsonBody<T>(req: IncomingMessage, maxBytes = 1024 * 1024): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;

    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new HttpError(413, "Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        if (raw.length === 0) {
          reject(new HttpError(400, "Request body is required."));
          return;
        }
        resolve(JSON.parse(raw) as T);
      } catch {
        reject(new HttpError(400, "Invalid JSON body."));
      }
    });

    req.on("error", () => {
      reject(new HttpError(400, "Unable to read request body."));
    });
  });
}

export function setCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = resolvedCorsOrigin(req);
  if (!origin) {
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export function sendJson(req: IncomingMessage, res: ServerResponse, statusCode: number, payload: unknown): void {
  setCorsHeaders(req, res);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(`${JSON.stringify(payload)}\n`);
}

export function sendError(req: IncomingMessage, res: ServerResponse, error: unknown): void {
  if (error instanceof HttpError) {
    sendJson(req, res, error.statusCode, { error: error.message });
    return;
  }
  sendJson(req, res, 500, { error: "Internal server error." });
}
