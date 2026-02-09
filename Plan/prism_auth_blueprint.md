PRISM (CRIXET) — AUTH + ENTRY FLOW UI BLUEPRINT (DARK, “PROJECTS/EDITOR” CONSISTENT STYLE)
Version: v0.1
Scope: login, signup-equivalent, session/error, org/workspace selection, first-run, empty state, project creation entry, and related modals.
Design target: match the screenshots: layered charcoal surfaces, minimal borders, pill controls, subtle elevation, sparse accent blue, “serious editor” tone.

1) DESIGN SYSTEM (TOKENS + RULES)

1.1 Color tokens (hex values are approximate; tune with actual UI palette)
- bg.app: #0D0E0D (root background)
- bg.panel: #1A1A1A (primary surfaces: main panels/cards)
- bg.panel2: #202020 (secondary surfaces, modals, hover)
- bg.rail: #141414 (left rails/sidebars)
- bg.selection: #2A2A2A (selected nav item pill)
- text.primary: #F2F2F2
- text.secondary: #B6B6B6
- text.muted: #8A8A8A
- border.subtle: rgba(255,255,255,0.06) (use sparingly; prefer separation via tone)
- accent.primary: #0097D5 (only for “active tool”/focus and a few stateful elements)
- danger: #D64C4C
- success: #3FBF7F
- warning: #E1B84A

Rule: never use saturated accent as “decoration”. Only for active states, focus rings, and a single primary pill when needed.

1.2 Typography (relative)
- H1: 24–28px, semibold, text.primary
- H2: 18–20px, semibold
- Body: 14–16px, regular
- Caption: 12–13px, regular, text.secondary/muted
- Monospace (logs/status): 12–13px, text.secondary

Rule: hierarchy via size + weight + opacity; avoid hard dividers.

1.3 Radii, spacing, elevation
- radius.panel: 16px (main panels)
- radius.pill: 999px (buttons/inputs)
- radius.small: 10px (small cards, selection pills)
- spacing baseline: 8px grid
- panel padding: 24–28px
- elevation: soft shadow only on modals/overlays; otherwise rely on tone shifts.

1.4 Buttons
- Primary (inverted): bg = #FFFFFF, text = #111111, pill, medium height (40–44px)
- Secondary: bg = bg.panel2, text = text.primary, pill
- Tertiary: text button only, no background; hover adds subtle bg.panel2 pill.
- Icon buttons: circular, 32–36px; background appears on hover only.

1.5 Inputs
- Pill input with subtle inner border or tone change.
- Default bg: bg.panel2; placeholder: text.muted
- Focus: 1px accent.primary outline (or glow), no thick neon.

1.6 Interaction states (must be consistent)
- Hover: background lifts from bg.panel -> bg.panel2
- Selected nav: rounded pill bg.selection behind text
- Disabled: reduce opacity to 0.5, keep layout stable
- Loading: replace button label with spinner + “Working…”; keep width identical.

2) APP ENTRY MAP (USER FLOWS)

2.1 Standard user flows
A) OAuth sign-in (OpenAI / GitHub / Google)
Login -> OAuth redirect -> callback -> (optional) Workspace select -> Projects

B) Email magic-link sign-in (no passwords)
Login -> “Sign in with email” -> send -> “Check your inbox” -> callback -> Workspace select -> Projects

C) First-time user
Login -> callback -> “Set up your workspace” (minimal) -> Projects empty state -> New project

D) Returning user
Auto session -> directly into last workspace -> Projects

E) Session expired / revoked
Any screen -> “Session expired” -> Login

F) Invite acceptance
Invite link -> “You’ve been invited to Workspace X” -> Sign in -> Join -> Projects

3) SCREENS (BLUEPRINTS)

3.1 Screen: Login (Primary Entry)
Route: /login
Layout:
- Fullscreen bg.app.
- Centered card (bg.panel, radius.panel).
- Card width: 440px; responsive down to 320px with padding reductions.
Structure (top to bottom):
1) Title row:
   - “Prism” (H1)
   - Optional small pill tag: “Preview” (text.muted, bg.panel2)
2) Subtitle (caption):
   - “AI-assisted LaTeX editor” (text.secondary) OR omit for extreme minimalism.
3) Auth buttons stack (full width, pill, 44px height):
   - Continue with OpenAI (Primary inverted)
   - Continue with GitHub (Secondary)
   - Continue with Google (Secondary; optional if you want less noise)
4) Divider row (optional, subtle):
   - thin line OR just “or” in muted text centered (avoid strong borders)
5) Link row:
   - “Sign in with email” (text.secondary; hover -> text.primary)
6) Bottom legal:
   - “By continuing, you agree to Terms and Privacy.” (caption, text.muted)
Interaction:
- First focus: none. If keyboard user, focus lands on primary button.
- Loading: clicking an auth method disables all buttons + shows spinner in chosen button.
Error handling:
- Inline message at top of buttons (text.danger) if OAuth fails.

3.2 Screen: Email Sign-In
Route: /login/email
Layout: same centered card.
Fields:
- Email input (pill)
- Primary button: “Send magic link” (inverted)
- Secondary text link: “Back” (tertiary)
States:
- Sending -> button spinner “Sending…”
- Sent -> replace form with confirmation screen (3.3)
Validation:
- Inline error under input, text.danger.
- Keep height stable by reserving one line for error.

