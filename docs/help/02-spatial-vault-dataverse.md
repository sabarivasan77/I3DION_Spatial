# Spatial Vault — Dataverse & Document Library Guide

**Spatial Vault** combines high-performance 3D asset document management with a flexible, typed relational dataverse engine.

---

## 1. Document Library Features

- **Folder Hierarchy**: Organize models, technical specs, brochures, and texture maps into nested folder trees (`/Equipment/Pumps/Centrifugal/`).
- **Cryptographic Deduplication**: Uploaded assets calculate SHA-256 digests. Uploading an identical file returns the existing asset instantly with zero wasted storage.
- **Retention Labels & Legal Holds**: Protect critical compliance documents from deletion by applying retention labels ("Legal Hold", "Tax Audit 7Y").
- **Asset Usage Tracking**: Inspect which catalogs, experiences, or circuits reference an asset before moving or archiving it.

---

## 2. Relational Dataverse Engine

Spatial Vault supports 16 Dataverse column types:
1. `text` — Standard string
2. `number` — Integer or decimal
3. `currency` — Monetary amounts with currency codes (INR, USD, EUR)
4. `boolean` — True / False flags
5. `date` — Calendar dates
6. `datetime` — Timestamp with time zone
7. `choice` — Single-select enumeration
8. `multi_choice` — Multiple-select array
9. `lookup` — Foreign key relationship to another collection
10. `file` — Direct reference to a Vault asset
11. `json` — Structured JSON payload
12. `formula` — Dynamic computed column (`cost_inr * 1.18`)
13. `email` — Validated email address
14. `phone` — E.164 phone number
15. `url` — Validated web address
16. `rating` — Numerical rating scale (1-5 stars)

---

## 3. Relational Lookups & Referential Integrity

- Define one-to-many relationships between collections (e.g. `Dealers` $\to$ `Quotes`, or `Categories` $\to$ `Products`).
- Deleting a parent collection or record that is referenced by child records is strictly blocked with `HTTP 409 Conflict`.

---

## 4. Bulk CSV/XLSX Import & Sanitization

- Import thousands of rows in seconds with high-throughput chunked upsert.
- **Formula Injection Guard**: Any cell starting with `=`, `+`, `-`, or `@` is automatically sanitized with a leading apostrophe (`'`) to protect spreadsheet users against CSV/Excel DDE attacks.

---

## 5. Cryptographic Audit Chain

All create, update, delete, and permission events are hashed and cryptographically chained (`prev_hash` $\to$ `record_hash`). The audit verification endpoint continuously validates the unbroken chain.
