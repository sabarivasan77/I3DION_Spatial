# I3DION SPATIAL — SECURITY-FIRST MASTER PROMPT v2.0
**Target Repository:** `sabarivasan77/I3DION_Spatial` • **Security Annexes A1–A13 are Binding**

---

## 0. OPERATING RULES
1. **Planning mode. One phase at a time.** Produce a Plan artifact, wait for owner approval, execute, report, stop at the Gate.
2. **Evidence over claims.** "Done" means: code diff + test that failed before and passes after + exact command output.
3. **Fail closed, deny by default.**
4. **Scope freeze:** OmniStudio low-code, LogicCraft, iScript, DataBridge, duplicate intelligence engines are frozen until Gate S4.

---

## 1. PHASES OVERVIEW
- **Phase S0: Emergency Hotfix & Containment** (C1, C2, C3, SEC-01, H5, H3, H4) — *COMPLETED & VERIFIED*
- **Phase S1: Identity, Sessions & Single Authorization Engine** (Annex A1, A2, A4, TOTP MFA) — *COMPLETED & VERIFIED*
- **Phase S2: Tenant Isolation & Data Layer** (Annex A5, A6 RLS, non-owner DB role, `withTenant`)
- **Phase S3: Upload Pipeline & Storage Security** (Annex A7 pre-signed URLs, magic byte sniffing, SVG sanitization)
- **Phase S4: Secret Eradication, Rate Limiting & Hardening Gate** (Annex A3, A13, history rewrite, `.gitleaks.toml`)

---

## 2. BINDING TECHNICAL ANNEXES

### Annex A1: Argon2id Hashing & Password Policy
- `argon2id` (64 MiB memory, 3 iterations, 1 parallelism, 16-byte cryptographically secure salt).
- Constant-time dummy verification for non-existent users.
- 12–128 character policy, breached password check via HaveIBeenPwned k-anonymity API, transparent upgrade of legacy bcrypt passwords upon login.

### Annex A2: Dual-Token Session Architecture
- 10-minute JWT access tokens (`sub`, `org`, `role`, `sid`, `ver`).
- 14-day sliding refresh token in `sessions` table (stored as SHA-256). Delivered via `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Automatic reuse detection: replaying an already-rotated token revokes the entire family with `TOKEN_REUSE_DETECTED`.
- Global session invalidation via `users.token_version`.

### Annex A3: Throttling & Lockout Matrix
- Sliding window limiters: login (20/10m), signup (5/h), forgot-password (10/h), reset-password (10/15m), public leads (10/h), public events (120/m, 4 KB cap).

### Annex A4: Canonical Authorization Engine `can()`
- Single decision point `can(actor, action, resource) => { allow: boolean, reason?: string }`.
- Explicit `PERMISSIONS` matrix for `Owner`, `Admin`, `Manager`, `Sales`, `Marketing`, `Analyst`, `Viewer`.
- Strictly membership-derived roles from `organization_members`.
- Tenant isolation: `resource.organization_id === actor.org`.

### Annex A5: PostgreSQL Row-Level Security (RLS)
- Enable and Force RLS on all tenant-scoped tables.
- Application DB user `i3dion_app` with restricted DML.
- Policy: `USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid)`.

### Annex A6: Transaction & Tenant Helper
- `withTenant(orgId, fn)` and `withTransaction(fn)`.

### Annex A7: Secure Upload & Signed Storage Pipeline
- Deprecate public static `/uploads`.
- Pre-signed URLs with 15-minute expiry.
- Magic byte verification (glTF `0x46546C67`, PNG, JPEG, PDF), 50 MB caps, SVG sanitization.

### Annex A8: Payment Integrity & Server Authority
- Authoritative DB `orders` table; `/verify` ignores client params, verifies with Razorpay API, records real `amount_inr`.

### Annex A9: One-Time Cryptographic Reset Tokens
- SHA-256 hashed single-use tokens in `password_reset_tokens`; 30-min expiry; atomic burn on consumption.

### Annex A10: Tamper-Evident Audit Logging
- Hash-chained audit logs with actor, action, resource, timestamp, and client metadata.

### Annex A11: Entitlement & Quota Enforcement
- Atomic server-side plan limit checks.

### Annex A12: Live Telemetry & Event Ingestion
- Real-time event ingestion from Hub; zero hardcoded demo data in production.

### Annex A13: Configuration & Secret Hygiene
- Strict Zod validation on startup; no fallback secrets; secrets never committed.
