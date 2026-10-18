# I3DION — Flow, Omni Engine & Omni Studio: Architecture, Improvements, Bug Report
**Date:** 18 Oct 2026 • **Reviewed:** commit `b29a313` • Labels: CONFIRMED / PROPOSED / UNKNOWN

---

## 1. What improved in your new push (verified by reading code)
| Item | Status |
|---|---|
| C1 platform-admin guard now staff-allowlist only | **Verified fixed** (`platformAdmin.js`) |
| C2 server-side `orders` table, plan taken from stored order, amount recorded | **Verified fixed** (`billing.js`) |
| C3 signup uses `getJwtSecret()` and `withTransaction` | **Verified fixed** (`auth.js`) |
| H3 per-route limiters (login, signup, forgot, reset, public leads/events) | **Verified present** (`rateLimiters.js`) |
| H5 reset tokens hashed (SHA-256) | **Verified present** |
| Webhook length-safe compare | **Verified present** |
| New: `packages/contracts` (identity, assetRef, event, lead, publishing, catalogComposition, experienceScene), design system, Home shell, command palette, state components | **Present** (not runtime-tested by me) |
| Regression tests "S0 suite" | **Verified present & passing** (`test-security-s0.js`) |

---

## 2. Omni Studio bugs: what I found and fixed
Method: TypeScript and ESLint on the whole Studio area, then reading every file the checker flagged.

| # | Bug | Effect | Fix |
|---|---|---|---|
| B1 | `StudioLogicWorkspace` calls `iScriptEngine.convertVisualLogicToIScript`, which **does not exist** (real name `convertLogicNodesToiScript`) — 3 call sites | Adding/deleting a logic node or switching to iScript mode throws and breaks the screen | Calls corrected |
| B2 | Saving logic on a project with no document wrote an **incomplete document** (missing tree, variables, theme, settings) | Later loads/validators fail on that project | Full default document |
| B3 | Save failure only `console.error`'d | User thinks it saved (silent fake success) | Visible error: "Your changes were NOT saved" |
| B4 | `scripts` field missing from the project-document type, so validators read an untyped field | iScript validation unreliable | Type added |
| B5 | `LogicRuleBuilder`: `rule.actions` can be undefined (older saved rules) but code spreads/maps it | Crash when opening or editing such a rule | Null-safe everywhere |
| B6 | `logicEngine`: conditions/actions with missing `targetNodeId`/`propertyName` indexed `undefined` | Runtime errors; rules may fire wrongly | Malformed conditions **fail closed**; malformed actions skipped |
| B7 | `TOGGLE_VISIBILITY` declared `const` inside a bare `case` | Shared-scope bug waiting to happen | Block-scoped |
| B8 | `iscriptGenerator` read `rule.triggerType.replace` / `rule.actions.forEach` unguarded | Crash generating script from partial rules | Defaults |
| B9 | `StudioScreenPanel`: invalid `title` prop on an icon | Tooltip never shows | Wrapped in a span |

---

## 3. Product definitions (decision D-11)

| | **Omni Engine** | **Omni Studio** |
|---|---|---|
| Identity | Interactive 3D **authoring + runtime** (Verge3D-style) | **Workspace** that composes catalogs, pages and experiences; hosts the Engine editor |
| Users | Product/3D owner | Sales/marketing + product owner |
| Does | Part-level edits (move/rotate/scale, colour, texture/material swap, show/hide), animations, variants, hotspots, visual logic, AR bake | Layout, branding, sections, product data binding, preview, publish, QR, quote CTA |
| Feels like | Blender-style **interaction** (outliner, viewport gizmos, properties, timeline, undo) | CAD-style **precision tools** (units, measure, dimensions, section, exploded view, BOM) delivered *through* the Engine editor |

---

## 4. OMNI ENGINE — architecture

