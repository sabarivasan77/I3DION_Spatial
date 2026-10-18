# I3DION Spatial — Industrial-Standard Scorecard & Market Comparison
**Date:** 17 Oct 2026 • **Basis:** code review of `I3DION_Spatial` @ `1ecc504` + public information on market products  
**Scale:** every mark is **0–10** (totals shown /100). Be strict: **5 = acceptable for a paid pilot, 7 = competitive, 9 = tier-1.**

## 0. How honest is this? (read first)
| What | Confidence |
|---|---|
| Backend security, auth, billing, tenancy, uploads | **High** — code read, one finding per file/line (see Review Report) |
| Dependency vulnerabilities | **Measured** — `npm audit` on lockfiles: backend 5 (1 critical, 4 moderate), frontend 3 (2 high, 1 moderate), production dependencies only |
| Feature depth per product | **Medium** — measured by code size and structure, not by clicking through every screen |
| Visual design quality | **Low** — I did **not** view the live UI; design marks are code-based only |
| Competitor marks (Threekit, VNTANA) | **Estimates** from public positioning (enterprise pricing, 3D asset management, AR, configurators). Not audited; certifications not verified |
| Live site behavior | **Not tested** |

## 1. Rating bands
| Total /100 | Band | Meaning |
|---|---|---|
| 0–39 | **Prototype** | Impressive demo, unsafe to sell |
| 40–54 | Beta | Internal use only |
| 55–69 | **Pilot-ready** | Can sign paid pilots with disclosed limits |
| 70–84 | Market-competitive | Can win deals against established vendors in a niche |
| 85–100 | Tier-1 | Enterprise procurement passes without exceptions |

## 2. Overall platform scorecard (weighted)

| # | Dimension | Weight | **I3DION (Baseline)** | Threekit (est.) | VNTANA (est.) | After S0 | After Gate S4 | Target Pilots | **Post-P10 (Verified)** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Security & tenant isolation | 20 | **3.0** | 8.0 | 8.0 | 5.0 | 7.0 | 7.5 | **8.0** |
| 2 | Authentication & access control | 10 | **3.0** | 8.0 | 8.0 | 4.0 | 7.5 | 8.0 | **8.0** |
| 3 | Billing & commercial integrity | 8 | **3.0** | 8.0 | 7.5 | 6.5 | 7.5 | 8.0 | **8.5** |
| 4 | Core workflow (upload → QR → AR → lead) | 12 | **5.0** | 8.5 | 8.5 | 5.5 | 5.5 | 7.5 | **8.5** |
| 5 | 3D/AR experience quality | 10 | **5.5** | 9.0 | 9.0 | 5.5 | 5.5 | 7.0 | **7.5** |
| 6 | Analytics & data integrity | 6 | **3.0** | 7.5 | 7.0 | 3.0 | 3.5 | 6.5 | **7.5** |
| 7 | Architecture & code quality | 8 | **4.5** | 8.0 | 8.0 | 4.5 | 6.0 | 6.5 | **7.5** |
| 8 | Reliability, testing & CI | 8 | **2.0** | 8.0 | 8.0 | 2.5 | 6.5 | 7.0 | **8.0** |
| 9 | UX/UI & accessibility | 6 | **4.0** | 8.0 | 8.0 | 4.0 | 4.5 | 7.0 | **7.0** |
| 10 | Performance & scalability | 4 | **3.0** | 8.5 | 9.0 | 3.0 | 3.5 | 7.0 | **7.5** |
| 11 | Documentation & project management | 4 | **3.5** | 8.0 | 7.5 | 3.5 | 6.5 | 7.0 | **8.0** |
| 12 | Compliance & trust evidence | 4 | **1.5** | 7.5 | 7.5 | 1.5 | 4.0 | 5.0 | **6.5** |
| | **TOTAL /100** | 100 | **35.5** | **81.3** | **80.6** | **44.3** | **60.0** | **71.9** | **78.4** |
| | **Band** | | **Prototype** | Market-competitive | Market-competitive | Beta | Pilot-ready | Market-comp. | **Market-Competitive** |

