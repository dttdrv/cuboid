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

async function postJson(url, payload) {
  const body = JSON.stringify(payload);
  return await new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(body).toString(),
        },
        timeout: 30000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode ?? 0,
            contentType: String(res.headers["content-type"] || ""),
            contentEncoding: String(res.headers["content-encoding"] || ""),
            raw,
          });
        });
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
      reject(new Error("timeout"));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const base = new URL(settings.aiBaseUrl);
const urls = [
  new URL("/v1/chat/completions", base),
  new URL("/chat/completions", base),
  new URL("https://api.nvidia.com/v1/chat/completions"),
  new URL("https://api.nvidia.com/chat/completions"),
];

for (const url of urls) {
  const result = await postJson(url, {
    model: settings.aiModel,
    stream: false,
    messages: [{ role: "user", content: "ping" }],
    max_tokens: 64,
  });
  const snippet = result.raw.slice(0, 300).replace(/\s+/g, " ").trim();
  console.log(JSON.stringify({
    url: url.toString(),
    status: result.status,
    contentType: result.contentType,
    contentEncoding: result.contentEncoding,
    snippet,
  }));
}
