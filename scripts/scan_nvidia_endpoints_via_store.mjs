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

function call(url, method, payload) {
  const body = payload ? JSON.stringify(payload) : null;
  return new Promise((resolve) => {
    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body).toString() } : {}),
        },
        timeout: 30000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            url: url.toString(),
            method,
            status: res.statusCode ?? 0,
            contentType: String(res.headers["content-type"] || ""),
            snippet: raw.slice(0, 180).replace(/\s+/g, " ").trim(),
          });
        });
      }
    );
    req.on("error", () => resolve({ url: url.toString(), method, status: -1, contentType: "", snippet: "request error" }));
    if (body) req.write(body);
    req.end();
  });
}

const base = new URL(settings.aiBaseUrl);
const altBases = [
  base,
  new URL("https://ai.api.nvidia.com"),
  new URL("https://api.nvcf.nvidia.com"),
  new URL("https://us-west-2.api.nvcf.nvidia.com"),
];
const probes = [
  { method: "GET", path: "/v1/models" },
  { method: "POST", path: "/v1/chat/completions", body: { model: settings.aiModel, messages: [{ role: "user", content: "ping" }], stream: false, max_tokens: 8 } },
  { method: "POST", path: "/chat/completions", body: { model: settings.aiModel, messages: [{ role: "user", content: "ping" }], stream: false, max_tokens: 8 } },
  { method: "POST", path: "/v1/completions", body: { model: settings.aiModel, prompt: "ping", max_tokens: 8 } },
  { method: "POST", path: "/v1/responses", body: { model: settings.aiModel, input: "ping" } },
  { method: "POST", path: "/v1/embeddings", body: { model: "nvidia/nv-embedqa-e5-v5", input: "ping" } },
];

for (const b of altBases) {
  for (const p of probes) {
    const url = new URL(p.path, b);
    const result = await call(url, p.method, p.body ?? null);
    console.log(JSON.stringify(result));
  }
}
