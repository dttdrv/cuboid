# NVIDIA build API + Kimi K2.5 Setup Notes (Cuboid)

Date: 2026-02-10

## Verified integration shape

1. NVIDIA exposes an OpenAI-compatible chat completions endpoint:
- Base: `https://integrate.api.nvidia.com`
- Path: `/v1/chat/completions`

2. Authorization model:
- Header: `Authorization: Bearer <NVIDIA_API_KEY>`

3. Kimi model identifier on NVIDIA API catalog:
- `moonshotai/kimi-k2.5`
  - Note: model ids can vary across catalogs; keep this configurable and confirm via `GET /v1/models`.

4. Preflight verification call (useful before any real AI testing):
- `GET /v1/models` to confirm the API key is valid and the endpoint is reachable.

4. Minimal request payload:
- `model`
- `messages` array with `role` + `content`

## Cuboid configuration decisions

1. AI provider locked to NVIDIA for this phase (`aiProvider = "nvidia"`).
2. Default model set to `moonshotai/kimi-k2-5`.
3. Allowed AI egress domains set to:
- `integrate.api.nvidia.com`
- `build.nvidia.com`
4. AI key stored encrypted at rest in local secret store.
5. Hard AI toggle remains enforced at backend policy level.

## Local setup flow used

1. Build backend:
- `npm run build:backend`

2. Configure NVIDIA defaults and encrypted key:
- Set env var `CUBOID_NVIDIA_API_KEY`
- Run `npm run configure:nvidia`

3. Start backend:
- `npm run start:backend`

4. Check health:
- `GET http://127.0.0.1:4317/v1/health`

## Primary sources

1. NVIDIA API docs (chat endpoint + request shape):
- https://docs.api.nvidia.com/nim/docs/llm-api

2. NVIDIA quickstart:
- https://docs.api.nvidia.com/nim/docs/quickstart

3. NVIDIA build model page (Kimi K2.5):
- https://build.nvidia.com/moonshotai/kimi-k2-5

4. NVIDIA API catalog model reference:
- https://docs.api.nvidia.com/nim/reference/moonshotai-kimi-k2-5
