# I3DION Spatial — Phase S1 Plan: Identity, Sessions, RLS, Private Storage & CI
**Document ID:** PLAN-PHASE-S1-v3.0 • **Date:** October 18, 2026  
**Governing Standard:** I3DION MASTER PROMPT v3.0 ("Verified Build" Edition)  
**Branch:** `fix/omni-studio-bugs-v3`  
**Status:** PROPOSED — AWAITING OWNER APPROVAL

---

## 1. Executive Summary & Objective

Under Master Prompt v3.0, **Phase S1** combines the complete security foundation required before any commercial charging or feature work:
1. **Identity & Sessions (Annex A1, A2, RFC 6238):** *[ALREADY COMPLETED & VERIFIED in commit `907e401`]*
   - Argon2id password hashing + 12-char policy + HaveIBeenPwned k-anonymity check.
   - Dual-token session rotation with DB-backed family reuse detection and global invalidation.
   - RFC 6238 TOTP Multi-Factor Authentication with AES-256-GCM encryption at rest.
   - Single canonical `can(actor, action, resource)` authorization engine.
2. **PostgreSQL Row-Level Security & Non-Owner Role (Annex A5 & A6):** *[TO EXECUTE]*
   - Enable RLS and Force RLS on all tenant-scoped tables.
   - Create unprivileged application database role `i3dion_app`.
   - Implement `withTenant(orgId, fn)` setting `SET LOCAL app.current_org_id = $1`.
3. **Private Asset Storage & Upload Security Pipeline (Annex A7):** *[TO EXECUTE]*
   - Deprecate public static serving of `/uploads`.
   - Implement pre-signed, time-limited, tenant-authenticated delivery URLs.
   - Magic byte header sniffing (glTF `0x46546C67`, PNG, JPEG), 50 MB caps, and SVG sanitization.
4. **CI Pipeline & Quality Gate (Constitution §5):** *[TO EXECUTE]*
   - Create `.github/workflows/ci.yml` running lint, backend regression tests, secret scanning, and dependency audit.

---

## 2. Work Breakdown & Affected Files

### Slice 1: Database Row-Level Security & Tenant Isolation (Annex A5 & A6)
- **Database Migration:** `database/migrations/001_enable_rls_and_app_role.sql`
  - Creates non-superuser role `i3dion_app` with restricted DML permissions.
  - Alters every tenant table:
    ```sql
    ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
    ALTER TABLE [table] FORCE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation_policy ON [table]
      FOR ALL
      TO i3dion_app
      USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid)
      WITH CHECK (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);
    ```
- **Backend Data Layer:**
  - `backend/src/db/pool.js`: Add `withTenant(orgId, fn)` wrapping client checkout, `SET LOCAL app.current_org_id = $1`, executing queries, and resetting session.
  - `backend/src/middleware/auth.js`: Inject tenant context into request lifecycle so route handlers automatically execute inside `withTenant`.
- **Target Tables Protected:** `organizations`, `organization_members`, `users`, `orders`, `subscriptions`, `vault_assets`, `vault_products`, `vault_catalogs`, `vault_collections`, `vault_datasets`, `studio_projects`, `engine_experiences`, `lens_events`, `sessions`.

### Slice 2: Private Asset Storage & Upload Hardening Pipeline (Annex A7)
- **Backend Storage Service:** `backend/src/services/storage/storageService.js`
  - Abstract storage interface supporting local secure disk and S3/R2 object storage.
  - Generates HMAC-SHA256 pre-signed URLs with 15-minute expiry: `/api/vault/assets/:id/download?token=...&expires=...`.
  - Verifies tenant membership and permission before issuing or serving signed URLs.
- **Backend Upload Middleware:** `backend/src/middleware/uploadValidator.js`
  - Magic byte inspection:
    - glTF Binary: `0x46 0x54 0x6C 0x67` (`glTF`)
    - PNG: `0x89 0x50 0x4E 0x47`
    - JPEG: `0xFF 0xD8 0xFF`
    - PDF: `0x25 0x50 0x44 0x46`
  - File size enforcement: max 50 MB for 3D models, max 10 MB for images/PDFs.
  - Content sanitization: strip executable scripts and SVG `onload`/`onclick` attributes.
  - Deprecate bare `express.static('uploads')` in `backend/src/server.js`.

