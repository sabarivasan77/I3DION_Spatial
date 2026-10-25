# I3DION Spatial Lens — Product Specification

**Version**: 1.0  
**Status**: Approved Architecture  
**Product**: I3DION Spatial Lens  
**Target Roles**: VP of Sales, Sales Operations Managers, Technical Sales Engineers, Account Executives, Support Leads

---

## 1. Product Purpose & Architectural Scope

I3DION Spatial Lens is the unified sales command center, CRM, customer enquiry desk, and operational business intelligence application of the I3DION spatial ecosystem.

Spatial Lens bridges 3D product visualization and commercial sales execution:
- **Operational Core**: Shared CRM records for Accounts, Contacts, Leads, Deals, Tasks, and Enquiries.
- **Decision-Making Layer**: Real-time sales metrics, conversion funnels, and customizable analytics dashboards.
- **Productivity & Speed**: Document organization, permission-aware AI assistant, and lightweight reminder automations.

---

## 2. Critical Product Boundary: Spatial Lens vs. Spatial Flow

To maintain architectural integrity, clear product boundaries are enforced:

| Capability | In-Scope: I3DION Spatial Lens | Out-of-Scope: Handed Off to I3DION Spatial Flow |
| :--- | :--- | :--- |
| **Workflow Design** | Simple toggle switches, notification checkboxes, follow-up date pickers | Visual drag-and-drop node canvas, complex branch splitting, loop blocks |
| **Automation Execution** | In-app task creation on stage change, overdue reminder alerts | Durable queue orchestrator, checkpoint retry execution, custom HTTP webhooks |
| **Integrations** | Single-click "Use in Flow" dispatch to `flow_event_outbox` | Enterprise ERP connectors, Salesforce/HubSpot bi-directional sync, custom OAuth bridges |
| **Notifications** | Internal dashboard notification badges, rep assignment alerts | Multi-channel SMS/Slack/Teams routing pipelines |

---

## 3. User Roles & Permission Model

Spatial Lens operates under strict Role-Based Access Control (RBAC):
1. **Admin / Owner**: Full access to all CRM records, company target configuration, user assignment, analytics studio, and AI assist settings.
2. **Manager**: Access to all team records, deal approvals, team performance metrics, and dashboard publishing.
3. **Sales User (Rep)**: Access to assigned leads, contacts, deals, tasks, customer enquiries, and personal saved views.
4. **Viewer**: Read-only access to published dashboards and reports.

---

## 4. Main Workflows & Acceptance Criteria

### Workflow 1: Lead Capture & Conversion
1. Inbound leads arrive via Spatial Hub 3D product showcases or manual sales entry.
2. Lead is scored automatically based on 3D dwell time, hotspot clicks, and AR sessions.
3. Rep qualifies lead and clicks **Convert Lead**:
   - Creates an authoritative **Account** (company).
   - Creates a linked **Contact** (person).
   - Optionally creates a linked **Deal** in the pipeline.
   - Preserves historical activity timeline without duplicating data.

### Workflow 2: Sales Pipeline & Deal Progression
1. Deals are tracked visually on a Kanban board or sortable Table across stages:
   - `Discovery` (20%) → `Qualified` (40%) → `Proposal` (60%) → `Negotiation` (80%) → `Won` (100%) or `Lost` (0%).
2. Dragging a deal to `Won` prompts for final close value and automatically records won revenue.
3. Dragging a deal to `Lost` prompts for a structured loss reason for BI analysis.
4. Total open pipeline value and win rates update in real time on the Command Center.

### Workflow 3: Tasks, Follow-ups & Reminders
1. Sales reps create follow-up tasks linked to leads, contacts, or deals.
2. Tasks include due dates, priority, status (`Pending` / `Completed`), and descriptions.
3. The Command Center displays **Follow-ups Due Today** and **Overdue Follow-ups** with 1-click completion.

### Workflow 4: Customer Enquiries & Service Desk
1. Technical product enquiries and RFQs are consolidated in a lightweight desk.
2. Reps view customer questions, status (`Open`, `In Progress`, `Resolved`), assignees, and internal notes.
3. Enquiries attach to the customer's unified timeline.

### Workflow 5: Analytics Studio & Dashboard Customization
1. Users configure customized BI dashboard tiles selecting metric (Leads, Deals, Revenue, AR sessions), chart type (Bar, Line, Area, Donut, Funnel, KPI), and group-by dimensions.
2. Layouts and filter presets are saved to the user's profile and persisted to the database.

### Workflow 6: Permission-Aware AI Assistant
1. A floating AI assistant in Lens answers operational questions:
   - *"Which leads need follow-up today?"*
   - *"Summarize the current deal pipeline and expected revenue."*
   - *"Draft a follow-up response for this customer."*
2. Adheres to organization opt-in policy and only queries authorized records.
