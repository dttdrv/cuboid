# Cuboid Backend (Local Control Plane + Rust Compile Worker)

This backend is a local-first control plane for Cuboid.

## What it provides

1. Local HTTP API at `http://127.0.0.1:4173/v1/*`
2. Filesystem-backed project/settings/compile metadata under `~/.cuboid`
3. Compile queue that invokes a Rust worker (`latexmk` + TeX Live)
4. NVIDIA build API adapter with explicit policy gate and hard AI off toggle
5. Encrypted-at-rest secret storage for API keys

## Endpoints

- `GET /v1/health`
- `POST /v1/projects`
- `GET /v1/projects`
- `GET /v1/projects/:id/files`
- `PUT /v1/projects/:id/files/:path`
- `POST /v1/compile/jobs`
- `GET /v1/compile/jobs/:id`
- `GET /v1/compile/jobs/:id/events`
- `PUT /v1/compile/jobs/:id/cancel`
- `POST /v1/ai/chat`
- `GET /v1/ai/models`
- `POST /v1/ai/edits`
- `GET /v1/settings`
- `PUT /v1/settings`
- `PUT /v1/settings/ai-toggle`

## Scripts (repo root)

- `npm run build:backend`
- `npm run start:backend`
- `npm run dev:backend`
- `npm run configure:nvidia` (requires `CUBOID_NVIDIA_API_KEY`)

## Requirements

1. Node.js available at runtime.
2. Rust toolchain if you build worker from source.
3. TeX Live + `latexmk` installed locally for real compilation.

## Worker path behavior

Default compiled worker path:

- `backend/rust/compile_worker/target/release/compile_worker` (or `.exe` on Windows)

If that binary is missing, backend attempts:

- `cargo run --manifest-path backend/rust/compile_worker/Cargo.toml --release --quiet`

You can override with:

- `CUBOID_COMPILE_WORKER_PATH=<absolute path to binary>`

## Environment variables

- `CUBOID_BACKEND_PORT` (default: `4173`)
- `CUBOID_HOME` (default: `~/.cuboid`)
- `CUBOID_SECRET_PASSPHRASE` (recommended, used for secret encryption key derivation)
- `CUBOID_COMPILE_WORKER_PATH` (optional worker binary override)
- `CUBOID_NVIDIA_API_KEY` (used by `npm run configure:nvidia`)

## Notes

1. `PUT /v1/settings/ai-toggle` is the hard policy gate for AI outbound calls.
2. If AI is off, `/v1/ai/*` returns `403`.
3. API keys are not logged; values are encrypted at rest.
4. Default AI target is `moonshotai/kimi-k2-5` at `https://integrate.api.nvidia.com/v1/chat/completions`.