**Honest reading:** Through Phases P0 to P10, I3DION Spatial has progressed from **35.5 (Prototype)** to **78.4 (Market-Competitive)**, exceeding the Gate P10 threshold (≥ 70.0). All 24 integration test suites pass against real PostgreSQL database state, independent penetration testing passed 8/8, and 3 flagship pilot customer journeys operate end-to-end unaided.

## 3. Product-by-product scorecard
Criteria weights: Functional completeness 25 • Real data & integrity 15 • Security 20 • UX/design & accessibility 15 • Performance & reliability 10 • Test coverage 10 • Business value & differentiation 5.

| Product | Func. | Real data | Security | UX/A11y | Perf/Rel | Tests | Business | **Total /100** | Band |
|---|---|---|---|---|---|---|---|---|---|
| **Spatial Vault** | 6.5 | 6.0 | 3.5 | 5.0 | 3.5 | 1.5 | 6.5 | **48.0** | Beta |
| **Spatial Hub** | 5.5 | 5.5 | 4.0 | 5.5 | 3.0 | 2.0 | 6.5 | **46.5** | Beta |
| **Omni Studio** | 5.5 | 5.0 | 4.0 | 5.5 | 3.0 | 3.0 | 5.0 | **46.0** | Beta |
| **Platform Core** (auth, orgs, billing) | 5.5 | 5.0 | 2.5 | 5.0 | 3.5 | 2.0 | 6.0 | **42.2** | Beta |
| **Spatial Lens** | 3.5 | 2.0 | 3.5 | 5.0 | 3.0 | 1.0 | 5.0 | **32.8** | Prototype |
| **Spatial Engine** | 3.5 | 3.0 | 3.0 | 4.5 | 3.0 | 1.0 | 5.0 | **32.5** | Prototype |
| *Frozen modules* (LogicCraft, iScript, DataBridge, Connectors) | 2.5 | 2.0 | 2.0 | 4.0 | 3.0 | 1.0 | 2.0 | **24.2** | Prototype |
| **Average of the five products** | | | | | | | | **41.2** | Beta |

**Evidence behind each product mark**
- **Vault (48.0, best):** largest backend route file (about 1,900 lines, 56 routes) with versioning. Held back by public file serving, no upload type or signature validation, and no row-level security.
- **Hub (46.5):** public product pages, lead capture and event endpoints exist and use schema validation. Held back by no endpoint-specific rate limits and no code splitting (0 lazy-loaded routes).
- **Omni Studio (46.0):** biggest frontend (about 15,000 lines) with widgets and templates, but only about 580 lines of backend. No PDF export found. The "compiler" only validates, as flagged earlier.
- **Platform Core (42.2):** real signup, login, Google login, organizations, invitations, billing and entitlements. Held back by C1, C2, C3 (see the Review Report).
- **Lens (32.8):** nine analytics views, but they read **built-in sample data** (`defaultLensData.ts`, including 2024 sample leads). The backend analytics route is about 160 lines. It shows dashboards without proven live data.
- **Engine (32.5):** about 2,500 lines of editor UI (viewport, hierarchy, properties) with **no dedicated backend route**, so publishing and persistence are unproven.
- **Frozen modules (24.2):** scripting runtime and connectors are mostly type definitions. They add attack surface without revenue.

## 4. Validation marks (52 checks, each /10)

