# I3DION Flow — Verification & Test Plan v1.0
**Document Version:** 1.0 • **Implementation:** Automated Test Suites in `backend/` and `frontend/tests/`

---

## 1. Test Levels & Strategy
I3DION Flow employs a 4-tier test strategy to prevent regressions:

1. **Unit & Contract Tests:** Validates Zod schemas, DAG validation, topological ordering, and Kahn cycle detection ([test-flow-contracts.js](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/backend/test-flow-contracts.js)).
2. **Backend Engine & Multi-Tenant Tests:** Validates step checkpointing, transactional outbox writes, and multi-tenant isolation.
3. **Frontend Component & Designer Tests:** Tests canvas drag-and-drop, port wiring, variable picker, and inspector state.
4. **End-to-End User Journey Tests:** Playwright suite simulating a user creating an automation flow, triggering a test run, and inspecting the execution timeline.

---

## 2. Test Cases Matrix

| Test ID | Category | Target | Verification Criteria | Status |
|---|---|---|---|---|
| **FLOW-SCHEMA-01** | Contract | `FlowDefinitionSchema` | Valid JSON definition parses cleanly with nodes and edges. | **PASS** |
| **FLOW-SCHEMA-02** | Contract | `FlowDefinitionSchema` | Rejects missing required fields and invalid UUIDs. | **PASS** |
| **FLOW-DAG-01** | Algorithm | `validateFlowDAG` | Kahn's algorithm validates acyclic DAGs with 0 errors. | **PASS** |
| **FLOW-DAG-02** | Algorithm | `validateFlowDAG` | Detects and traps cyclic graph connections (e.g., A $\to$ B $\to$ A). | **PASS** |
| **FLOW-DAG-03** | Algorithm | `validateFlowDAG` | Flags dangling edges pointing to non-existent nodes. | **PASS** |
| **FLOW-REGISTRY-01**| Contract | `ACTION_REGISTRY` | Verifies Zod schemas for all 9 MVP action types. | **PASS** |
| **FLOW-ENGINE-01** | Engine | `executeFlowRun` | Executes step pipeline and checkpoints results in `flow_runs`. | Phase 2 |
| **FLOW-ENGINE-02** | Multi-Tenant | `flows` API | Org B cannot read, list, or execute Org A flows (HTTP 404/403). | Phase 2 |
| **FLOW-OUTBOX-01** | Integration | `flow_event_outbox` | Enqueues transactional outbox records atomically with flow run. | Phase 2 |
| **FLOW-UI-01** | E2E | Flow Designer | Drags node from palette, connects handles, and saves flow. | Phase 3 |
