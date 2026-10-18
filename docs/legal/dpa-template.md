# I3DION Spatial — Data Processing Addendum (DPA)

> **Standard:** European Union General Data Protection Regulation (GDPR Art. 28) & India DPDP Act 2023  
> **Effective Date:** October 18, 2026  
> **Parties:** I3DION Technologies Private Limited ("Data Processor") and Customer Organization ("Data Controller")

---

## 1. Scope & Applicability

This Data Processing Addendum ("**DPA**") supplements the [Master Terms of Service](./terms-of-service.md) between I3DION and Customer. It governs the processing of Personal Data in connection with Customer's use of the I3DION Spatial platform.

---

## 2. Processing Specifications

- **Subject Matter:** Provision of spatial catalog authoring, 3D asset hosting, RFQ lead capturing, and automated sales notifications.
- **Duration:** The term of the Master Terms of Service plus statutory post-termination retention periods.
- **Nature and Purpose:** Ingesting 3D CAD assets, rendering interactive spatial experiences, collecting inbound customer quotes, and dispatching durable automation tasks.
- **Data Subject Categories:** Customer employees, authorized dealers/distributors, and prospective end-customer buyers submitting quote inquiries.
- **Personal Data Categories:** Names, business email addresses, telephone numbers, company designations, quotation cart items, and masked analytical telemetry.

---

## 3. Processor Obligations

1. **Instructions:** Processor shall process Personal Data solely on documented instructions from Controller, including with respect to international data transfers.
2. **Confidentiality:** Processor ensures that all personnel authorized to process Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.
3. **Security Measures (TOMs):** Processor implements appropriate Technical and Organizational Measures to ensure a level of security appropriate to the risk, including:
   - Logical multi-tenant separation using PostgreSQL Row Level Security (RLS).
   - AES-256 encryption at rest for all database tables and uploaded 3D assets.
   - TLS 1.3 encryption in transit for all web, API, and PWA network traffic.
   - Cryptographic hash-chained audit trails (`audit_logs`) resistant to database tampering.
   - Constant-time HMAC authentication guards and automated SSRF prevention filters.
4. **Sub-Processors:** Controller grants general authorization for Processor to engage sub-processors listed in the [Sub-Processor Directory](./sub-processors.md). Processor shall notify Controller of any intended changes at least 14 days in advance.
5. **Data Subject Rights Assistance:** Processor provides technical features (data export APIs, schema record deletion, tenant isolation) enabling Controller to fulfill DSAR requests.
6. **Breach Notification:** In the event of a confirmed Personal Data Breach, Processor shall notify Controller without undue delay and, in any event, within **72 hours** of becoming aware of the breach.
7. **Deletion and Return:** Upon termination of services, Processor shall delete or return all Personal Data to Controller within 30 days, unless statutory law mandates continued retention.
8. **Audit Rights:** Processor shall make available to Controller information necessary to demonstrate compliance with this DPA and allow for reasonable security audits.
