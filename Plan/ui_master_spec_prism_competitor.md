UI MASTER SPEC — PRISM-CLASS AI LaTeX WORKSPACE (COMPETITOR BUILD)
Version: v1.0 (master)
Audience: a coding-oriented AI model implementing the UI. This document specifies screens, layout, components, states, and interaction rules with rationale.
Reference UI: the provided screenshots (Prism/Crixet-class editor) — calm dark theme, pill controls, editor+preview side-by-side, minimal chrome.
Product strategy: replicate the workflow class, but differentiate via transparent data controls and open APIs (no lock-in).

0) CONTEXT + PRODUCT GOAL (WHY THIS EXISTS)

0.1 What Prism/Crixet represents (market class)
Prism is positioned as a free, cloud-based, LaTeX-native scientific writing workspace with GPT-5.2 integrated into the workflow (project-wide access to structure, equations, references, and surrounding context). This is not “a code editor plus AI,” but a document workspace where AI operates at the project level.

Crixet is an online LaTeX editor / Overleaf alternative that already demonstrated a browser-based LaTeX IDE with an AI assistant, real-time compilation, and project workflows.

0.2 Your product goal (competitive thesis)
Build the same class of product (cloud LaTeX IDE + project-scoped assistant + live PDF preview) while:
- Avoiding opaque data usage (“shady ToS” perception).
- Being open to multiple AI backends and external automation via APIs.
- Preserving a calm, minimal, technical UI.

0.3 Non-goals (for v1)
- Offline/local mode.
- Multi-assistant roles per project.
- Deep assistant “memory” beyond the active session (can be added later).
- Fully-featured Git UI (basic import/export is enough for v1).

1) EXPERIENCE PRINCIPLES (DESIGN RULES WITH RATIONALE)

P1. Always-visible dual surface: editor + preview
Rule: the LaTeX editor and PDF preview are visible simultaneously by default.
Why: scientific authors reason in rendered semantics; hiding preview increases cognitive load and error latency. The reference UI strongly encodes this.

P2. Project-scoped assistant, not inline copilot
Rule: the assistant is a global chat bound to the current project (paper) and its files, not to cursor selections.
Why: the user’s thinking unit is the paper. Inline AI UI competes with writing; a project-scoped assistant supports higher-level tasks (structure, citations, clarity, math reasoning).

P3. Minimal chrome, maximal clarity
Rule: prefer whitespace/tone separation over borders; keep controls few and discoverable.
Why: the reference UI’s perceived quality comes from restraint. Users spend hours here; “quiet UI” reduces fatigue.

P4. Trust must be legible in-product
Rule: users can always tell (a) what data the assistant sees/sends and (b) whether AI edits are manual or automated.
Why: your differentiation is “not shady.” This must be felt in the UI, not buried in legal pages.

P5. AI is a tool; authorship remains with the user
Rule: AI changes are proposed by default. Automation is opt-in and clearly indicated.
Why: protects user trust, academic integrity, and prevents “silent mutation” of manuscripts.

P6. Platform openness is visible
Rule: API access exists as a first-class settings area: keys, scopes, webhooks.
Why: “open to APIs” is a strategic differentiator; if it’s invisible, it won’t be believed.

2) DESIGN SYSTEM (TOKENS + INTERACTION)

2.1 Color tokens (start with these; tune with eyedropper later)
- bg.app: #0D0E0D
- bg.panel: #1A1A1A
- bg.panel2: #202020
- bg.rail: #141414
- bg.selection: #2A2A2A
- text.primary: #F2F2F2
- text.secondary: #B6B6B6
- text.muted: #8A8A8A
- border.subtle: rgba(255,255,255,0.06)  (use sparingly)
- accent.primary: #0097D5
- danger: #D64C4C
- success: #3FBF7F
- warning: #E1B84A

2.2 Typography
- H1: 24–28px semibold
- H2: 18–20px semibold
- Body: 14–16px regular
- Caption: 12–13px regular (muted)
- Monospace: 12–13px (logs/status)

2.3 Shape + spacing
- radius.panel: 16px
- radius.pill: 999px
- radius.small: 10px
- spacing grid: 8px baseline
- button height: 44px primary, 40px secondary
- icon button size: 32–36px

