UI MASTER SPEC — ADDENDUM: CRITICAL DESIGN REVIEW + REQUIRED FIXES
Applies to: ui_master_spec_prism_competitor.md (v1.0)
Source: screenshots provided (editor: Assistant/Comments/Logs/Preview tabs + Projects list)
Goal: elevate from “clone mock” to “credible multi‑million product UI” by fixing hierarchy, density, affordances, and trust/openness surfacing.

A) BRUTAL READ — WHAT’S WRONG RIGHT NOW

A1. It’s visually quiet, but also visually empty.
You achieved “minimal.” You did not achieve “premium.” The difference is density + information hierarchy.
Symptoms in screenshots:
- Vast dead areas (especially right pane tabs when empty).
- Panels look like placeholders: they don’t tell users what to do next or what state the system is in.
- The UI looks like a wireframe that got a dark theme, not a finished product.

A2. Hierarchy is inconsistent.
- Some primary actions are white (Add), others are dark (Compile), others are muted (Send).
- “Idle” appears as detached text rather than a coherent status element.
- “Tools” looks like plain text rather than an affordance (it reads like a label, not a control).

A3. You are duplicating information and wasting attention budget.
- “Assistant scope: …” appears both in the Assistant tab and again above the composer. Redundant.
- Diagnostics shows “(0E/0W)” and the Logs tab shows “Errors:0 Warnings:0” — repeated, and neither is clickable/triage‑able.

A4. The assistant experience is under-designed.
- Empty state is a sentence. That’s not enough. Users need prompts, examples, and “what can this do?”
- No clear separation between “assistant chat” and “assistant changes” (patches).
- “Apply assistant changes” dropdown is present, but it doesn’t communicate risk or what “safe edits” means.

A5. Comments are not credible for real collaboration.
- “Add comment for current line” is too simplistic. Real usage is selection‑based, thread‑based, with anchors and resolution.
- No visible anchors in the editor gutter = users can’t see where comments live.

A6. Logs are not actionable.
- A count card + “Raw logs” label is not a log system.
- There is no “first error,” no clickable stack, no filtered view, no “copy error,” no “jump to line.”

A7. Preview state is acceptable, but not production‑ready.
- Placeholder page is fine, but the viewer lacks page nav, sync hints, and a clear compile pipeline.
- The PDF area is visually disconnected from compilation state (compile status should be integrated).

A8. Projects list looks like a demo screen.
- The header is disproportionately large relative to content.
- The list row lacks the metadata users need: last edited by, last compile status, collaborators, template/type.
- There’s no sorting, no filtering chips, no empty state guidance.

B) FIX PRIORITIES (WHAT TO CHANGE FIRST)

P0 (must fix before any public alpha)
1) Top bar coherence (Compile + status + Tools affordances)
2) Assistant empty state + patch UX
3) Actionable Logs (clickable error list + jump to line)
4) Comments with anchors + selection range + threads
5) Projects list density + metadata

P1 (next polish pass)
6) Remove redundancy (scope duplication, double error counts)
7) Consistent button hierarchy and component sizing
8) Better empty states everywhere (Preview/Logs/Comments/Assistant/Outline)

C) REQUIRED SPEC UPDATES (CONCRETE IMPLEMENTATION CHANGES)

C1. Global top bar (editor route)
Replace the current loose items (“Projects” pill, Compile button, Idle text) with a coherent top bar:

TopBar (height 56–64px):
- Left: “Projects” back button (pill) + current project name (truncated) + workspace avatar/menu
- Center (optional): breadcrumbs “Workspace / Project”
- Right: Compile control group:
  - Primary pill: Compile (with spinner when running)
  - Status pill: Idle / Compiling / Error / Success (click opens Logs)
  - Optional: Errors/Warn mini badges (click opens Logs)

Why: status must be a single component, not floating text.

C2. Make “Tools” a real control
In editor header:
- “Tools” becomes a pill button with a caret.
Menu items (v1):
- Compile now
- Toggle realtime compile
- Download PDF
- Export project (zip)
- Assistant actions (Fix errors / Generate bib / Summarize)

Why: the reference UI uses “Tools” as an affordance; plain text reads broken.

