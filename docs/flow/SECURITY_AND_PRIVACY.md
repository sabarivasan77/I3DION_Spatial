# I3DION Flow — Security, Privacy & Access Control Specification v1.0
**Document Version:** 1.0 • **Author:** Antigravity (Lead Security Engineer)

---

## 1. Multi-Tenant Isolation
Flow adheres strictly to the Security-First Master Prompt:
- **Default Deny:** Anonymous requests are rejected by `requireAuth`.
- **Tenant Scope:** Every query uses `withTenant(req.user.organization_id)` ensuring `WHERE organization_id = $1`.
- **No Client Tenant Injection:** `organization_id` is extracted strictly from the validated JWT session, never from `req.body` or query parameters.

---

## 2. Server-Side Request Forgery (SSRF) Defense
Outbound HTTP webhooks are guarded by a strict URL validation policy:
1. Destination protocol must be strictly `https://`.
2. Private IP address ranges (RFC1918) are blocked:
   - `10.0.0.0/8`
   - `172.16.0.0/12`
   - `192.168.0.0/16`
3. Loopback interfaces are blocked: `127.0.0.0/8`, `::1`.
4. Link-local and cloud metadata services are blocked: `169.254.169.254`, `fd00::/8`.
5. Max payload size: 1 MB. Max timeout: 10,000ms.

---

## 3. Secret Management & PII Redaction
- Credentials (SMTP passwords, webhook signing secrets, API tokens) are **never** stored in the `flows.steps` JSON column.
- Credentials reside in `integrations.secrets_ref` using AES-256-GCM envelope encryption.
- Execution logs in `flow_runs.step_results` automatically mask keys matching `/password|token|secret|key|authorization/i`.
- Personal identifiable information (emails, phone numbers) are masked in telemetry and audit exports unless viewed by authorized Org Admins.

---

## 4. Anti-Abuse & Rate Limits
- Workflow triggers are rate-limited to 60 executions per minute per organization.
- Loop depth guard: Workflows reject any graph hop depth $>5$ to eliminate infinite recursion.
- Email suppression: If a customer unsubscribes or an address bounces, subsequent flow attempts to email that address are blocked and logged as `skipped_suppressed`.