2.4 Interaction rules
- Hover: bg.panel -> bg.panel2 (subtle lift)
- Selected nav/file: bg.selection rounded pill behind item
- Focus ring: 1px accent.primary (glow optional, minimal)
- Disabled: opacity 0.5; no layout shift
- Loading: show spinner; keep button width stable

3) INFORMATION ARCHITECTURE (ROUTES + PANES)

3.1 Core routes
/auth
  /login
  /login/email
  /login/email/sent
  /expired
  /denied
  /invites/:token
/workspaces
  /select
  /new   (optional)
/app/:workspaceId
  /projects
  /projects/:projectId/editor
  /projects/:projectId/settings
/global-settings

3.2 App shell patterns
A) Auth shell: centered card on bg.app
B) Workspace shell: left nav + main rounded panel
C) Editor shell: 3-pane layout (sidebar + editor + right panel), plus bottom assistant input

4) SCREEN SPECS — AUTH + ENTRY (FROM PRIOR BLUEPRINT, SLIGHTLY REFINED)

4.1 /auth/login — Login
Layout:
- Fullscreen bg.app.
- Center card (bg.panel, radius.panel), width ~440px.
Content:
- Title: product name (neutral, no marketing)
- Buttons (stack):
  - Continue with Provider A (Primary inverted)
  - Continue with Provider B (Secondary)
  - Continue with Provider C (Secondary; optional)
- Link: “Sign in with email”
- Caption: “By continuing, you agree to Terms and Privacy.” (Keep neutral; legal review later.)
States:
- Loading on clicked provider
- Inline error if callback fails

Rationale: mirrors dashboard’s white-pill primary action language; consistent with reference UI.

4.2 /auth/login/email — Email magic link
- Email input (pill)
- Primary: “Send magic link”
- Tertiary: Back
States: validation, sending, error line reserved.

4.3 /auth/login/email/sent — Check inbox
- Confirmation text + resend with cooldown.

4.4 /workspaces/select — Workspace selection
- Centered panel (560–720px)
- List rows: avatar + name + role badge (Owner/Admin/Member)
- Direct click to enter
Actions: “Create workspace” (if allowed), “Sign out”

4.5 /app/:ws/projects — Projects dashboard
Matches reference:
- Left nav: All Projects, Your Projects, Shared with you
- Main panel header: title + search + view toggle + Import + +New
- List rows with time + overflow menu
Empty state: “No projects yet” + New/Import buttons

4.6 Modals
- New Project modal: name + template + create
- Import modal: zip/github (+ optional overleaf) + progress view (monospace)

5) EDITOR WORKSPACE — MASTER SPEC (THIS IS THE CORE)

5.1 /app/:ws/projects/:projectId/editor — Overall layout
Grid:
- Left utility rail (optional): 48px (icons only)
- Left sidebar: 260–320px (files/outline)
- Center editor pane: flexible, min 520px
- Right pane: 420–520px (preview/assistant/logs/comments)
- Bottom assistant input: anchored to bottom of center pane (NOT full page), height ~56px

Key constraint:
- Editor and Preview are visible at the same time by default (Preview tab open).

Why: matches the reference UI and preserves constant semantic feedback.

5.2 Top bars (minimal)
5.2.1 Project header (in left sidebar top)
- Project name with caret dropdown
- Share button (pill or small)
- Connection indicator (“Connected” / “Reconnecting…”) at bottom of sidebar, subtle.

5.2.2 Editor file tab (top of editor pane)
- Active file pill (e.g., main.tex)
- Optional: breadcrumbs if using folders
- Minimal; avoid a full toolbar

5.2.3 Preview toolbar (top of right pane when Preview active)
- Compilation status (“Compiling…” / “Compiled” / “Error”)
- Page indicator (“01 of 12”)
- Zoom selector (“Fit” / “100%”)
- Download icon + overflow menu

Rationale: mirrors the screenshot UI and keeps preview functionally complete without dominating.

5.3 Left sidebar contents (Files + Outline + Diagnostics)
Tabs at top: “Files” and “Chats” do exist in the reference UI.
For your competitor: keep “Files” as primary; “Chats” can be reserved for future (or omitted).
However, DO include “Files” and an internal “Outline” section.

