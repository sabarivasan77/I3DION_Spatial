# I3DION Flow Documentation
**Product:** I3DION Flow  
**Category:** Visual Low-Code Workflow Automation Platform (Power Automate-style)  
**Status:** Phase 0 Completed (Awaiting Owner Approval Gate)

---

## Documentation Index
1. [Phase 0 Audit & Architecture Decisions](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/docs/flow/PHASE_0_AUDIT_AND_DECISIONS.md) — Ground-truth audit, feature matrix, conflict register, threat model, and owner sign-off checklist.
2. [Product Boundaries](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/docs/flow/PRODUCT_BOUNDARIES.md) — Exact ownership boundaries between Flow, Hub, Vault, Omni Studio, Engine, and Lens.

---

## Quick Reference
- **Frontend Route:** `/flows` ([FlowPage.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/pages/flow/FlowPage.tsx))
- **Launcher Entry:** App Launcher Slide-Over Drawer ([AppLauncher.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/components/AppLauncher.tsx))
- **License Key:** `'flow'` ([licenseContracts.ts](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/contracts/licenseContracts.ts))
- **Database Tables:** `flows`, `flow_runs`, `flow_event_outbox`, `automation_rules` ([pool.js](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/backend/src/db/pool.js#L582))
