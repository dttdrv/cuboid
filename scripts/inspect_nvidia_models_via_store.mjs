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

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
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
            raw,
          });
        });
      }
    );
    req.on("timeout", () => reject(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

const base = new URL(settings.aiBaseUrl);
const url = new URL("/v1/models", base);
const result = await getJson(url);
console.log("status", result.status);
console.log("content-type", result.contentType);
try {
  const parsed = JSON.parse(result.raw);
  const first = parsed?.data?.[0];
  console.log("first model keys", first ? Object.keys(first) : []);
  console.log("sample ids", (parsed?.data || []).slice(0, 5).map((m) => m.id));
} catch {
  console.log(result.raw.slice(0, 800));
}

