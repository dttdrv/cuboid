# Auth + Entry Overhaul Showcase

## Scope implemented
- Full blueprint auth + entry flow routes with local-first behavior.
- Canonical routes with redirect compatibility from legacy `/dashboard`.
- Workspace selection + creation, invite acceptance, session denied/expired states.
- Projects empty state with New Project and Import modal flows.

## Captured screens
- `output/playwright/01-login.png`: `/login`
- `output/playwright/02-email-signin.png`: `/login/email`
- `output/playwright/03-check-inbox.png`: `/login/email/sent`
- `output/playwright/04-workspaces.png`: `/workspaces`
- `output/playwright/05-projects-empty.png`: `/app/projects` empty state
- `output/playwright/06-new-project-modal.png`: New Project modal opened
- `output/playwright/07-import-modal.png`: Import modal opened
- `output/playwright/08-session-expired.png`: `/auth/expired`
- `output/playwright/09-access-denied.png`: `/auth/denied`
- `output/playwright/10-invite-acceptance.png`: `/invites/demo-invite`

## Local-first adaptations
- Provider buttons create local sessions and preserve provider metadata.
- Email magic-link flow is simulated locally (`send` + `consume`) with cooldown behavior.
- Workspace and invite models are stored in local storage.
- Invite acceptance grants local workspace membership and selects that workspace.

## Validation run
- `npm run build`: passed
- `npm run test -- --run`: passed
