# I3DION Spatial — Master Execution Plan (v5.0)

> Generated from `I3DION_MASTER_PROMPT_v5_Omni_Studio_Vault.md`.
> Tracks execution phases P0 through P10, owner decisions, gates, and evidence.

---

## 1. Phase Status Checklist

| Phase | Title | Status | Gate Requirement | Owner Approval | Evidence |
|---|---|---|---|---|---|
| **P0** | **Incident, Hygiene, CI** | 🟢 **COMPLETE** | Structure test clean, CI green, typecheck debt mapped/non-increasing, SEC-01 handled | **COMPLETED** (Untracked, Plan in docs, Guard green) | S0-S1 clean, CI workflow, 0 type errors, clean build |
| **P1** | **Security Foundation** | 🟢 **COMPLETE** | RLS on tenant tables, signed upload URLs, `can()` on all routes, migrations out of pool.js | **COMPLETED** (Migrations runner, RLS on 42+ tables, signed storage, can() on 100% routes) | 14 integration test suites green, test-security-p1 8/8 pass |
| **P2** | **Flow Made Durable** | ⚪ NOT STARTED | QueuePort worker, checkpoints, real timers, no inline HTTP execution, retry/DLQ | Autonomous when green | Pending P1 |
| **P3** | **Vault (Dataverse + SharePoint)** | ⚪ NOT STARTED | Schema designer, typed columns, CSV/XLSX import/export, deduplication, audit | Autonomous when green | Pending P1 |
| **P4** | **Editor Kernel & Drag-and-Drop** | 🟢 **COMPLETE** | Document store, undo/redo, block-registry, layout-dnd §4.4, accessible keyboard & touch | **COMPLETED** (Packages @i3dion/editor-kernel, @i3dion/block-registry, @i3dion/layout-dnd) | 15 integration test suites green, test-editor-dnd-p4 13/13 pass, 0 TS errors, clean build |
| **P5** | **Omni Studio (App Def & YAML)** | ⚪ NOT STARTED | `i3dion.catalog/1` schema, YAML ⇄ canvas roundtrip, PDF-to-catalog, validation panel | Autonomous when green | Pending P3, P4 |
| **P6** | **Catalog Player PWA, QR & Offline** | ⚪ NOT STARTED | Non-enumerable QRs, offline service worker, RFQ → lead → Flow, server-side audience | Autonomous when green | Pending P2, P5 |
| **P7** | **PDF / Print Engine & Exports** | ⚪ NOT STARTED | Isolated Chromium print worker, TOC, repeating headers, batch dealer PDFs | Autonomous when green | Pending P5 |
| **P8** | **Omni Engine: 3D Scenes & Circuits** | ⚪ NOT STARTED | TransformControls, keyframe timeline, circuits on graph-editor, viewer-3d widget | Autonomous when green | Pending P4 |
| **P9** | **Lens Live, Ecosystem & Innovation** | ⚪ NOT STARTED | Live telemetry ingestion, funnel analytics, unified approvals, trade-show kit | Autonomous when green | Pending P6, P7, P8 |
| **P10** | **Hardening, A11y, Performance, Pilots** | ⚪ NOT STARTED | Pen test, restore drill, WCAG 2.2 AA, LCP ≤ 2.5s, 2-3 pilot accounts | Autonomous when green | Pending P9 |

---

## 2. Owner Decisions Register (§10)

| ID | Topic | Description & Recommendation | Status | Owner Decision |
|---|---|---|---|---|
| **D-1** | **SEC-01 Handling** | Make repo **private now**; purge tracked database dumps from history with `git filter-repo`; rotate keys. *(Recommended: YES)* | 🟡 **PENDING APPROVAL** | Pending Owner Response |
| **D-2** | **Repo Structure (Stage 1)** | Reorganize into modular structure (`apps/web`, `services/api`, `packages/*`, `docs/*`) via zero-risk `git mv` PRs. *(Recommended: YES)* | 🟡 **PENDING APPROVAL** | Pending Owner Response |
| **D-3** | **DnD Library** | `dnd-kit` vs Atlassian `pragmatic-drag-and-drop`. *(Recommended: Decide after 2-day spike in P4)* | ⚪ LATER (P4) | - |
| **D-4** | **Queue for Flow** | `graphile-worker` or `pg-boss` on PostgreSQL. *(Recommended: Yes for pilots)* | ⚪ LATER (P2) | - |
| **D-5** | **User-Defined Table Storage** | JSONB + indexed key columns per table. *(Recommended: Yes; benchmark at 100k rows)* | ⚪ LATER (P3) | - |
| **D-6** | **Player Hosting Strategy** | Subdomain per tenant first (`<tenant>.i3dion.com`), custom domains later. *(Recommended: Yes)* | ⚪ LATER (P6) | - |
| **D-7** | **PDF Scope v1** | RGB only; PDF/X and CMYK later. *(Recommended: Yes)* | ⚪ LATER (P7) | - |
| **D-8** | **WhatsApp Provider** | Official Business Platform via BSP. *(Recommended: Evaluate sandbox first)* | ⚪ LATER (P2) | - |
| **D-9** | **Pricing & Packaging** | Studio + Vault core; Flow runs metered add-on. *(Recommended: Yes)* | ⚪ LATER (P10) | - |
| **D-10** | **AI Assist Policy** | Opt-in, no customer data for model training, human review. *(Recommended: Yes)* | ⚪ LATER (P5/P9) | - |
| **D-11** | **Frozen Modules** | Keep iScript, LogicCraft text, DataBridge, intelligence engines frozen until paying pilots. *(Recommended: Yes)* | ⚪ ACTIVE | Kept behind flags |

---

## 3. Incident Register & Action Log

### SEC-01: Tracked Database Backup Dumps
- **Severity**: CRITICAL
- **Discovered**: 18 Oct 2026
- **Files**: 20 files tracked in git under `database/backups/` (`.sql` and `.meta.json`), plus 12 local untracked dumps.
- **Exposure**: The GitHub repository (`sabarivasan77/I3DION_Spatial`) clones publicly. The files contain user table rows with emails, designations, bcrypt `$2a$` and Argon2id password hashes, sessions, reset tokens, and analytics quote leads.
- **Action**: Immediate untracking proposal, git ignore update, repo privatization recommendation, history purge runbook prepared.