### Slice 3: CI/CD Quality Gate
- **Workflow File:** `.github/workflows/ci.yml`
  - Step 1: Checkout repository + `.gitleaks.toml` secret scan.
  - Step 2: Set up Node.js 20.x + PostgreSQL test container.
  - Step 3: Run backend test suites: `npm test` in `backend/` (all 10+ suites).
  - Step 4: Run frontend build: `npm run build` in `frontend/`.
  - Step 5: Run security audit: `npm audit --omit=dev`.

---

## 3. Test Suites & Verification Catalogue

To satisfy Master Prompt v3.0 acceptance criteria, we will implement and run two dedicated test suites:

### 3.1 `TENANT-*` Suite (`backend/test-security-tenant-rls.js`)
- `TENANT-01 [PASS]`: Querying a table inside `withTenant(OrgA)` returns only Org A records.
- `TENANT-02 [PASS]`: Querying a table inside `withTenant(OrgB)` without `WHERE organization_id` returns 0 Org A records (proving DB kernel RLS enforcement).
- `TENANT-03 [PASS]`: Attempting an `INSERT` or `UPDATE` with `organization_id = OrgB` inside `withTenant(OrgA)` throws PostgreSQL RLS check violation.
- `TENANT-04 [PASS]`: Direct connection as `i3dion_app` without setting `app.current_org_id` returns 0 rows (fail closed).

### 3.2 `UPLOAD-*` Suite (`backend/test-security-uploads.js`)
- `UPLOAD-01 [PASS]`: Direct HTTP `GET /uploads/model.glb` returns 404/403 (static serving disabled).
- `UPLOAD-02 [PASS]`: Accessing asset download endpoint without a valid signed token returns HTTP 401/403.
- `UPLOAD-03 [PASS]`: Cross-tenant signed URL tampering (changing asset ID or org ID) fails HMAC verification.
- `UPLOAD-04 [PASS]`: Uploading an executable disguised as `.glb` (missing `glTF` magic bytes) returns HTTP 400 `INVALID_FILE_SIGNATURE`.
- `UPLOAD-05 [PASS]`: Uploading an SVG containing `<script>alert(1)</script>` is sanitized or rejected.

---

## 4. Multi-Agent Verification Loop (Constitution §4)

In accordance with Master Prompt v3.0 Part A:
1. **Builder Role:** Implement Slice 1, Slice 2, Slice 3 in small vertical commits.
2. **Reviewer Role:** Inspect diff against Annex A5–A7; verify no regressions in existing 10 test suites.
3. **Adversary Role:** Run negative attack scripts:
   - Malformed `app.current_org_id` injection attempts.
   - S3 signed URL replay attacks past expiration.
   - Multipart form-data payload bomb attacks (>50 MB).

---

## 5. Scorecard Movement Targets

| Dimension | Baseline Score | Target Score After S1 | Rationale / Evidence |
|---|---|---|---|
| **1. Security & Tenant Isolation** | 3.0 / 10 | **7.0 / 10** (+4.0) | Full PostgreSQL RLS + `TENANT-*` suite passing + `can()` engine |
| **2. Auth & Access Control** | 3.0 / 10 | **7.5 / 10** (+4.5) | Dual-token rotation + Argon2id + TOTP MFA + `AUTH-*` green |
| **7. Architecture & Code Quality** | 4.5 / 10 | **6.5 / 10** (+2.0) | `withTenant` helper + unified error handling + private storage |
| **8. Reliability, Testing & CI** | 2.0 / 10 | **6.5 / 10** (+4.5) | 12 automated test suites green + GitHub Actions CI workflow |
| **OVERALL PLATFORM SCORE** | 44.3 / 100 | **60.0 / 100** (Pilot-ready Band) | Reaches threshold for pilot enterprise security reviews |

---

## 6. Execution Order & Gate S1 Protocol

1. Author and execute `database/migrations/001_enable_rls_and_app_role.sql`.
2. Implement `withTenant` helper in `backend/src/db/pool.js` and middleware.
3. Author and execute `backend/test-security-tenant-rls.js` (`TENANT-*`).
4. Implement `backend/src/services/storage/storageService.js` and upload validation.
5. Author and execute `backend/test-security-uploads.js` (`UPLOAD-*`).
6. Configure `.github/workflows/ci.yml`.
7. Execute full regression suite (`npm test` in backend: all 12 test suites).
8. Verify zero uncommitted changes and tag `v0.3.0-s1-verified`.
9. Stop at **Gate S1** and await owner approval before starting Phase E1.