C3. Assistant tab — finish the product, not a placeholder
Assistant empty state must include:
- 3–6 suggestion chips (click to populate composer):
  - “Fix compile errors”
  - “Generate an abstract”
  - “Add references for related work”
  - “Turn notes into a section”
  - “Explain why the proof is wrong”
- A short line clarifying data boundary (clickable):
  - “Scope: project files + PDF + logs (change)”
- A “What can the assistant do?” collapsible panel (short bullet list)

Add a dedicated “Changes” subpanel inside Assistant:
- When assistant proposes edits, show a ChangeSet card:
  - Title, file list, summary, View diff, Accept / Reject
- Keep chat messages separate from change sets visually (different card style)

C4. Assistant “apply policy” dropdown — add safety semantics
Dropdown options must be explicit and explainable:
- Propose only (recommended)
- Auto‑apply formatting only (safe)
- Auto‑apply all file edits (risky)

When user selects an auto option:
- Show a confirmation modal explaining consequences.
- Show a persistent (but subtle) banner: “Auto‑apply enabled” with Pause toggle.

C5. Remove scope duplication
Keep “Assistant scope …” in ONE place:
Option A (recommended):
- Keep it in Assistant tab header only.
- In the bottom composer, show a small shield icon with tooltip “Project scope enabled.”

C6. Logs tab — make it triage‑grade
Logs panel must be:
- Structured list first:
  - Errors (count) with expandable list items:
    - Message summary (1 line)
    - File:line
    - Click: jump to editor line and highlight
  - Warnings similarly
- Raw logs as an accordion with:
  - Copy button
  - Download logs button

Empty state logic:
- If never compiled: “No compilation yet. Click Compile.”
- If compiled successfully: “No errors. Last compiled at …”

C7. Editor gutter anchors (comments + diagnostics)
Add gutter markers:
- Error marker icon at line with error
- Warning marker icon
- Comment marker icon
Hover shows tooltip; click opens side tab at the relevant item.

Why: without anchors, comments/logs feel detached and users can’t navigate.

C8. Comments tab — make it real
Replace “current line” with “selection or line anchor.”
UI:
- Input supports:
  - Current selection (preferred) OR current line if no selection
  - Shows anchor badge: “main.tex · L12–L18” or “L12”
- Thread rendering:
  - comment list with Resolve
  - clicking thread highlights range in editor

If collaboration not implemented yet:
- Still implement comments locally; do not ship a fake “Comments” tab.

C9. Preview tab — add minimal nav + sync cues
Add:
- Page navigation (prev/next or page number input)
- “Sync” toggle: click PDF to jump to source (if supported)
- Last compiled timestamp in toolbar

Preview empty state:
- Add a compile CTA button within the placeholder: “Compile now”
- Not just text.

C10. Projects screen — increase density + usefulness
Reduce header size and add table/list structure:
- Columns:
  - Project name
  - Last edited
  - Last compile (Success/Error)
  - Collaborators (avatars)
- Add sort control (Recent / Name / Errors)
- Search bar aligns with actions in a single row.
- Empty state if no projects:
  - “Create a new project or import from zip/GitHub.”

Why: multi‑million products win by being useful at a glance.

D) POLISH CHECKLIST (NON-NEGOTIABLE FOR “PREMIUM”)

- Consistent primary button style across the app.
  Rule: only one “white” primary per surface; everything else secondary/ghost.
- Align paddings between panes; right tab bar spacing must match editor header spacing.
- Every empty state must answer: “What is this?” and “What do I do next?”
- Every status (Connected, Idle, Compiling) must be a component, not free text.
- Every important metric (errors/warnings) must be clickable navigation.

E) WHERE THIS AFFECTS THE MASTER SPEC

Update sections in ui_master_spec_prism_competitor.md:
- 5.2 Top bars (replace with C1 + C2)
- 5.5 Right pane behavior (add event dots + click-through)
- 5.7 Logs tab (replace with C6 + empty states)
- 5.8 Comments tab (replace with C7 + C8)
- 5.9 Assistant tab (replace with C3–C5 + ChangeSet separation)
- 4.5 Projects dashboard (replace with C10)

END ADDENDUM
