# I3DION Spatial — Sub-Processor Directory

> **Last Updated:** October 18, 2026  
> **Applicability:** All production tiers of I3DION Spatial

---

## 1. Overview

To provide scalable, reliable, and secure cloud infrastructure, I3DION Technologies Private Limited engages third-party sub-processors. Each sub-processor undergoes rigorous security and privacy due diligence, agrees to standard contractual clauses (SCCs) under GDPR/DPDP, and implements SOC 2 / ISO 27001 certified security standards.

---

## 2. Authorized Infrastructure & Platform Sub-Processors

| Sub-Processor | Corporate Entity | Processing Purpose | Data Categories | Hosting Jurisdiction | Transfer Safeguards |
|---|---|---|---|---|---|
| **Neon / PostgreSQL** | Neon, Inc. | Serverless relational database hosting & RLS isolation | Encrypted application data, user credentials, audit chains, flow states | AWS US-East / EU-Central / AP-South | Standard Contractual Clauses (SCCs), DPA |
| **Amazon Web Services (AWS)** | Amazon Web Services, Inc. | Object storage (S3), compute, and encrypted backup snapshots | Encrypted 3D CAD models (`.glb`), PDF exports, and database backups | India (ap-south-1) / Global Edge | AWS GDPR Data Processing Addendum, ISO 27001 |
| **Cloudflare** | Cloudflare, Inc. | Edge CDN, DDoS mitigation, Web Application Firewall (WAF), DNS | IP addresses, request headers, cached public assets | Global Edge (Anycast Network) | Cloudflare EU SCCs, SOC 2 Type II |
| **Razorpay** | Razorpay Software Private Limited | Payment gateway for subscription billing & add-on packs | Billing address, GSTIN, payment tokens, transaction IDs | India | PCI-DSS Level 1, RBI Compliant Payment Aggregator |
| **Meta Cloud API** | Meta Platforms, Inc. | WhatsApp Business Platform connector for Flow alerts | Customer phone numbers, quotation notification templates | US / EU / Global Points of Presence | Meta Business Platform Terms, Data Protection Addendum |
| **Brevo / SendGrid** | Sendinblue SAS / Twilio, Inc. | Transactional email delivery (password resets, team invites, invoice receipts) | Recipient name, work email address, invoice summary | EU / US | Standard Contractual Clauses (SCCs), SOC 2 |

---

## 3. Sub-Processor Change Notification Protocol

Customer administrators subscribed to security notifications receive at least **14 calendar days' advance notice** before any new sub-processor is engaged to process Customer Personal Data. Customers may object to any new sub-processor on reasonable data protection grounds within the notice window.
