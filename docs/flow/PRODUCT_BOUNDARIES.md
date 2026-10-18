# I3DION Flow — Product Ownership Boundaries
**Document Version:** 1.0 • **Status:** PROPOSED (Awaiting Decision D-F01 Approval)

---

## 1. Ecosystem Responsibilities & Non-Duplication Rules

Flow coordinates across systems through documented, authorized contracts. It **must not** duplicate another product's canonical data or create a competing system of record.

| Product | Owns (Canonical System of Record) | Does NOT Own | Flow Interaction Contract |
|---|---|---|---|
| **I3DION Flow** | Workflow definitions, immutable versions, triggers, execution DAGs, step runs, connection references, schedules, and approvals. | Raw product data, 3D assets, customer catalogs, raw session metrics. | Orchestrates events from Hub/Engine and triggers actions in Vault/Studio/Email. |
| **I3DION Spatial Vault** | 3D models (GLB, USDZ, STEP), product catalogs, BOM records, CAD tolerances, and media files. | Visual workflow execution, email delivery. | Flow reads product specs and CAD dimensions via read-only contracts. |
| **I3DION Omni Studio** | Multi-screen catalog compositions, layout templates, and branded PDF generation. | Background automated retry scheduling. | Flow invokes catalog build or PDF generation jobs. |
| **I3DION Spatial Hub** | Public showcases, QR access points, and visitor engagement delivery. | Business workflow logic, internal staff alerts. | Hub emits `lead_form_submitted` and `3d_interaction` events to Flow. |
| **I3DION Spatial Engine** | Interactive 3D runtime, part variants, animation tracks, and Omni Circuits. | External CRM sync, email distribution. | Engine emits circuit events when users interact with specific parts. |
| **I3DION Spatial Lens** | Analytics telemetry, BI aggregation, and metric dashboards. | Flow definitions and execution states. | Flow emits run telemetry to Lens; Lens alerts trigger Flow automations. |
| **Identity / Core** | Users, organizations, memberships, JWT sessions, and licensing. | Flow step graphs. | Flow enforces `withTenant(organizationId)` on all operations. |
