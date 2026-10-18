# Catalog Player — QR Codes & Offline PWA Guide

**Catalog Player** delivers high-performance 3D spatial experiences directly to mobile phones, tablets, and kiosks without requiring native app installations.

---

## 1. 108-bit Non-Enumerable QR Codes

- Standard sequential URLs (e.g. `/catalog/1`, `/catalog/2`) invite competitor scraping and brute-force guessing.
- I3DION issues **108-bit cryptographically secure non-enumerable QR tokens** (e.g. `/q/x9k2pL8mQ1v7`). Guessing an active QR code has a probability of less than $1 \text{ in } 3.2 \times 10^{32}$.

---

## 2. Progressive Web App (PWA) & Offline Caching

- Installable directly to mobile home screens with a single tap.
- Service worker precaches 3D viewer runtime assets, layout styles, and recently viewed catalogs.
- Field sales reps can present 3D equipment catalogs inside factories and underground basements with zero cellular connectivity.

---

## 3. Instant Request For Quote (RFQ) Leads

- Prospective buyers can configure part variants, add parts to their quote basket, and submit an RFQ in 30 seconds.
- Inbound inquiries are persisted to the PostgreSQL leads ledger and immediately dispatched to durable Flow automation.
