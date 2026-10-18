# Omni Studio — Catalog Authoring & Visual Canvas Guide

**Omni Studio** is the unified visual authoring environment for designing interactive 3D spatial catalogs, multi-screen brochures, and interactive spec sheets.

---

## 1. Visual Drag-and-Drop Canvas

- **Block Registry**: Choose from 20+ responsive blocks including Header, Hero Banner, 3D Spatial Viewer, Grid Gallery, Spec Table, Video Embed, Call-to-Action, and RFQ Quote Form.
- **Layout DnD**: Accessible drag-and-drop reordering with full keyboard support (`Enter` to select, `Arrow` keys to move, `Escape` to cancel).
- **Responsive Preview**: Instantly preview how catalogs look on Desktop, Tablet, and Mobile viewports.

---

## 2. Bidirectional YAML Engine (`i3dion.catalog/1`)

Switch between the visual canvas and raw YAML with zero data loss. The engine validates:
- Schema syntax compliance.
- Missing image or 3D model references.
- Broken circuit bindings or invalid audience tags.

---

## 3. Audience-Aware Dynamic Rendering

- Mark pages, blocks, or pricing columns with audience tags (`public`, `dealer`, `internal`).
- When a dealer views the catalog, wholesale prices and volume discount tiers are visible. When an end-consumer scans a public QR code, dealer margins and internal specs are automatically pruned on the server before network transmission.

---

## 4. Offline Package Export

Export complete standalone HTML/JS packages containing all models, scripts, and stylesheets for offline presentation at trade shows and remote sales meetings.
