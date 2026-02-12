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

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve(JSON.parse(raw));
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

const models = await getJson(new URL("/v1/models", base));
const kimi = (models?.data || []).map((m) => String(m.id || "")).filter((id) => id.includes("kimi"));
console.log(JSON.stringify({ count: kimi.length, sample: kimi.slice(0, 30) }, null, 2));