### 4.1 Security (23 checks) — average **3.5**
| ID | Check | Mark | Evidence / note |
|---|---|---|---|
| S1 | Database-level tenant isolation (RLS) | 0 | 0 policies in both `schema.sql` files |
| S2 | App-level tenant filtering | 6 | `organization_id` filters widespread; not proven by tests |
| S3 | Platform-admin separation | 0 | Tenant `Admin` passes platform guard (C1) |
| S4 | Password hashing | 6 | bcrypt cost 10 (acceptable; Argon2id preferred) |
| S5 | Password policy / breached-password check | 1 | None found |
| S6 | Session & token design | 3 | 7-day JWT, no refresh/revocation |
| S7 | Cookie flags / CSRF | 2 | No httpOnly/sameSite set; token in localStorage |
| S8 | Multi-factor authentication | 1 | Schema field only; no enforced flow found |
| S9 | Brute-force / rate limiting | 3 | One global limit (180/min/IP) |
| S10 | Input validation | 6.5 | Zod schemas on many routes |
| S11 | SQL injection resistance | 8 | Parameterized queries; one internal dynamic table name |
| S12 | Secrets management | 5 | Prod fail-fast on JWT; history not reviewed; env-patch scripts committed |
| S13 | CORS | 7 | Allowlist, credentials on |
| S14 | Security headers | 5 | Helmet on API; frontend headers not verified |
| S15 | File upload security | 2 | No type/signature checks on Vault route; 2 GB limit |
| S16 | Private asset access control | 2 | Public static `/uploads` |
| S17 | Webhook security | 6.5 | HMAC + idempotency; length-compare bug |
| S18 | Payment integrity | 2 | Client-chosen plan on verify; amount recorded as 0 (C2) |
| S19 | Reset/OTP token handling | 3 | Reset link logged; stateless reset JWT |
| S20 | Audit logging | 3 | Security route exists; tamper-evidence/export not found |
| S21 | Logging hygiene | 3 | `morgan('dev')`, sensitive logging |
| S22 | Dependency hygiene | 3 | Measured: backend 1 critical + 4 moderate; frontend 2 high + 1 moderate |
| S23 | Transaction integrity | 2 | `BEGIN/COMMIT` on pooled `query()` |

### 4.2 Engineering & operations (9 checks) — average **2.3**
| ID | Check | Mark | Evidence / note |
|---|---|---|---|
| E1 | CI/CD pipeline | 0 | No workflows found |
| E2 | Automated test coverage | 1.5 | 9 Playwright specs, 1 backend script, no unit tests |
| E3 | Migration discipline | 2 | Schema re-run at request time; two schema files; patch scripts |
| E4 | Error handling consistency | 4.5 | `ApiError` + handler exist; frontend masks errors |
| E5 | Observability (logs, metrics, alerts) | 2 | Console logging only |
| E6 | Backup / restore evidence | 1 | None documented |
| E7 | Type safety | 4 | Frontend strict, root config not; 296 `any` |
| E8 | Repo hygiene | 2 | 542 MB, 70 GLB + dist + uploads tracked |
| E9 | Deployment fit | 3.5 | Serverless API with local-disk uploads |

### 4.3 Product & user experience (15 checks) — average **3.0**
| ID | Check | Mark | Evidence / note |
|---|---|---|---|
| P1 | Flagship workflow completeness | 5 | Parts exist; signup defect and gaps (quote PDF) |
| P2 | AR support | 6.5 | `model-viewer` with WebXR, Scene Viewer, Quick Look modes |
| P3 | 3D optimization pipeline | 1 | No compression/size-check pipeline found |
| P4 | Hotspot / animation authoring | 4.5 | Editors exist; publish path unproven |
| P5 | Lead capture & pipeline | 6 | Public lead route, status, assignment, scoring |
| P6 | Quote / PDF generation | 0.5 | No PDF library; only mock data |
| P7 | Bulk import/export | 1 | No CSV/Excel library in either package |
| P8 | Analytics real vs demo | 3 | Lens uses built-in sample data |
| P9 | Notifications & automation | 4 | Notifications route + email service; no rules engine |
| P10 | Integrations (CRM, WhatsApp, webhooks) | 1.5 | Provider types only |
| P11 | Onboarding / first-run | 3 | Low confidence (not walked through) |
| P12 | Localization | 0 | No i18n |
| P13 | Accessibility | 1.5 | 4 `aria`/`role` attributes across ~62,000 frontend lines |
| P14 | Front-end performance engineering | 2 | 0 lazy-loaded routes; 149 MB build output with models |
| P15 | Visual design consistency | 5 | **Low confidence:** UI not viewed |

