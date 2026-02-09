# Security Headers and CSP Enforcement Path

## Runtime objective
Deploy defense-in-depth headers at serving layer (preferred) and keep local fallback in `index.html` for static preview.

## Required headers (serving layer)
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `X-Frame-Options: DENY`
- `Permissions-Policy` with least privilege defaults

## CSP baseline (initial)
- `default-src 'self'`
- `script-src 'self'`
- `style-src 'self' 'unsafe-inline'`
- `img-src 'self' blob: data:`
- `font-src 'self'`
- `worker-src 'self' blob:`
- `connect-src 'self' https://api.mistral.ai wss://signaling.yjs.dev`
- `frame-src 'self' blob:`
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`

## Implementation notes
- Local-first mode still requires explicit external egress declarations for AI and collaboration signaling.
- Tighten `connect-src` once custom signaling and AI proxy are available.
- Replace `'unsafe-inline'` for styles if build pipeline is updated to hashed/nonced styles.
