# Stack Alternatives Matrix (Backend-First Cuboid)

Date: 2026-02-10

## Compile Layer

| Option | Why it works | Why it may fail | Decision |
|---|---|---|---|
| TeX Live + `latexmk` | Highest compatibility with real-world LaTeX projects and package ecosystems | Local install complexity, larger footprint | **Chosen v1** |
| Tectonic | Reproducible and simpler toolchain bootstrap | Some package/workflow compatibility gaps for existing projects | Deferred |
| Browser/WASM compile | Fast preview loops and easier local distribution | Significant parity gaps, hard to match full TeX Live behavior | Deferred |

Sources: https://www.tug.org/texlive/ , https://ctan.org/pkg/latexmk , https://tectonic-typesetting.github.io/en-US/

## Editor/Code Surface

| Option | Why it works | Why it may fail | Decision |
|---|---|---|---|
| Monaco | Mature code editor behavior, diagnostics/decorations, proven at IDE scale | Heavier runtime vs lighter editors | **Keep (current repo)** |
| CodeMirror 6 | Modular, lighter, excellent extensibility | Migration cost from Monaco behaviors already in repo | Deferred |

Sources: https://microsoft.github.io/monaco-editor/ , https://codemirror.net/

## Collaboration Core (Future)

| Option | Why it works | Why it may fail | Decision |
|---|---|---|---|
| Yjs CRDT | Mature ecosystem, proven collaborative editing basis | Added complexity not needed for single-user local v1 | Deferred |
| Automerge | Strong CRDT model and auditability | Higher productization overhead for initial milestone | Deferred |
| OT custom | Precise control | Reinventing battle-tested logic too early | Rejected for now |

Sources: https://docs.yjs.dev/ , https://automerge.org/

## AI Access Layer

| Option | Why it works | Why it may fail | Decision |
|---|---|---|---|
| NVIDIA Build API-first + adapter interface | Fast path to “good enough” LLM integration with an OpenAI-compatible endpoint; easy to keep local policy gates | Provider-specific limits; multi-provider coverage requires future adapters | **Chosen current v1 slice** |
| OpenRouter-first + adapter interface | Fast multi-model coverage and easy experimentation | Gateway dependency and feature abstraction limits | Deferred (still a good future option) |
| LiteLLM gateway-only | Broad provider normalization quickly | Extra service dependency for local-first prototype | Deferred |
| Direct providers only | Full capability control per provider | Slowest initial multi-provider coverage | Deferred |

Sources: https://openrouter.ai/docs/quickstart , https://docs.litellm.ai/

## Backend Runtime

| Option | Why it works | Why it may fail | Decision |
|---|---|---|---|
| TS control plane + Rust compile worker | Fast repo integration + strong compile/sandbox performance path | Cross-language integration complexity | **Chosen v1** |
| TS-only | Fastest initial implementation | Weaker long-term isolation/perf story for compile execution | Deferred |
| Rust-first full backend | Strong systems-level control | Slowest delivery in current frontend-heavy repo | Deferred |
