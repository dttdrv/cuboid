# Cuboid Project Plan

## Protocol: "Alpha Prime"

**Objective**: Build a local-first, premium code editor that rivals "Prism" in aesthetics and functionality, serving as the foundation for a Sovereign Data Layer.

### 🛑 Current Priority: Phase 1 (The "Base")

The immediate goal is to reach a stable, polished "Alpha" version that runs locally. **Zero-Knowledge and Database integration are explicitly PAUSED until this phase is complete.**

#### 1. Core Editor & UI (Priority #1)
Target: Visual and functional parity with Prism.
- [ ] **Aesthetics**: Glassmorphism, tailored HSL color palettes, micro-animations, responsive layout.
- [ ] **Editor Engine**: High-performance text editing (Monaco or similar) with smooth scrolling and minimap.
- [ ] **File System**: Robust local file management (CRUD projects/files) using LocalStorage/IndexDB adapters.
- [ ] **Preview Pane**: Real-time rendering (LaTeX/Markdown) without lag.

#### 2. AI Intelligence Layer (Priority #2)
Target: Provider-agnostic "Brain" integration.
- [ ] **Abstraction Layer**: Unified interface to switch between providers dynamically.
    - *Supported Standards*: OpenAI-compatible endpoints (GLM, OpenRouter, LocalAI), Gemini Native, Mistral Native, Anthropic.
- [ ] **Features**:
    - Context-aware Chat Sidebar.
    - Inline Autocomplete/Ghost text.
    - Asset generation (Images/Diagrams).

---

### 🔮 Phase 2: The "Sovereign" Shift (Next)

Once Phase 1 is "feature and feel" complete, we integrate the backend and privacy layer.

#### 1. Backend Infrastructure (Convex)
- [ ] Migrate local data adapters to **Convex**.
- [ ] Implement real-time synchronization.

#### 2. Zero-Knowledge Security
- [ ] Client-side encryption (AES-256-GCM) *before* data leaves the browser.
- [ ] Key management (User password derivation).
- [ ] "Trust No One" architecture validation.

---

### 📦 Technical Stack
- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS (Premium Configuration)
- **AI**: Abstracted Multi-Provider SDK
- **Data (Current)**: LocalStorage / In-Memory
- **Data (Future)**: Convex + WebCrypto API

### 🚫 Deprecated / Removed
- Supabase (Replaced by Convex strategy)
- Server-side Decryption (Strictly forbidden)
