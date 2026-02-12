import { request as httpsRequest } from "node:https";

const apiKey = process.env.CUBOID_NVIDIA_API_KEY;
if (!apiKey) {
  console.error("CUBOID_NVIDIA_API_KEY is required.");
  process.exit(1);
}

const url = new URL("https://integrate.api.nvidia.com/v1/chat/completions");
const body = JSON.stringify({
  model: "moonshotai/kimi-k2-5",
  messages: [{ role: "user", content: "ping" }],
  max_tokens: 64
});

const req = httpsRequest(
  {
    hostname: url.hostname,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Length": Buffer.byteLength(body).toString()
    }
  },
  (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      console.log("status", res.statusCode);
      console.log(raw.slice(0, 2000));
    });
  }
);
req.on("error", (e) => {
  console.error("error", e);
});
req.write(body);
req.end();

