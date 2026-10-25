# I3DION Spatial Lens — Reverse-Engineering Audit & Architecture Report

**Audit Date**: October 25, 2026  
**Auditor**: Senior Product Engineer & Full-Stack Architect  
**Scope**: Repository Audit of `I3DION_Spatial` (`frontend`, `backend`, `database`, `docs`)  
**Status**: Step A Complete — Repository Source of Truth Established

---

## 1. Executive Summary & Repository Map

`I3DION Spatial Lens` is the primary sales-team workspace, CRM, customer enquiry desk, and operational business intelligence command center within the I3DION spatial computing ecosystem.

### Repository Topology
```
d:\I3DION COMPANY FILES\i3dion-spatial\I3DION_Spatial
├── backend/                       # Node.js 20+ Express ESM backend
│   ├── src/
│   │   ├── config.js              # Environment & JWT config
│   │   ├── server.js              # Monolithic Express app entry point
│   │   ├── db/
│   │   │   ├── pool.js            # PostgreSQL connection pool with RLS
│   │   │   ├── schema.sql         # Base database schema definitions
│   │   │   ├── migrator.js        # Automated SQL schema migrator
│   │   │   └── migrations/        # 0001_baseline to 0011_repair SQL migrations
│   │   ├── middleware/            # Auth, Tenant isolation, Validation, Rate limiters
│   │   ├── routes/                # 31 route controllers (lens.js, leads.js, ai.js, core.js, etc.)
│   │   └── services/              # Business logic, scoring, telemetry, approvals, AI
│   └── test/integration/          # Integration test suites (test-lens-ecosystem-p9.js, etc.)
├── frontend/                      # React 19 + TypeScript + Vite 6.1 frontend
│   ├── src/
│   │   ├── App.tsx                # Master routing and entitlement guards
│   │   ├── layouts/               # AppShell, SpatialHubLayout, VaultLayout, StudioLayout
│   │   ├── features/lens/         # Dedicated Spatial Lens Application Module
│   │   │   ├── LensPage.tsx       # Primary Lens shell and view switcher
│   │   │   ├── components/        # LensHeader, LensSidebar, LensFilterBar, LeadDetailDrawer, AddLeadModal
│   │   │   ├── views/             # LensHomeView, LensLeadsView, LensAnalyticsView, LensVisualizationsView,
│   │   │   │                      # LensProjectsView, LensReportsView, LensSavedViewsView, LensDataExplorerView,
│   │   │   │                      # LensSettingsView, LensHelpView
│   │   │   ├── store/             # Zustand useLensStore.ts
│   │   │   ├── types/             # lensTypes.ts
│   │   │   └── data/              # defaultLensData.ts
│   │   ├── pages/                 # Standalone views (LeadManagement, SalesIntelligence, SupportDashboard, etc.)
│   │   ├── services/api.ts        # Comprehensive typed REST API client
│   │   └── design-system/         # Reusable buttons, cards, badges, inputs
└── docs/                          # Architectural specifications and phase reports
```

---

## 2. Current Feature Inventory & Status Matrix

| Module / Capability | Target Product Role | Current Repository Status | Evidence & Code Location |
| :--- | :--- | :--- | :--- |
| **Sales Command Center** | Primary sales overview with conversion rates & pipeline | **Partially Implemented** | `LensHomeView.tsx` shows KPI tiles (total leads, active leads, sessions, conversion rate) connected to live `/api/lens/overview`. Needs real deal pipeline value, won deals, and overdue follow-up counts. |
| **Lead Management** | End-to-end lead lifecycle, table, filters, drawer, CSV | **Implemented & Verified** | `LensLeadsView.tsx`, `LeadDetailDrawer.tsx`, `AddLeadModal.tsx` connect to `/api/leads` and `/api/lens/leads`. Filters and status updates work. Needs lead-to-deal/contact conversion action. |
| **Contacts & Accounts (CRM)** | Company accounts, contact persons, unified timeline | **Missing** | No dedicated Account or Contact models in database schema or UI views. Currently all company names are flat strings on `leads`. |
| **Deals & Sales Pipeline** | Opportunities, stages (Kanban & List), deal value | **Missing** | No deal pipeline views or `deals` table exist. Pipeline value currently computed on the fly from mock quote values. |
| **Activities & Tasks** | Task reminders, follow-ups, upcoming/overdue views | **Partially Implemented** | `lead_activities` table exists in PostgreSQL, but no forward-looking task/reminder scheduler or overdue task views exist in Lens. |
| **Customer Enquiries** | Lightweight ticket & enquiry desk linked to customers | **Partially Implemented** | `support_tickets` exists in `backend/src/routes/support.js` and `SupportDashboard.tsx`, but is not unified or exposed within the dedicated `features/lens` navigation. |
| **Analytics Studio & Customizer** | Custom tile builder, chart types, drag & drop, datasets | **Implemented & Verified** | `LensVisualizationsView.tsx`, `LensDataExplorerView.tsx`, and `LensReportsView.tsx` allow building custom Bar, Line, Pie, Funnel tiles and inspecting Vault datasets. |
| **Document Management** | Upload and access sales contracts, specs, brochures | **Partially Implemented** | General `files` table and upload endpoints exist (`/api/uploads`), but no dedicated Lens CRM document management interface exists. |
| **Permission-Aware AI Assistant** | Q&A, deal summaries, follow-up advice, opt-in gate | **Partially Implemented** | `/api/ai/assistant/chat` and `/api/ai/assist` exist in backend with role-based checks and opt-in gates, but no interactive floating assistant widget is embedded in Lens. |
| **Lightweight Automations** | Follow-up reminders, lead assignment, Flow handoff | **Partially Implemented** | `/api/lens/actions/trigger-flow` dispatches outbox events to Spatial Flow. Needs clean in-app toggle settings for notifications and reminders. |
| **Administration & RBAC** | Organization isolation, role-based views | **Implemented & Verified** | PostgreSQL RLS with `app.org_id` context (`requireTenant`, `requireAuth`) verified across all integration test suites. |

