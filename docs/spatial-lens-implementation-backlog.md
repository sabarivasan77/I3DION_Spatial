# I3DION Spatial Lens — Implementation Backlog

**Strategy**: Iterative, verified engineering increments from P0 foundation to P2 intelligence.

---

## Priority Backlog Matrix

| Task ID | Priority | Module | Description | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LENS-DB-01** | **P0** | Database | Create migration `0012_spatial_lens_crm_foundation.sql` defining `crm_accounts`, `crm_contacts`, `crm_deals`, `crm_tasks`, `crm_documents`, and `lens_dashboard_configs` with RLS policies and indexes. | None | **Ready** |
| **LENS-API-01** | **P0** | Backend API | Implement `/api/crm` endpoints for Accounts, Contacts, Deals, Tasks, Enquiries, and Documents with tenant isolation and validation. | LENS-DB-01 | **Ready** |
| **LENS-API-02** | **P1** | Backend API | Extend `/api/lens/overview` to calculate live pipeline value, won revenue, deals conversion, follow-ups due, and open enquiries from real database records. | LENS-API-01 | **Ready** |
| **LENS-UI-01** | **P1** | Frontend Shell | Update `LensSidebar.tsx` and `LensHeader.tsx` to include dedicated navigation for: Pipeline (Deals), CRM (Accounts & Contacts), Tasks & Follow-ups, Enquiries, Documents, and Automations. | None | **Ready** |
| **LENS-UI-02** | **P1** | Frontend Views | Enhance `LensHomeView.tsx` (Command Center) with live sales target tracking, deal pipeline breakdown, and overdue task alerts. | LENS-API-02 | **Ready** |
| **LENS-UI-03** | **P1** | Frontend Views | Implement `LensDealsView.tsx` with interactive Kanban board (Drag & drop stage progression) and searchable Table view. | LENS-API-01 | **Ready** |
| **LENS-UI-04** | **P1** | Frontend Views | Implement `LensCrmView.tsx` managing Accounts & Contacts with unified activity timeline and lead conversion modal. | LENS-API-01 | **Ready** |
| **LENS-UI-05** | **P1** | Frontend Views | Implement `LensTasksView.tsx` for sales follow-up task tracking, overdue reminders, and 1-click status completion. | LENS-API-01 | **Ready** |
| **LENS-UI-06** | **P1** | Frontend Views | Implement `LensEnquiriesView.tsx` for lightweight customer support ticket handling, priority escalation, and resolution. | LENS-API-01 | **Ready** |
| **LENS-UI-07** | **P2** | Frontend Views | Implement `LensDocumentsView.tsx` for sales document repository and contract attachments linked to accounts and deals. | LENS-API-01 | **Ready** |
| **LENS-UI-08** | **P2** | Frontend AI | Embed permission-aware `LensAiAssistantModal.tsx` directly into the Spatial Lens header for instant sales Q&A and follow-up generation. | LENS-API-01 | **Ready** |
| **LENS-UI-09** | **P2** | Frontend Automations | Complete `LensAutomationsView.tsx` for lightweight reminder toggles, alert preferences, and one-click dispatch to Spatial Flow. | LENS-API-01 | **Ready** |
| **LENS-QA-01** | **P0** | Verification | Create integration test `test-lens-crm-foundation.js` verifying end-to-end CRUD, lead conversion, deal stages, and tenant isolation. | All | **Ready** |
| **LENS-QA-02** | **P0** | Verification | Run full frontend Vite build and verify zero regressions. | All | **Ready** |
