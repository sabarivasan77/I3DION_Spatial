# Mobile threat model (initial)

**Scope:** Phase 0-1 Flutter foundation and QR/deep-link flow. This is an
initial threat-model note,
not a security certification. Controls described as future work are not yet
implemented.

## Assets and trust boundaries

- Public and organization-only catalog metadata and model assets.
- User access and refresh tokens, organization membership, and local reactions.
- Downloaded model files, cached catalog data, and their integrity/version data.
- App-link and QR content identifiers, plus the app's release signing identity.
- Boundaries include external QR codes, the network/backend, signed object
  storage URLs, device-local storage, native 3D/AR viewers, and CI/release
  infrastructure.

## Principal threats and planned controls

| Threat | Impact | Required controls |
| --- | --- | --- |
| A crafted QR code or deep link directs the app to an attacker-controlled URL. | Phishing, unintended navigation, or unsafe content access. | Implemented in Phase 1: exact HTTPS host allowlist (empty by default), supported content paths and ID validation, restricted custom-scheme paths, and no arbitrary browser/WebView launch. Domain association remains unconfigured until the canonical host is supplied. |
| A private catalog or model is fetched without entitlement, or a signed URL is reused after expiry. | Confidential industrial data disclosure. | Enforce tenant and role access on every request; issue short-lived signed URLs after authorization; enforce catalog download policy. Backend contract required. |
| A model file is oversized, corrupted, substituted, or crafted to stress a low-memory device/viewer. | Excessive resource use, failed viewing, or parser vulnerability exposure. | Check declared and actual size, verify SHA-256 and version before use, enforce device-aware limits, and test model format handling. Download/viewer phases. |
| Tokens or private offline content are exposed from app storage, logs, or backups. | Account takeover or data disclosure. | Access and rotating refresh tokens are stored as one record in OS-backed `flutter_secure_storage`; Android app backup is disabled; passwords are never persisted; auth request/response bodies are not logged. Private offline encryption and clearing future private files on logout remain unimplemented. |
| Offline user actions are replayed or applied twice after reconnection. | Incorrect user state or cross-account activity. | Queue explicit event IDs; use server-side idempotency and per-event conflict results; bind queued events to the account and clear them on logout. Sync phase. |
| CI output or release configuration exposes signing material. | Unauthorized app distribution or signing identity compromise. | Keep signing credentials in GitHub Secrets, restrict workflow permissions, avoid echoing secret values, and separate unsigned builds from signed release jobs. Phase 8. |

## Current controls

- The app contains no embedded credentials. Public catalog/model requests use
  the existing backend; sign-in, refresh, and logout use the existing `/api/auth`
  routes. The app does not connect directly to PostgreSQL.
- The Dio foundation has explicit timeouts, bounded retries for transient GET
  failures, and an interceptor that rejects non-HTTPS requests. The access
  token is attached only to same-origin API requests and never to auth
  endpoints or cross-origin asset URLs.
- The client does not log request or response bodies.
- Login validates email/password input, supports the backend MFA challenge,
  stores only the access/refresh token session and account fields in secure
  storage, rotates tokens on session restoration, and clears local state on
  logout. Passwords remain in memory only while the login screen is open.
- Product likes use the existing authenticated Hub routes and are currently
  online-only. Automatic refresh/retry after an access token expires and
  offline reaction synchronization remain unimplemented.
- QR values are validated before in-app navigation. Only validated content
  identifiers are stored in scan history; original values, query strings, and
  fragments are never persisted. Camera and gallery errors have user-facing
  handling.
- Android and iOS register the custom `i3dion://` scheme. Flutter's default
  deep-link routing is disabled so app links are validated before routing.
- Android/iOS targets and CI quality checks are scaffolded; CI also scans the
  Flutter lockfile with OSV-Scanner.

## Open decisions and residual risk

- Product/backend owners must approve the canonical QR content domain,
  organization access semantics, mobile API contract, and model-size limits.
- HTTPS app/universal links are not platform-associated yet. Android
  `assetlinks.json`, iOS `apple-app-site-association`, the iOS Associated
  Domains entitlement, and production signing identifiers require the real
  domain and release credentials.
- Private catalog authorization, private offline encryption/key lifecycle,
  authenticated API request attachment, certificate pinning policy,
  viewer/AR native attack surface, and store signing/release protections remain
  to be designed and verified in their later phases.
- Phase 1 QR/deep-link and gallery flows were exercised in an Android emulator.
  The app has not been tested on a physical device, low-memory Android
  hardware, or iOS.
