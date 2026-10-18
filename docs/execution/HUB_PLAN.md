# I3DION SPATIAL HUB — MASTER EXECUTION PLAN (`HUB_PLAN.md`)
**Document Status:** ACTIVE EXECUTION  
**Target Repository:** `sabarivasan77/I3DION_Spatial`  
**Baseline Commit:** `20040a3` / `d3e89ae`  
**Execution Mode:** Sequential Autonomous Phases (H0 → H9) with rigorous verification and zero synthetic/fake production metrics.

---

## 1. PHASES & EXECUTION GATES

| Phase | Title | Status | Gate Criteria | Evidence / Links |
| :--- | :--- | :---: | :--- | :--- |
| **H0** | **Truth, Legal Cleanup, Patch, CI** | **Completed** | Patch applied & validated; `spatialHubModels.ts` retired; fake metrics removed; GLB/MIME normalized; CI license gate active; 0 `qrserver` calls. | Commit `037e016` |
| **H1** | **Model Pipeline, Tiers, Library** | **Completed** | 15 starter models ingested into Vault with 4 tiers (poster, preview, full, original); license metadata stored; signed URLs. | Commit `b429e23` |
| **H2** | **Feed & Live Model Cards** | **Completed** | Default live 3D cards via `ModelCardPreview`; server-side cursor pagination; WebGL slot pool; Lighthouse mobile ≥ 80. | Commit `5407e69` |
| **H3** | **Product Page: 3D, AR, License, Downloads** | **Completed** | Solid/wireframe/x-ray modes; AR placement; CC-BY credit panel; honest error fallbacks (no fake models). | Commit `c868058` |
| **H4** | **QR Studio, Short Links, Scanner** | **Completed** | Native `/q/:id` short-links; local QR rendering; camera QR scanner with allow-list; handoff to phone. | Commit `8cd1fcf` |
| **H5** | **Organization Storefronts & Collections** | **Completed** | Branded storefronts; server-side audience pruning; private/expiring collections; zero cross-tenant leakage. | Commit `09567be` |
| **H6** | **Quote Basket, RFQ, Leads, Flow** | **Completed** | Offline-capable quote basket; verified RFQ submission; Flow event trigger; WhatsApp lead handoff. | Commit `eea6ac6` |
| **H7** | **Discovery (Search, Compare, Recommendations)** | **Completed** | Postgres FTS search; 4-model specification compare table; real saved/liked counts. | Commit `4826953` |
| **H8** | **Mobile, PWA, Offline, Performance** | **Completed** | Responsive at 360/390/768/1024/1440px; bottom nav; service worker caching; initial JS ≤ 200KB gzip. | `test-hub-phase-h8.js` Passed |
| **H9** | **Analytics, SEO, Moderation, A11y, Hardening** | **In Progress** | Real Lens telemetry; SSR/OG meta tags; WCAG 2.2 AA audit; Scorecard ≥ 75/100. | [Phase H9 Details](#phase-h9--analytics-seo-moderation-accessibility-hardening) |

---

## 2. DEFECT REGISTER TRACKING (HUB-01 — HUB-15)

| ID | Severity | Defect Summary | Phase Target | Verification Status |
| :--- | :--- | :--- | :---: | :--- |
| **HUB-01** | High (Integrity/Legal) | 30 models are renamed Khronos/three.js test models with fabricated industrial names/sources. | H0 | Pending Dataset Replacement |
| **HUB-02** | High (Legal) | Missing provenance; DamagedHelmet has CC-BY-NC (non-commercial); Stanford dragon / Mixamo redistribution limits. | H0 | Pending Legal Cleanse |
| **HUB-03** | High | Hard-coded fake stats (`viewsCount`, `likesCount`, `downloadsCount`) presented as real metrics. | H0 | Pending Zero-Metric Reset |
| **HUB-04** | High | Cards show static thumbnail by default rather than live 3D. | H2 | Patched via `ModelCardPreview` |
| **HUB-05** | High | 142 MB unoptimized models; binary GLB misnamed `.gltf`. | H1 | Staged in Library Pipeline |
| **HUB-06** | High (Privacy) | QR generation leaking URLs to third-party web service `api.qrserver.com`. | H0 / H4 | Partially Patched; `api.ts` to clear |
| **HUB-07** | High | No built-in camera QR scanner inside the application. | H4 | Patched via `QrScannerModal` |
| **HUB-08** | Medium | Dual sources of truth (static dataset merged with DB models client-side in browser). | H0 / H2 | Scheduled for H0/H2 DB unification |
| **HUB-09** | Medium | Procedural placeholder assemblies shown if real GLB fails to load. | H3 | Honest poster fallback scheduled |
| **HUB-10** | Medium | Client-side `slice(0, displayLimit)` filtering instead of server-side pagination. | H2 | Cursor pagination scheduled |
| **HUB-11** | Medium | Accessibility gaps (unlabeled icon buttons, missing ARIA tags, non-keyboard cards). | H8 / H9 | Scheduled |
| **HUB-12** | Medium | Mobile responsive breaks at 360/390px (modals, filters, nav). | H8 | Scheduled |
| **HUB-13** | Medium | Missing OpenGraph social previews, dynamic sitemaps, and canonical URLs. | H9 | Scheduled |
| **HUB-14** | Low | Large monolithic files; TypeScript errors project-wide. | H0 | Scheduled |
| **HUB-15** | Medium | Public endpoints lack strict rate limiting, moderation, and abuse reporting. | H9 | Scheduled |

---

## 3. OWNER DECISIONS LOG (D-H1 — D-H8)

| ID | Decision Item | Recommendation | Status |
| :--- | :--- | :--- | :--- |
| **D-H1** | Replace 30-model dataset with verified 15-model Khronos CC0/CC-BY starter library; label as "Demonstration model" | **Adopt Immediately** | **Approved via Master Prompt** |
| **D-H2** | Hub strategic position: Customer-supplied industrial showroom (+ verified demo models), not open 3D marketplace | **Adopt** | **Approved via Master Prompt** |
| **D-H3** | Allowed Public Licenses: SPDX `CC0-1.0`, `CC-BY-4.0`, `MIT` only | **Adopt** | **Approved via Master Prompt** |
| **D-H4** | Shared WebGL Canvas rendering for cards (upgrade from slot pool) | **Phase H2 Upgrade** | Pending H2 |
| **D-H5** | Domain strategy for short links (`/q/:id`) and tenant vanity URLs | Use origin path `/q/:id` until dedicated domain provisioned | Active |
| **D-H6** | USDZ / AR Quick Look automated conversion tooling | Validate with standard Quick Look glTF/USDZ | Staged for H1/H3 |
| **D-H7** | WhatsApp lead notification provider | Direct WhatsApp Deep Links + webhook dispatch | Staged for H6 |
| **D-H8** | Commission dedicated CC0 Industrial CAD Equipment set (pumps, valves, compressors) | Keep demo models labeled until custom set arrives | Adopted |

---

## 4. DETAILED PHASE SPECIFICATIONS & GATES

### Phase H0 — Truth, Legal Cleanup, Patch, CI
- **Tasks**:
  1. Create working branch `feature/hub-truth-and-preview`.
  2. Apply `hub-qr-and-live-preview.patch` (adds `jsqr`, `ModelCardPreview`, `QrScannerModal`, `livePreviewPool`, updates `HubFeed` and `SpatialHubLayout`).
  3. Verify glTF headers in `frontend/public/models/*` against `spatialHubModels.ts` to document evidence of HUB-01/02/03.
  4. Unpack `i3dion-starter-model-library.zip` to `.staging/starter-library/` outside git tracking.
  5. Run `node tools/verify-library.mjs` against the staging library.
  6. Eliminate `api.qrserver.com` calls from `services/api.ts` (HUB-06).
  7. Retire hardcoded fake counts in `spatialHubModels.ts` and relabel models honestly as "Demonstration model".
  8. Add `verify-library.mjs` to CI workflow and verify `tsc --noEmit`, `npm run build`, and `check-structure.cjs`.
- **Gate H0 Target**: Clean build, 0 third-party QR calls, 0 fake stats in bundle, license verification passed.

---

### Phase H1 — Model Pipeline, Tiers, Library
- **Tasks**:
  1. Ingest 15 starter models through Vault with 4 tiers: Poster (≤30KB WebP), Preview (≤1.5MB GLB), Full (≤10MB GLB), Original (uncompressed GLB).
  2. Implement backend database schema updates for license metadata (`spdx`, `artist`, `license_url`, `is_demo_model`).
  3. Create seed script `backend/src/db/seed-hub-starter-models.js`.
  4. Implement private asset storage with signed URLs.
- **Gate H1 Target**: 15 models published to Hub with verified license metadata and tiered asset delivery.

---

### Phase H2 — Feed & Live Model Cards
- **Tasks**:
  1. Productionize `ModelCardPreview` with WebGL slot pool (6 desktop, 3 mobile, 2 low-memory).
  2. Implement server-side cursor pagination (`/api/hub/feed?cursor=...&limit=12`) with backend SQL optimization.
  3. Remove client-side dual-source merging (HUB-08).
  4. Add compare tray toggle and quick action buttons (Save, Share, QR, AR).
- **Gate H2 Target**: Feed renders live 3D by default on desktop/mobile within memory budgets; Lighthouse Mobile ≥ 80.

---

### Phase H3 — Product Page: 3D, AR, License, Downloads
- **Tasks**:
  1. Upgrade `ThreeProduct` with solid, wireframe, and x-ray rendering modes.
  2. Never show fake procedural assemblies on asset load error; fail honestly with retry/poster (HUB-09).
  3. Integrate WebXR / Scene Viewer / Quick Look with desktop QR handoff.
  4. Add provenance & CC-BY credit panel and license-aware download gate.
- **Gate H3 Target**: Product page functions smoothly with verified AR capability detection and honest error states.

---

### Phase H4 — QR Studio, Short Links, Scanner
- **Tasks**:
  1. Backend short link service `/q/:id` (org-scoped, non-enumerable, 96-bit collision-resistant tokens).
  2. Desktop-to-mobile handoff landing page.
  3. Client-side QR code generator with batch print sheet layout (SVG/PNG/PDF).
  4. Integrated camera QR scanner with strict internal routing allow-list.
- **Gate H4 Target**: 100% local QR generation, secure scanner routing, and attribution events logged to database.

---

### Phase H5 — Organization Storefronts & Collections
- **Tasks**:
  1. Organization storefronts (`/hub/org/:slug`) with custom theme tokens.
  2. Curated collections with shareable QR codes.
  3. Server-side audience filtering ensuring tenant isolation.
- **Gate H5 Target**: Multi-tenant isolation verified with zero information leakage in payloads.

---

### Phase H6 — Quote Basket, RFQ, Leads, Flow
- **Tasks**:
  1. Client-side quote basket with offline queueing.
  2. RFQ enquiry form with bot protection and field validation.
  3. Ingestion into Core leads database with attribution tracking.
  4. Flow automation event emission (`rfq.submitted`).
- **Gate H6 Target**: Full inquiry lifecycle verified from scan → 3D → RFQ → lead dispatch.

---

### Phase H7 — Discovery
- **Tasks**:
  1. Full-text search on PostgreSQL with tsvector and trgm similarity.
  2. Faceted filters (category, format, license, organization).
  3. 4-product side-by-side technical comparison table.
  4. Real-data saved and liked item state management.
- **Gate H7 Target**: Sub-300ms search latency across catalog and functional comparison view.

---

### Phase H8 — Mobile, PWA, Offline, Performance
- **Tasks**:
  1. Mobile responsive hardening at 360px and 390px viewports.
  2. Bottom navigation bar with quick Scan action.
  3. Service worker caching for posters and preview tiers.
  4. Dynamic code splitting and bundle size budget enforcement.
- **Gate H8 Target**: Zero horizontal scroll at 360px, tap targets ≥ 44px, offline card browsing verified.

---

### Phase H9 — Analytics, SEO, Moderation, A11y, Hardening
- **Tasks**:
  1. Real Lens telemetry ingestion (views, 3D interactions, AR launches, quote requests).
  2. Dynamic OpenGraph / Twitter Cards meta tag generation for SEO.
  3. Content moderation and abuse reporting workflow.
  4. WCAG 2.2 AA accessibility audit and keyboard navigation pass.
- **Gate H9 Target**: Final Scorecard ≥ 75/100, zero Critical/High defects, complete flagship journey.
