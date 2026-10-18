# Flow — Durable Automation & WhatsApp Integration Guide

**I3DION Flow** provides an enterprise-grade durable workflow orchestration engine that ensures no lead, quotation, or customer event is ever lost.

---

## 1. PostgreSQL Durable Queue Worker

- **No Inline HTTP Execution**: Webhook triggers write to a durable `flow_event_outbox` table.
- **FOR UPDATE SKIP LOCKED**: High-throughput queue worker polls jobs fairly across tenants without thread contention.
- **Per-Step Checkpointing**: If a server crashes during step 4 of a 6-step flow, the worker resumes execution from step 4 upon restart with zero duplicated actions.

---

## 2. Exponential Backoff & Dead Letter Queue (DLQ)

- Temporary network glitches or downstream API rate limits trigger automatic exponential retries (`attempts <= max_attempts`).
- Permanently failing jobs are routed to the Dead Letter Queue (DLQ) with captured stack traces and can be replayed with a single click after resolving the issue.

---

## 3. Official WhatsApp Business Platform Connector

- Send official Meta-approved quotation templates directly to customer phones upon RFQ submission.
- Supports variable interpolation (`{{1}}` for customer name, `{{2}}` for catalog title, `{{3}}` for total quote amount in INR).
- Local in-memory sandbox ledger available for development and staging testing.

---

## 4. SSRF & Security Guards

- All outbound webhook requests are validated against private, loopback, and link-local IP addresses (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`), preventing Server-Side Request Forgery attacks.
