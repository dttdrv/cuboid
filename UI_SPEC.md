# Cuboid UI Specification

## Design Principles

| Axis         | Rule                                                                 |
|:-------------|:---------------------------------------------------------------------|
| **Visual**   | Terminal-inspired, dense, low-chrome. No decorative elements.        |
| **Tone**     | Work over form. Every pixel serves a function.                       |
| **Geometry** | Hard edges only. Max radius: 4px (`--radius-md`). Default: 2px.     |
| **Type**     | Monospace-forward (`JetBrains Mono`). Sans (`IBM Plex Sans`) for body. |
| **Color**    | Restrained dark palette. No inline hex. All via CSS custom properties. |
| **Motion**   | Minimal. Only grid-template transitions and loading spinners.        |
| **Spacing**  | Tight. Status bar: h-10. Toolbar buttons: h-8. Gap-1/gap-2.         |

## Layout

Full-viewport grid with no outer chrome:

```
┌─────────────────────────────────────────────────────────┐
│ RunStatusBar (h-10, border-b)                           │
├──────────┬──────────────────────────┬───────────────────┤
│ LeftRail │ Editor + Composer        │ Preview           │
│ 240px    │ flex-1                   │ min 340px / 42%   │
│          │                          │                   │
├──────────┴──────────────────────────┴───────────────────┤
```

- Left rail collapses to 0px via grid-template transition
- Ctrl+B toggles left rail
- Ctrl+Shift+B triggers manual compile

## Design Tokens

All colors, radii, and surfaces are defined in `index.css` via CSS custom properties under `@theme`. Components must never use inline hex values. Key token groups:

- **Surfaces**: `--color-surface-rail`, `--color-surface-editor`, `--color-surface-drawer`, `--color-surface-status-bar`, `--color-surface-preview`, `--color-surface-composer`
- **Borders**: `--color-border-subtle`, `--color-border-active`
- **Status**: `--color-status-idle`, `--color-status-compiling`, `--color-status-success`, `--color-status-error`, `--color-status-queued`
- **Radius**: `--radius-none` (0), `--radius-sm` (2px), `--radius-md` (4px)

## Utility Classes

| Class             | Purpose                              |
|:------------------|:-------------------------------------|
| `toolbar-btn`     | Editor toolbar buttons (h-8, gap-1.5)|
| `toolbar-btn-active` | Active state for toolbar buttons  |
| `status-chip`     | Compile status indicator             |
| `status-chip-*`   | idle / compiling / success / error / queued variants |
| `btn-primary`     | Primary action button                |
| `btn-secondary`   | Secondary action button              |
| `btn-ghost`       | Ghost/invisible button               |
| `btn-icon`        | Icon-only button (h-9, w-9)          |
| `input-field`     | Text inputs                          |
| `surface-*`       | Background surface classes           |
| `panel`           | Bordered panel                       |

## Component Rules

### RunStatusBar
- Top-level bar. Contains: left-rail toggle, editor/preview tabs, mode selector, command palette, drawer toggle, compile button, status chip.
- Compile button disabled during `compiling` state.

### LeftRail
- Back button uses `ArrowLeft` icon (not Settings).
- Shows: project name, files list, section outline, save status.
- No dead controls. No share, search, or chat tabs.

### ArtifactPane
- Clean tab bar with document title only.
- Monaco editor fills remaining space.
- No PenLine, no diagram.jpg, no Tools button.

### ComposerPane
- Floating overlay at bottom of editor pane.
- AI ON/OFF toggle. Input disabled when AI off or busy.
- No Mic button. No rounded-full input.

### PdfViewer
- Sharp-cornered iframe. Design-token backgrounds.
- Empty state shows "No PDF — compile to preview" with compile button.

### Dashboard
- No placeholder project injection.
- Proper empty state with "No projects yet" message.
- Search and sort controls. Import menu.

### ProjectCreationModal
- Escape key dismisses. Backdrop click dismisses.
- Submit disabled when name empty or submitting.
- Error display on failed creation.

## AI Behavior
- AI can be toggled ON/OFF via ComposerPane button.
- With AI OFF: prompt input disabled, send disabled, all other UI functional.
- Toggle calls backend `/v1/settings/ai` endpoint.

## Deferred
- RightDrawer (stub exists, no implementation)
- Mode switching (Write/Review buttons present, UiMode state tracked, no behavior)
- Command palette integration
- Real file tree from backend
- Keyboard shortcuts overlay
