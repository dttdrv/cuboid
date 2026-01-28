# project roadmap

## current status: prototype (phase 3)

we are building a sovereign data layer application ("cuboid") with a focus on zero-knowledge encryption. current implementation is a local-only prototype using mock services to validate the architecture before integrating real backend infrastructure.

### completed features

1.  **infrastructure**
    -   vite + react + typescript + tailwind css setup.
    -   project structure established (`core/`, `ui/`, `assets/`).

2.  **authentication**
    -   custom `authprovider` with support for "dev mode" bypass.
    -   **security decision**: mock sessions are ephemeral (in-memory only). refreshing the page logs you out. this is intentional to prevent insecure persistence of mock credentials.
    -   protected route wrappers implemented.

3.  **data layer (mock)**
    -   `projectservice` simulates a database with async methods.
    -   simulated client-side encryption (currently using base64 proxy for demonstration) to validate the "decrypt-on-render" flow.
    -   data flow: project list -> fetch encrypted project -> local decrypt -> render editor.

4.  **ui components**
    -   login page (mistral-style aesthetic).
    -   dashboard (project list).
    -   editor page (decrypted content view).

### known issues

-   **rendering failure**: the application currently launches (`main.tsx` executes) but renders a blank screen in some environments. suspected cause is a race condition in the root element mounting or a router configuration conflict.
    -   *next step*: verify `index.html` root id matches `main.tsx` target and inspect react 18 concurrency handling.

## upcoming milestones

### phase 4: backend integration
-   [ ] replace `mockprojectservice` with real supabase client.
-   [ ] implement row level security (rls) policies on supabase.
-   [ ] replace ephemeral mock auth with real supabase auth.

### phase 5: real encryption
-   [ ] replace `atob/btoa` simulation with `webcrypto api` (aes-gcm).
-   [ ] implement key management strategy (derive key from user password or dedicated key encryption key).

### phase 6: collaboration
-   [ ] integrate yjs for conflict-free resolution.
-   [ ] implement webrtc or websocket provider for real-time sync.

## architecture notes

-   **option a (zero-knowledge cloud)**: the server never sees plaintext. all encryption/decryption happens in the browser.
-   **encryption**: currently mocked. target algorithm is aes-256-gcm.
-   **state**: currently local component state. plan to move to a global store (zustand) if complexity grows.
