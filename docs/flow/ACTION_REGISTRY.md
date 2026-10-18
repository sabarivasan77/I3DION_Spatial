# I3DION Flow — Action Registry Specification v1.0
**Document Version:** 1.0 • **Implementation:** [packages/contracts/src/flow.ts:L160-L310](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/packages/contracts/src/flow.ts#L160)

---

## 1. Registry Architecture
Every executable node in I3DION Flow must be registered in the canonical `ACTION_REGISTRY`. The registry guarantees:
1. **Stable Node Type ID:** Unchanging identifier (e.g. `send_email`, `condition`).
2. **Typed Input / Output Ports:** Explicit control flow (`exec`) and data ports.
3. **Zod Parameter Validation:** Validates form configurations in the UI and server execution payloads.
4. **Side-Effect & Idempotency Classification:** Prevents accidental duplicate sends during retries.
5. **Required Permission:** Least-privilege role check before execution.

---

## 2. Core 9 MVP Action Definitions

### 2.1 Logic Category
#### 1. `condition`
- **Name:** Condition (If / Else)
- **Description:** Evaluates a boolean expression and routes execution to either `true` or `false` branch.
- **Ports:**
  - In: `in` (exec)
  - Out: `true` (exec), `false` (exec)
- **Parameters:**
  - `field`: string (dynamic reference or variable)
  - `operator`: `equals` | `not_equals` | `greater_than` | `less_than` | `contains` | `is_empty`
  - `value`: unknown
- **Side-Effect:** `false` | **Idempotent:** `true`

#### 2. `delay`
- **Name:** Delay
- **Description:** Pauses flow execution for a set duration in seconds.
- **Ports:** In: `in` (exec) | Out: `out` (exec)
- **Parameters:** `durationSeconds`: number (1..86,400)
- **Side-Effect:** `false` | **Idempotent:** `true`

#### 3. `terminate`
- **Name:** Terminate Flow
- **Description:** Immediately stops execution with a terminal status.
- **Ports:** In: `in` (exec) | Out: none
- **Parameters:**
  - `status`: `succeeded` | `failed` | `canceled`
  - `reason`: string optional
- **Side-Effect:** `false` | **Idempotent:** `true`

---

### 2.2 Data Category
#### 4. `compose`
- **Name:** Compose Message
- **Description:** Renders a templated string by resolving dynamic chips and expressions.
- **Ports:** In: `in` (exec) | Out: `out` (exec)
- **Parameters:** `template`: string
- **Side-Effect:** `false` | **Idempotent:** `true`

#### 5. `set_variable`
- **Name:** Set Variable
- **Description:** Assigns or updates the value of a declared workflow variable.
- **Ports:** In: `in` (exec) | Out: `out` (exec)
- **Parameters:** `variableName`: string, `value`: unknown
- **Side-Effect:** `false` | **Idempotent:** `true`

---

### 2.3 Communication Category
#### 6. `send_email`
- **Name:** Send Permitted Email
- **Description:** Dispatches a branded HTML email via Nodemailer SMTP with consent check.
- **Ports:** In: `in` (exec) | Out: `out` (exec)
- **Parameters:**
  - `recipientEmail`: string
  - `subject`: string
  - `templateKey`: string optional
  - `body`: string
- **Side-Effect:** `true` | **Idempotent:** `false`
- **Required Permission:** `flow.send_email`

#### 7. `send_notification`
- **Name:** Send In-App Notification
- **Description:** Creates an in-app alert in the recipient team inbox.
- **Ports:** In: `in` (exec) | Out: `out` (exec)
- **Parameters:** `title`: string, `body`: string, `actionUrl`: string optional
- **Side-Effect:** `true` | **Idempotent:** `true`

---

### 2.4 Ecosystem & Integrations Category
#### 8. `auto_assign_lead`
- **Name:** Assign Lead & Set Score
- **Description:** Assigns a canonical lead in the PostgreSQL `leads` table and updates status.
- **Ports:** In: `in` (exec) | Out: `out` (exec)
- **Parameters:**
  - `leadId`: string
  - `assignedToUserId`: string optional
  - `status`: `NEW` | `CONTACTED` | `QUALIFIED` | `OPPORTUNITY` | `WON` | `LOST`
  - `scoreDelta`: number optional
- **Side-Effect:** `true` | **Idempotent:** `true`
- **Required Permission:** `leads.manage`

#### 9. `webhook_dispatch`
- **Name:** Dispatch to Outbox / Webhook
- **Description:** Enqueues an event in `flow_event_outbox` for outbound webhook delivery.
- **Ports:** In: `in` (exec) | Out: `out` (exec)
- **Parameters:** `eventType`: string, `destinationUrl`: string optional, `payload`: record
- **Side-Effect:** `true` | **Idempotent:** `true`