Recommended structure in left sidebar (single scroll region):
A) Files (primary)
- Tree view (folders, files)
- File icons only where meaningful (.tex, .bib, images)
- Selected file: bg.selection pill
- Build root indicator on the main entry file (main.tex):
  - a small dot/badge “root”
  - only one root at a time

B) Outline (collapsible section under Files or separate tab)
- Generated from LaTeX structure (\section, \subsection, etc.)
- Click -> scroll editor to location
- Optional: highlight current section based on cursor position

C) Diagnostics (collapsed by default)
- Errors / Warnings / Notes counts
- Items clickable -> jump to source line

Why: the reference UI is clean but under-specifies structure; adding Outline/Diagnostics increases power without adding chrome.

5.4 Center editor pane (LaTeX code surface)
Core requirements:
- Line numbers
- Syntax highlighting (restrained)
- Search within file (Ctrl+F)
- Basic LaTeX-aware autocomplete (optional for v1; UI placeholder ok)
- Multi-file navigation (open file from tree)
- Error markers:
  - Underline on line with error/warning (subtle)
  - Tooltip on hover
- Sync anchor:
  - When user clicks PDF (if supported), jump editor to location
  - When user clicks diagnostics item, jump editor to line

Important: do NOT add inline AI buttons in the editor. The assistant is project-scoped and lives separately.

5.5 Right pane (Tabs: Preview, Assistant, Logs, Comments)
Tabs row at top of right pane:
- Preview (default)
- Assistant
- Logs
- Comments
Optional: Changes (if you want a dedicated diff queue view; can be nested under Assistant for v1)

Behavior:
- New assistant reply: highlight “Assistant” tab (subtle dot)
- New compile error: highlight “Logs” tab (subtle dot), but do not auto-switch unless in “Debug on error” setting

Why: keeps preview primary; preserves “quiet UI” while still signaling events.