---

## 3. UI Template, Design System & Token Inventory

Spatial Lens strictly follows the established I3DION design system tokens:
- **Brand Identity Color**: Warm Amber / Gold
  - Primary Accent: `#F4B400`
  - Deep Amber (Text/Borders): `#D97706` / `text-amber-600`
  - Subtle Surface Tint: `bg-amber-500/10`, `bg-amber-50`, `border-amber-200/80`
  - Logo Asset: `/assets/logos/lens.png`
- **Neutral Palette**: Slate Scale (`bg-[#F8FAFC]`, `bg-white`, `border-slate-200`, `text-slate-900`, `text-slate-500`)
- **Semantic Accents**:
  - Success / Conversion / Won: Emerald (`bg-emerald-50`, `text-emerald-700`, `border-emerald-200`)
  - Warning / In Progress: Amber (`bg-amber-50`, `text-amber-800`, `border-amber-200`)
  - Info / Qualified / Hub: Blue / Indigo (`bg-blue-50`, `text-blue-700`, `border-blue-200`)
  - High Priority / Lost / AR: Rose / Red (`bg-rose-50`, `text-rose-700`, `border-rose-200`)
- **Typography & Radii**:
  - Headings: `font-black text-slate-900 tracking-tight`
  - Subtitles: `text-xs font-medium text-slate-500`
  - Cards & Panels: `rounded-2xl` and `rounded-3xl` with `border border-slate-200/90 shadow-2xs`
  - Badges & Buttons: `rounded-xl`, `active:scale-95` transition
- **Navigation Shell**:
  - Left Sidebar: `w-64 bg-white border-r border-slate-200` with icons from `lucide-react`.
  - Top Header: `h-16 bg-white border-b border-slate-200` with `AppLauncher`, global search, date range filter, notifications, and profile.

---

## 4. API & Data Model Map

### Existing Authoritative Tables (Reused)
1. `organizations`: Tenant root (`id`, `name`, `primary_color`, `ai_assist_enabled`).
2. `users`: System users and sales reps (`id`, `organization_id`, `name`, `email`, `role`).
3. `products`: Authoritative 3D products (`id`, `organization_id`, `name`, `category`, `specs`).
4. `leads`: Inbound prospect records (`id`, `organization_id`, `name`, `email`, `phone`, `company`, `status`, `score`, `priority`, `assigned_to`, `qr_attributed`).
5. `lead_activities`: Historical interaction logs (`id`, `organization_id`, `lead_id`, `user_id`, `activity_type`, `subject`, `body`).
6. `analytics_events`: High-throughput telemetry events (`id`, `organization_id`, `event_type`, `visitor_id`, `metadata`, `dedupe_key`).
7. `support_tickets`: Customer assistance requests (`id`, `organization_id`, `user_id`, `category`, `subject`, `message`, `status`, `priority`).
8. `automation_rules`: Simple event triggers (`id`, `organization_id`, `name`, `event_type`, `conditions`, `is_active`).

### New Models Required for CRM Core
To eliminate duplicate records and establish CRM as the operational core, the following schema extensions are required:
1. `crm_accounts`: Authoritative company/customer account records.
2. `crm_contacts`: Individual business people affiliated with accounts.
3. `crm_deals`: Sales pipeline opportunities with stage tracking, expected close dates, and values.
4. `crm_tasks`: Follow-ups and reminders with due dates, assignees, and completion states.
5. `crm_documents`: Sales operational documents (PDFs, spec sheets, quotes) linked to CRM entities.
6. `lens_dashboard_configs`: User-persisted dashboard layouts and widget configurations.

---

## 5. Baseline Verification & Test Status

- **Frontend Compilation**: `npm run build` in `frontend/` succeeded with exit code 0 (`✓ built in 36.87s`).
- **Backend Lens Integration Suite**: `node test/integration/test-lens-ecosystem-p9.js` executed with 8 passed, 0 failed.
- **Backend Lens Hardening Suite**: `node test/integration/test-hub-lens-hardening.js` executed with 15 passed, 0 failed.
- **PostgreSQL RLS & Tenant Isolation**: Verified active across all tenant queries.