3.3 Screen: Check Inbox (Magic Link Sent)
Route: /login/email/sent
Card content:
- Title: “Check your inbox”
- Caption: “We sent a sign-in link to <email>.”
- Actions:
  - Primary (secondary style): “Resend link” (cooldown 30s)
  - Tertiary: “Use a different email”
- Extra:
  - “Didn’t receive it? Check spam.” (muted)

3.4 Screen: Workspace Select (if user has >1)
Route: /workspaces
Purpose: pick a workspace (org/team) before entering projects.
Layout:
- Fullscreen with centered panel OR wide panel.
Recommended:
- Centered panel, width 560–720px.
Content:
- Title: “Choose a workspace”
- Search input (optional if many workspaces)
- Workspace list (cards):
  - Each row: workspace avatar + name + role label (Owner/Admin/Member) in muted
  - Hover lifts to bg.panel2
  - Clicking enters workspace
Actions:
- Primary: none (selection is direct click)
- Secondary: “Create new workspace” (if allowed)
- Tertiary: “Sign out”

3.5 Screen: Create Workspace (minimal)
Route: /workspaces/new
Only if your product needs it; otherwise omit and keep invites/individual accounts.
Fields:
- Workspace name
- Optional: “Use for: Personal / Team” radio (optional)
CTA:
- “Create workspace” (inverted)

3.6 Screen: Projects (Empty State)
Route: /app/projects (inside workspace)
Matches your screenshot style:
- Left nav rail with “All Projects / Your Projects / Shared with you”
- Main rounded panel with header row:
  - Title: “Your Projects”
  - Search pill
  - Right actions: Import (white pill dropdown), + New (white pill)
Empty state (center of main panel):
- Title: “No projects yet”
- Caption: “Create a LaTeX project or import one.”
- Buttons:
  - + New Project (primary inverted)
  - Import (secondary)
Microcopy must remain short and technical.

3.7 Modal: New Project
Triggered by: + New (top right)
Modal design:
- Center modal bg.panel, radius.panel, shadow soft, dim background.
Fields:
- Project name (required)
- Template dropdown:
  - Blank
  - Article
  - Beamer
  - IEEE/ACM (optional)
- Optional toggle: “Enable realtime compilation” (default on)
Actions:
- Primary: “Create project”
- Secondary: Cancel
Validation:
- Disable Create until name non-empty.

3.8 Modal: Import Project
Triggered by: Import dropdown
Options list (simple):
- Import .zip
- Import from GitHub
- Import from Overleaf (optional; only if implemented)
Each option opens a submodal:
A) .zip upload: drag/drop area, file picker
B) GitHub: repo URL input + branch dropdown
State:
- Show progress with monospaced lines, like logs, in a collapsible section.

3.9 Screen: Session Expired
Route: /auth/expired
Centered card:
- Title: “Session expired”
- Caption: “Please sign in again.”
- Primary: “Sign in”
- Tertiary: “Back to home” (if exists)

3.10 Screen: Access Denied / No Permission
Route: /auth/denied
Card:
- Title: “You don’t have access”
- Caption: “Request access from a workspace admin, or switch workspace.”
- Buttons:
  - “Switch workspace”
  - “Sign out”

3.11 Screen: Invite Acceptance
Route: /invites/:token
Flow:
- If not signed in: show invite details + “Sign in to accept”
- If signed in: show workspace name + role + accept button
Card:
- Title: “You’ve been invited”
- Details: Workspace name, inviter, permissions (muted)
- Primary: “Accept invite”
- Secondary: “Decline” (text button)

3.12 Screen: Maintenance / Service Degraded (optional)
Card:
- Title: “Prism is temporarily unavailable”
- Caption: “We’re restoring service. You can still access local files if enabled.” (only if true)
- Actions:
  - Retry
  - Status page link (if you have one)

4) COMPONENT INVENTORY (REUSABLE)

4.1 AuthProviderButton
Props:
- provider (openai/github/google)
- variant (primary inverted / secondary)
- loading bool
- disabled bool
Behavior:
- When loading true: lock width, show spinner left of label.

4.2 CenterCard
- Max width, responsive padding, consistent radius and surface tone.

4.3 PillInput
- left icon optional
- errorText slot reserves one line

4.4 WorkspaceRow
- avatar, name, role badge
- hover: bg.panel2
- optional kebab for management

4.5 InlineNotice
- type: error/success/warn
- minimal: single line, no big boxes.

5) RESPONSIVE / ACCESSIBILITY RULES

- Minimum 320px width support: card becomes near-full width with 16px outer padding.
- Keyboard navigation: visible focus ring (accent.primary) on buttons and inputs.
- Color contrast: text.primary on bg.panel must pass WCAG AA (keep text not too dim).
- Avoid tiny click targets: min 32px height for icons, 44px for primary actions.

6) MICROCOPY GUIDELINES

- “technical calm”: short, factual, no jokes.
- Avoid marketing verbs. Prefer: “Sign in”, “Create project”, “Import”.
- Errors: state what happened + what to do next.
  Examples:
  - “Sign-in failed. Try again.”
  - “Invalid email address.”

7) VISUAL CONSISTENCY NOTES (MATCHING YOUR SCREENSHOTS)

- Primary actions on dashboards are white pills (Import, + New). Mirror this in login: “Continue with OpenAI” as white pill.
- Selected items are indicated by a rounded background behind the label, not a left border.
- The UI avoids heavy separators; use spacing and slight tone differences.
- Logs/diagnostics use monospaced, low-contrast text in a right-side panel; reuse this pattern for import progress and auth debug details (collapsed by default).

END OF BLUEPRINT