5.6 Preview tab (PDF viewer)
Viewer canvas:
- Light gray canvas (#E1E1E1 feel) within right pane, with a white page centered.
- Pan/scroll within the viewer.
Bottom overlay controls (as in screenshot):
- Small floating control cluster with arrows/rotate (optional), semi-transparent.

States:
- Compiling: show spinner + “Compiling…” in toolbar
- Success: show “Compiled · 0 warnings” in toolbar subtext
- Error: show “Error · see logs” (danger accent only for the word “Error”)

Rationale: match screenshot; provide immediate feedback; avoid intrusive modals.

5.7 Logs tab (structured-first)
Default: structured view:
- Errors list (clickable)
- Warnings list
- Expand “Raw logs” dropdown (like screenshot)
Raw logs:
- Monospace, scrollable, low-contrast
- Copy button (small) for debugging

Why: most users need actionable errors, not full compiler output. Raw must exist for power users.

5.8 Comments tab (collaboration baseline)
For v1, keep it simple:
- Threaded comments attached to locations (file + line range)
- Each comment shows author, timestamp, content
- Clicking comment jumps to location
- “Resolve” toggle (if collaboration exists)

If collaboration is not implemented yet, keep tab but show “Coming soon” only if you must; better is to implement a minimal local comment system.

5.9 Assistant tab (project-scoped global chat)
This is the differentiator + the most important part to get right for “open and not shady.”

5.9.1 Layout
- Assistant conversation list (scroll) in the right pane
- Message composer is NOT here; composer is the bottom bar in the center pane (global).
- Each assistant message shows:
  - role (User/Assistant)
  - timestamp (optional)
  - optional “Context used” indicator (see Data Boundary below)
- Assistant output can include:
  - plain text explanation
  - action proposals (apply changes)
  - generated files proposals
  - citations proposals (bib entries)

5.9.2 Data Boundary Indicator (trust feature)
At the top of the Assistant tab, a small status line:
- “Assistant scope: Project files + PDF + logs” (example)
- Clicking it opens a mini popover explaining what is included/excluded.

This is UI-only; legal/infra later. But it must exist to communicate transparency.

Why: your product differentiates on trust; users must see scope, not guess.

5.9.3 Change application policy (manual vs automated)
Setting: “Apply assistant changes”
Options:
- Propose only (default)
- Auto-apply safe edits (formatting only)
- Auto-apply all edits (danger; requires explicit confirmation)

UI effect:
- When in Propose-only:
  - Assistant proposes patches as “Change sets” with Accept/Reject
- When auto-apply:
  - UI shows a subtle banner “Auto-apply enabled” with a toggle to pause

Why: aligns with your request; prevents silent changes unless opted in.

5.9.4 Change sets + diffs (how assistant edits are represented)
Any assistant suggestion that modifies project files MUST become a change set object:
ChangeSet fields (conceptual):
- id
- title (e.g., “Fix compilation errors in main.tex”)
- filesChanged: list
- diffPerFile (unified diff)
- status: proposed / applied / rejected / partially applied
- createdAt

UI rendering:
- A card in the Assistant thread:
  - Title
  - Affected files list
  - “View diff” button
  - Accept / Reject buttons
  - Optional “Apply selected hunks” (advanced)

Diff viewer component:
- Side-by-side or unified diff inside a modal/drawer (right pane overlay)
- Must support:
  - scroll
  - per-file switching
  - copy diff

Why: this is the primary safety + authorship mechanism.

5.9.5 Generated files
If assistant generates new files (references.bib, figure.tex, etc.):
- Show as a change set with “New file” entries
- In file tree, show a “Generated” badge until accepted/applied
- On reject, do not add the file

Why: keeps project state clean and predictable.

5.9.6 “Assistant actions” menu (optional but recommended)
In the assistant composer (bottom bar), allow a small “Actions” icon:
- Insert citation(s)
- Summarize paper
- Check for missing references
- Fix compilation errors
- Convert notes -> LaTeX section

These are shortcuts, not required. Keep minimal.

Why: this helps discoverability without cluttering the editor.

5.10 Bottom assistant input (global, project-scoped)
Placement: bottom of center pane, always visible.
Style: pill bar, subtle elevation, icons on right.

Behavior:
- Input submits to project assistant
- Supports multiline (Shift+Enter)
- Shows “Using: Project scope …” as a tiny caption on focus (optional)
- If auto-apply enabled, show a small warning icon in the bar.

Why: matches screenshot and keeps typing in the main working area, not in the right pane.

6) SETTINGS — GLOBAL + PROJECT (INCLUDING API + TRUST)

6.1 /global-settings (user-level)
Sidebar categories:
- Editor
- PDF Viewer
- File Management
- Assistant
- Integrations
- Data & Privacy

Keep the same visual pattern as reference Settings:
- Left category list with selected pill
- Right content list with labeled rows + descriptions + right-aligned toggles

6.2 Editor settings (as in screenshot; keep and expand lightly)
- Interface theme (Dark; future: Light)
- Font size
- Auto formatting
- Realtime compilation toggle
- Vim mode
- Word wrap
- Sticky scroll

6.3 Assistant settings (core for your strategy)
- Provider (dropdown): OpenAI / Anthropic / Custom Endpoint
- Model (dropdown, dependent on provider)
- Apply assistant changes (Propose only / Auto-apply safe / Auto-apply all)
- Scope toggles:
  - Include PDF output
  - Include compilation logs
  - Include file metadata (names, tree)
- Rate limit / cost hint (optional)
- Clear session chat history (button)

Why: makes the “open to APIs” and “not shady” values explicit and controllable.

6.4 Integrations (API-first)
- API Keys:
  - Generate key
  - Revoke key
  - Copy key
  - Key scopes (checkbox list):
    - read:project
    - write:project
    - compile:trigger
    - assistant:invoke
- Webhooks:
  - Endpoint URL
  - Events:
    - on_compile_success
    - on_compile_error
    - on_assistant_changeset_created
    - on_project_export
  - Secret signing toggle

Why: visible proof of openness; unlocks ecosystem tooling.

6.5 Data & Privacy (trust-first)
UI elements:
- “Training on my content” toggle (default OFF)
- Data retention:
  - Keep project history (x days) [if applicable]
  - Delete project permanently (danger button)