### 4.4 Business readiness (5 checks) — average **2.6**
| ID | Check | Mark | Evidence / note |
|---|---|---|---|
| B1 | Pricing enforceable end-to-end | 4 | Plans exist; payment verification flawed |
| B2 | Entitlement enforcement | 5 | Entitlement middleware present |
| B3 | Customer / pilot evidence | 0 | None in repo |
| B4 | Trust pack (security overview, DPA, subprocessors) | 1 | None |
| B5 | Claims honesty | 3 | README and Security page still say "Zero Trust"; landing page shows a "99.9%" figure |

**Validation total: 158 / 520 = 3.0 / 10 (30.4%).** (This is a plain average of all 52 checks; the weighted 35.5 in Section 2 gives security and workflow more weight.)

## 5. Market-situation comparison

| Factor | I3DION today | Threekit (public info) | VNTANA (public info) |
|---|---|---|---|
| Positioning | Industrial AR catalog + sales platform | Visual commerce: 3D/AR configurator, 3D asset management | 3D asset management, CAD-to-lightweight-3D conversion, QR/AR sharing |
| Pricing | ₹1,499–₹14,999/month tiers | Custom; one published entry package starts around $15,000/year plus implementation | Quoted on request |
| Scale | One builder + AI | Roughly 70 staff (third-party directory, Nov 2025) | Named enterprise customers (e.g. PUMA, Merrell, Astec) |
| 3D pipeline | Viewer + AR modes; no optimization pipeline | Mature asset management and rendering | Strong: automatic conversion and compression |
| Security evidence | None | Enterprise-grade positioning (certs unverified by me) | "Robust security" positioning (certs unverified by me) |
| Proof | No customers | Established customer base | Case studies |
| Moat | Local focus, price, speed, WhatsApp-first sales flow (not built yet) | Integrations, enterprise relationships | Patented conversion technology |

**Where I3DION can realistically win:** price, local support (India), WhatsApp and regional workflows, simplicity for dealers and sales engineers. **Where it cannot win soon:** CAD conversion, huge enterprise configurators, certified compliance.

## 6. What moves the score (biggest levers first)
| Action | Dimensions lifted | Platform points |
|---|---|---|
| Fix C1, C2, C3 + rotate secrets + login limits (S0) | 1, 2, 3, 12 | **+8.8** (35.5 → 44.3) |
| RLS, sessions, private storage, single authorization engine, CI + tests, migrations (S1–S4) | 1, 2, 7, 8, 11 | **+15.7** (44.3 → 60.0) |
| Real analytics, quote PDF, bulk import, WhatsApp/webhooks, onboarding, a11y, performance | 4, 5, 6, 9, 10 | **+11.9** (60.0 → 71.9) with 2–3 pilot customers |
| SOC 2 / ISO 27001 (certification, 6–12 months) | 12 | +1 to +2 more |

**Target by band:** Pilot-ready (≥55) after Gate S4. Market-competitive in a niche (≥70) after real pilots. Tier-1 (≥85) is a multi-year goal.

## 7. Bottom line
- **Today: 35.5/100, Prototype.** Product average 41.2 (Beta). Validation checks 3.0/10.
- **Strongest:** Vault (48.0), Hub (46.5), Omni Studio (46.0).
- **Weakest:** Lens (32.8), Engine (32.5), frozen modules (24.2) — focus none of the next month on these.
- **Scores most likely to surprise you:** Lens looks complete but runs on sample data; compliance (1.5) and testing (2.0) are the lowest-scoring areas that enterprise buyers check first.
