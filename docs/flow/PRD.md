# I3DION Flow — Product Requirements Document (PRD) v1.0
**Product Name:** I3DION Flow  
**Category:** Visual Low-Code Workflow Automation Platform  
**Status:** Approved for Phase 1 (Specification) • **Author:** Antigravity  

---

## 1. Problem Statement & Market Opportunity
Industrial manufacturers, distributors, and machinery brands maintain complex 3D product representations and technical catalogs in I3DION Spatial Vault and Omni Studio. When prospective buyers explore 3D models on I3DION Spatial Hub or scan QR codes on physical machinery, they generate rich, intent-dense interactions (e.g. exploded view dwelling, tolerance inspection, specification sheet downloads, RFQ submissions).

Historically, turning these spatial interactions into sales conversions required manual staff follow-up or custom developer scripting. 

**I3DION Flow** solves this by providing a first-class, visual, low-code automation platform (inspired by Microsoft Power Automate, tailored for 3D spatial commerce). Non-technical sales engineers, operators, and marketing teams can visually compose, test, publish, and monitor autonomous workflows that:
- Trigger on spatial viewer events, inbound webhooks, schedules, or manual tests.
- Evaluate conditional branches and business rules without writing code.
- Auto-generate personalized CAD quotation emails and technical PDF spec sheets.
- Score leads and assign them to territory account executives.
- Dispatch transactional outbox events to external CRMs and ERP systems.

---

## 2. Product Objectives & Success Metrics
1. **Visual Authoring Autonomy:** 100% of standard B2B quotation, lead routing, and alert workflows can be created and tested via visual drag-and-drop without writing backend code.
2. **Deterministic & Observable Execution:** Every workflow execution step is persisted to PostgreSQL `flow_runs` with inputs, outputs, duration (ms), and error records.
3. **Execution Latency:** Trigger to first step execution p95 < 2.5s for interactive runs.
4. **Reliability & Idempotency:** Zero duplicate email sends or CRM records on retries.
5. **Multi-Tenant Isolation:** 100% server-side tenant boundary enforcement via `withTenant(organizationId)`.

---

## 3. Scope & Non-Goals

### 3.1 In-Scope (MVP - Phases 1 to 4)
- Visual drag-and-drop node-and-wire canvas (pan, zoom, minimap, snap-to-grid).
- Category node catalog: Triggers, Logic, Data, Communication, Ecosystem, Integrations.
- Typed input/output handles with connection validation and cycle detection.
- Contextual dynamic variable picker for mapping prior step outputs into downstream parameters.
- Deterministic Node.js backend execution engine with checkpointing.
- Interactive test runner with live telemetry streaming and millisecond timers.
- 3 Pre-built Industrial Starter Recipes.

### 3.2 Out-of-Scope (Non-Goals for MVP)
- **Arbitrary JavaScript/Python execution:** No user-supplied code execution; only sandboxed, typed action registry handlers.
- **1,000+ Consumer Connectors:** Focus on deep I3DION ecosystem integration (Vault, Studio, Engine, Hub, Lens), Nodemailer SMTP, and webhook/REST gateways.
- **Real-Time Multi-User Collaborative Canvas:** Single-user locking per flow draft; co-authoring is deferred to post-pilot roadmap.

---

## 4. User Personas & Core Journeys

### 4.1 Industrial Sales Engineer (Persona: "Ramesh")
- **Goal:** Immediately respond to incoming 3D valve inquiries with a customized quotation and engineering drawing spec sheet.
- **Journey:**
  1. Opens I3DION Flow via the App Launcher drawer.
  2. Selects the *Customer RFQ & Auto-Mail Proposal* recipe.
  3. Configures the email template merge tags (e.g. `{{trigger.contact.name}}`, `{{trigger.productName}}`).
  4. Clicks **"Test Run Automation"** with sample RFQ payload.
  5. Reviews the step execution timeline (extract CAD metadata $\to$ render proposal $\to$ dispatch email) and activates the flow.

### 4.2 Marketing Operations Lead (Persona: "Ananya")
- **Goal:** Identify high-intent prospects who spend over 45 seconds interacting with an interactive 3D assembly in Spatial Hub.
- **Journey:**
  1. Creates a blank flow with trigger: `spatial.model.viewed`.
  2. Drags a **Condition (If/Else)** node onto the canvas: `dwellDurationSeconds > 45`.
  3. Connects the `True` branch to **Assign Lead & Set Score** (+25 lead score, assigned to regional sales rep).
  4. Connects the `False` branch to **Terminate Flow**.
  5. Publishes the flow with zero deployment downtime.

---

## 5. Non-Functional Requirements (NFRs)
- **Performance:** Canvas render speed $\ge$ 60 FPS with up to 100 nodes.
- **Security:** Strict SSRF blocking on outbound webhook requests. Multi-tenant RLS isolation. Credential encryption in server vault.
- **Accessibility:** Full keyboard navigation support (Space-pan, Tab-port focus, Enter-connect, Delete-remove).
- **Auditability:** Every flow creation, publication, edit, and execution run is logged to PostgreSQL `audit_logs`.