- Export data:
  - Export project as zip
  - Export audit log (assistant changes)

Why: the product must show strong author control; this is your competitive edge.

7) COMPONENT LIBRARY (IMPLEMENTATION CONTRACT)

Naming is indicative; use React or equivalent.

7.1 Shell components
- AppShell
  - props: children, leftNav, topBar?
- CenterCard (auth)
- Modal / Drawer
- Tabs

7.2 Navigation
- LeftNavItem (selected pill)
- IconRailButton
- Breadcrumbs (optional)

7.3 Inputs
- PillButton (variants: primaryInverted, secondary, tertiary)
- PillInput (icon, errorText)
- ToggleSwitch
- DropdownSelect
- SearchInput

7.4 Editor area
- FileTree
  - props: nodes, selectedId, onSelect, badges
- OutlineList
- DiagnosticsList
- CodeEditor (monaco/codemirror wrapper)
  - props: value, onChange, language, markers, activeFile
- StatusBadge (Connected / Reconnecting)
- BottomAssistantBar
  - props: onSubmit, autoApplyState, scopeSummary

7.5 Right pane
- PdfViewer
  - props: pdfUrl/bytes, pageCount, zoom, onPageChange
- LogsPanel (structured + raw)
- AssistantThread
  - props: messages, onOpenChangeSet, scopeSummary
- ChangeSetCard
- DiffViewerModal
- CommentsPanel

8) STATE MODELS (DATA SHAPES FOR UI)

8.1 Project
- id, name, createdAt, updatedAt
- files: FileNode tree
- settings (project overrides, including assistant policy)
- compileState: idle/compiling/success/error
- lastCompileAt
- diagnostics: {errors[], warnings[]}

8.2 FileNode
- id, name, type (file/folder)
- ext (tex, bib, png, ...)
- children[]
- badges[] (root, generated)

8.3 AssistantMessage
- id, role (user/assistant/system)
- content (markdown/plain)
- createdAt
- attachments (optional): ChangeSetRef, CitationRef, FileRef

8.4 ChangeSet
- id, title
- status (proposed/applied/rejected/partial)
- filesChanged[]
- diffs[] per file
- createdAt

8.5 Settings
- global editor settings
- global assistant settings
- project overrides: assistant policy + scope toggles

9) EDGE CASES + ERROR UX

9.1 Compile errors
- Preview toolbar shows “Error”
- Logs tab dot indicator
- Diagnostics list populated
- Do not block editing

9.2 Connection issues
- “Connected” becomes “Reconnecting…”
- Disable compile triggers; queue actions locally (UI only)
- Show banner only if down >10s (avoid jitter)

9.3 Assistant provider failure
- Assistant message bubble shows “Request failed”
- Provide “Retry” action
- If custom endpoint: show status code in a collapsible “Details”

9.4 Permissions
- Access denied screen with “Switch workspace”
- Project-level: read-only view state if user is viewer

10) IMPLEMENTATION NOTES FOR THE CODING MODEL (IMPORTANT)

- Use CSS grid for the editor shell to guarantee stable pane sizes.
- Keep all panes independently scrollable (no page scroll).
- Default widths:
  - Sidebar: 280px
  - Right pane: 480px
  - Editor: remainder
- Ensure keyboard navigation:
  - Tab order: sidebar -> editor -> assistant bar -> right tabs
  - Visible focus rings (accent.primary)
- Avoid heavy outlines/borders:
  - Use subtle background tone changes for separation.
- Keep the “Tools” pill concept from reference:
  - In v1, it can open a small menu for compile options and “Run assistant action” shortcuts.

11) WHY THIS SPEC LOOKS THE WAY IT DOES (SUMMARY)

- The reference UI succeeds because it is quiet and stable: few controls, strong layout, and constant preview.
- The assistant must be project-scoped to support scientific reasoning, not line-level code completion.
- Your differentiation (trust + openness) must be expressed as UI:
  - Data boundary indicator
  - Explicit apply policy (manual vs automated)
  - API keys and webhooks
  - Export and privacy controls
- Diff-based changesets are the safest, most legible bridge between AI suggestions and author control.

END OF MASTER SPEC
