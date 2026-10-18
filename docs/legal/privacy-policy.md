# I3DION Spatial — Privacy Policy

> **Effective Date:** October 18, 2026  
> **Last Updated:** October 18, 2026  
> **Applicability:** Global (Compliant with EU GDPR, California CCPA/CPRA, and India Digital Personal Data Protection Act 2023)

---

## 1. Introduction

I3DION Technologies Private Limited ("**I3DION**", "**we**", "**us**", or "**our**") operates the **I3DION Spatial** B2B spatial catalog, 3D digital twin, and automation platform (accessible via web applications, APIs, mobile PWAs, and embeddable players). We are committed to protecting the privacy, confidentiality, and security of our business customers, their team members, authorized dealers, and prospective buyers.

This Privacy Policy explains how we collect, process, store, disclose, and protect personal and operational data when you access or interact with our platform.

---

## 2. Roles: Data Controller vs. Data Processor

- **I3DION as Data Controller:** We act as a Data Controller for administrative account information, user login credentials, billing contacts, and technical telemetry collected to provide and secure our infrastructure.
- **I3DION as Data Processor:** When our enterprise customers upload customer lists, dealer contacts, CAD metadata, or receive inbound Request For Quote (RFQ) inquiries through our Catalog Player PWA or Flow automation, I3DION acts strictly as a **Data Processor** acting solely on the customer's instructions under our [Data Processing Addendum (DPA)](./dpa-template.md).

---

## 3. Categories of Data We Collect

### A. Account & Billing Information
- User name, work email address, hashed passwords (Argon2id / bcrypt), job title, and phone number.
- Organization billing details, company legal name, GSTIN / Tax ID, address, and payment transaction tokens (card numbers are processed securely by our PCI-DSS certified payment gateway Razorpay and never stored on our servers).

### B. 3D CAD, Catalog & Enterprise Data
- 3D models (`.glb`, `.gltf`, `.usdz`), CAD assemblies, product specifications, catalog layouts, and circuit logic graphs uploaded into Spatial Vault.
- User-defined schema records, price lists, customer tags, and custom relational tables.

### C. Analytics, Telemetry & Interaction Data (Lens)
- Spatial engagement telemetry: 3D model dwell time, camera rotation angles, variant selections, explode factor animations, and hotspot interaction clicks.
- Client technical attributes: IP address (privacy-safe subnet masked before analytical persistence), browser user-agent, operating system, and device screen dimensions.
- QR code campaign scans and dealer-attributed quote requests.

---

## 4. Strict Guarantees: Artificial Intelligence & Zero Training Policy

In accordance with our core architecture and Decision D-10:
- **Zero Training on Customer Data:** I3DION does **NOT** use customer 3D models, CAD assets, private database schemas, commercial pricing, or RFQ leads to train, fine-tune, or improve any public or shared foundation machine learning models.
- **Opt-in Only:** AI Assist features (such as automated product tagging or SEO summary generation) remain disabled by default until an organization administrator explicitly enables the `ai_assist_enabled` organization setting.
- **Human-in-the-Loop:** All AI Assist suggestions require human review and approval before becoming active in a catalog.

---

## 5. Purpose of Processing & Legal Basis (GDPR Art. 6)

| Purpose | Legal Basis |
|---|---|
| Provision of SaaS services, 3D rendering, and catalog publishing | Performance of Contract |
| Billing, invoice generation, and Indian GST tax compliance | Legal Obligation |
| Security monitoring, multi-tenant RLS isolation, and abuse prevention | Legitimate Interest |
| Marketing communications and AI Assist features | Explicit Consent (Opt-in) |

---

## 6. Data Retention & Destruction

- **Active Accounts:** Data is retained for the duration of the active subscription plus a standard 90-day grace period following contract termination.
- **Legal Holds & Retention Labels:** Records marked with retention labels in Spatial Vault (e.g., "Legal Hold", "Financial Records 7Y") are locked against permanent deletion in compliance with statutory audit obligations.
- **Deletion Requests:** Upon verified account termination or Data Subject Access Request (DSAR), all customer datasets, 3D assets, and backup snapshots are irreversibly purged within 30 days.

---

## 7. Security Safeguards

We implement defense-in-depth security measures certified to ISO 27001 / SOC 2 standards:
- **Tenant Isolation:** Hardware-level and database-level Row Level Security (RLS) enforcing strict tenant boundary isolation across all tables.
- **Encryption:** All data in transit is encrypted using TLS 1.3. All persistent data at rest (PostgreSQL database, object storage) is encrypted using AES-256.
- **Audit Trails:** Cryptographic hash-chained audit logging tracking all administrative, security, and data mutation events.
- **SSRF & Sanitization Guards:** Outbound webhooks are guarded against internal IP spoofing (SSRF); all formula inputs are sanitized against CSV/Excel injection.

---

## 8. International Data Transfers & Sub-Processors

We only partner with vetted sub-processors providing GDPR-compliant Standard Contractual Clauses (SCCs) and robust security guarantees. For a complete list of authorized sub-processors, refer to our [Sub-Processor Directory](./sub-processors.md).

---

## 9. Data Subject Rights

Under GDPR, CCPA, and India DPDP 2023, you have the right to:
- Access and inspect your personal data.
- Rectify inaccurate or incomplete data.
- Request erasure ("Right to be Forgotten").
- Restrict or object to processing.
- Request data portability in standard JSON or CSV format.
- Withdraw consent at any time without affecting prior lawful processing.

To exercise any of these rights, contact our Data Protection Officer at:  
**Email:** `privacy@i3dion.com`  
**Address:** I3DION Technologies Private Limited, Data Protection Office, Bangalore, India.
