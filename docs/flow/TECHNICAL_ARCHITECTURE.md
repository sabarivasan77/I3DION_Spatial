# I3DION Flow — Technical Architecture Specification v1.0
**Document Version:** 1.0 • **Author:** Antigravity (Platform Architect)

---

## 1. System Overview & Component Diagram

```mermaid
flowchart TD
  subgraph BROWSER["Client (React 19 + Vite)"]
    CANVAS[Flow Designer Canvas<br/>@xyflow/react]
    PALETTE[Action Palette]
    INSPECTOR[Property Inspector & Variable Picker]
    TESTER[Interactive Test Runner Console]
  end

  subgraph API_GATEWAY["API & Ingestion Gateway (Express)"]
    AUTH_GUARD[JWT Auth & RLS Guard]
    FLOW_ROUTES["/api/flows (CRUD, Trigger, Runs)"]
    EVENT_ROUTES["/api/flows/events (Outbox Enqueue)"]
    RATE_LIMITER[Route Rate Limiter & Payload Guard]
  end

  subgraph EXECUTION_CORE["Execution Engine (Node.js)"]
    VALIDATOR[DAG Validator & Topological Sorter]
    EXECUTOR[Step Checkpoint Runner]
    ACTION_HANDLERS[Action Registry Handlers]
    OUTBOX_DISPATCHER[Outbox Dispatcher Service]
  end

  subgraph PERSISTENCE["PostgreSQL Database (RLS Enforced)"]
    T_FLOWS[(flows)]
    T_RUNS[(flow_runs)]
    T_OUTBOX[(flow_event_outbox)]
    T_LEADS[(leads)]
    T_NOTIFS[(notifications)]
    T_AUDIT[(audit_logs)]
  end

  subgraph EXTERNAL["Downstream Ecosystem & Integrations"]
    SMTP[Nodemailer SMTP / Dev Fallback]
    CRM[External Webhooks]
    VAULT_SERVICE[Spatial Vault API]
    STUDIO_SERVICE[Omni Studio PDF Spec Generator]
  end

  CANVAS -->|Save Definition| FLOW_ROUTES
  TESTER -->|Trigger Test Run| FLOW_ROUTES
  FLOW_ROUTES --> AUTH_GUARD
  AUTH_GUARD --> EXECUTOR

  EXECUTOR --> VALIDATOR
  EXECUTOR --> ACTION_HANDLERS
  EXECUTOR -->|Checkpoint Step Results| T_RUNS
  FLOW_ROUTES -->|Read / Write| T_FLOWS

  ACTION_HANDLERS -->|Send Email| SMTP
  ACTION_HANDLERS -->|Assign Lead| T_LEADS
  ACTION_HANDLERS -->|Notify Staff| T_NOTIFS
  ACTION_HANDLERS -->|Enqueue Webhook| T_OUTBOX
  ACTION_HANDLERS -->|Generate Spec Sheet| STUDIO_SERVICE

  T_OUTBOX --> OUTBOX_DISPATCHER
  OUTBOX_DISPATCHER --> CRM
```

---

## 2. Execution Engine Lifecycle & State Machine

### 2.1 Run Lifecycle Transitions
```
                +-------------+
                |   PENDING   |
                +------+------+
                       |
                       v
                +-------------+
        +------>|   RUNNING   |<-------+
        |       +------+------+        |
        |              |               |
(Delay / Approval)     |       (Retry on failure)
        |              v               |
        |       +-------------+        |
        +-------| STEP RUNNER |--------+
                +------+------+
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
+-------------+ +-------------+ +-------------+
|  SUCCEEDED  | |   FAILED    | |  TIMED_OUT  |
+-------------+ +-------------+ +-------------+
```

### 2.2 Step Checkpointing Contract
1. When execution begins, a new row is created in `flow_runs` with `status: 'running'`.
2. Before executing each step, the step state is marked `running`.
3. After the step finishes, its duration (ms), outputs, and status are committed to PostgreSQL inside the tenant's transaction.
4. If a worker process crashes, the run can be resumed from the last completed checkpoint without re-running prior non-idempotent side effects.