```
Vault asset (GLB, immutable version) ──► Scene Document (JSON delta, versioned)
                                              │  non-destructive overrides, keyed by stable node keys
         ┌────────────────────────────────────┼─────────────────────────────┐
         ▼                                    ▼                             ▼
   Editor (Studio-hosted)               Publish job                    Runtime (viewer-3d)
   viewport, outliner,                  validate → bake GLB/USDZ       used by Hub, AR, preview;
   inspector, timeline, logic           → immutable snapshot           same code as editor
```

### 4.1 Scene Document (extends `packages/contracts/experienceScene.ts`)
```
scene { id, orgId, assetRef{assetId, versionId}, schemaVersion,
  nodes:     { [nodeKey]: {transform?, visible?, materialRef?, tags[]} },   # overrides only
  materials: { [id]: PBR{baseColor, metallic, roughness, normalMap?, emissive?, opacity, uvTransform} },
  variants:  [ {id, name, set:[{nodeKey, materialRef|visible|transform}]} ],  # configurator states
  animations:[ {id, clipRef? | tracks:[{nodeKey, prop, keys:[{t,value,ease}]}], loop, speed} ],
  hotspots:  [ {id, nodeKey, offset, card{title, specs[], image?, cta?}} ],
  variables: [ {name, type, default} ],
  logic:     [ {id, event, conditions[], actions[]} ],                      # IR, no code
  camera, environment, quality{budget}, measure{units} }
```

### 4.2 Editing capabilities
- Select part (raycast, outline, multi-select, tree)
- Move / rotate / scale part (gizmo, snapping, units)
- Colour change (PBR picker, swatches)
- Texture / material swap (presets + Vault upload)
- Show/hide, isolate, group
- Variants (variant sets)
- Part animations (keyframe tracks + glTF clips)
- Exploded view / assembly
- Measure, dimensions, section plane
- Hotspots with spec cards
- Undo/redo, autosave

### 4.3 Interactivity engine (Verge3D "Puzzles" equivalent)
Visual blocks → declarative IR → sandboxed interpreter. No arbitrary JavaScript.

---

## 5. OMNI STUDIO — architecture (workspace)
- Shell: dockable panels, command palette (Ctrl+K), keyboard shortcuts.
- Document model: Project Document referencing Scene Documents; command bus; undo/redo; autosave with version check.
- Catalog layer: sections, product-data binding from Vault, branding tokens, desktop/mobile preview, QR, quote CTA, branded PDF export.
- Publish pipeline: validate → snapshot → Hub URL/QR → event `published`.

---

## 6. I3DION FLOW — complete architecture (the "Power Automate" layer)
- Principles: Reliable before clever; every run observable; tenant-scoped; idempotent; quota-limited.
- Pipeline: Producer → `event_outbox` (transactional outbox) → Dispatcher worker (`SKIP LOCKED`) → Trigger matcher → `flow_runs` → Executor → Actions (Notify, Records, Approvals, Webhook/CRM).
- Expressions: JSONLogic/CEL-style restricted expressions.
- Safety: loop guard (depth > 5 rejected), SSRF guard (block private IPs), HMAC signed webhooks, envelope encryption for connection secrets.

---

## 7. Improvements & features by section (MoSCoW)
- Core: Refresh-token sessions, RLS, MFA for admins, single authorization engine.
- Vault: Private signed-URL storage, upload validation, GLB inspection.
- Hub: Lazy loading, poster-first 3D, org-branded pages.
- Omni Studio: Fix B1–B9, undo/redo, autosave, quote PDF.
- Omni Engine: Part select/move/colour/texture, variants, hotspots, animation tracks, interaction IR.
- Lens: Live telemetry only.
- Flow: Outbox + dispatcher + executor, 8 templates, run history.
- Platform: CI (lint, typecheck, tests, audit, secret scan).

---

## 8. Decisions
- D-11: Engine = 3D editor + runtime; Studio = workspace hosting it (Confirmed).
- D-12: USDZ/AR bake tooling (Validate Blender-headless or gltf→USDZ on real iPhones).
- D-13: WhatsApp provider (Official WhatsApp Business Platform via BSP).
- D-14: Visual logic replaces iScript (Yes; migrate then retire iScript).
- D-15: Real-time collaboration timing (After pilots).
