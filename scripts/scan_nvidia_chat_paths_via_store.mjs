import { request as httpsRequest } from "node:https";
import { URL } from "node:url";
import { LocalStore } from "../backend/dist/store/localStore.js";

const store = new LocalStore();
await store.init();
const settings = await store.getSettings();
const apiKey = await store.getAiApiKey();
if (!apiKey) {
  console.error("No NVIDIA API key configured in local store.");
  process.exit(1);
}

const base = new URL(settings.aiBaseUrl);
const model = "moonshotai/kimi-k2.5";

const candidates = [
  "/v1/chat/completions",
  "/chat/completions",
  "/openai/v1/chat/completions",
  "/v1/openai/chat/completions",
  "/v1/openai/v1/chat/completions",
  "/api/v1/chat/completions",
  "/v1/api/chat/completions",
  "/v1/llm/chat/completions",
  "/v1/inference/chat/completions",
  "/v1/infer/chat/completions",
  "/v1/generate",
  "/v1/infer",
];

function post(url, payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve) => {
    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body).toString(),
        },
        timeout: 15000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            path: url.pathname,
            status: res.statusCode ?? 0,
            contentType: String(res.headers["content-type"] || ""),
            snippet: raw.slice(0, 120).replace(/\s+/g, " ").trim(),
          });
        });
      }
    );
    req.on("error", () => resolve({ path: url.pathname, status: -1, contentType: "", snippet: "request error" }));
    req.write(body);
    req.end();
  });
}

const payload = {
  model,
  messages: [{ role: "user", content: "ping" }],
  stream: false,
  max_tokens: 8,
};

for (const path of candidates) {
  const url = new URL(path, base);
  const result = await post(url, payload);
  console.log(JSON.stringify({ base: base.origin, ...result }));
}

