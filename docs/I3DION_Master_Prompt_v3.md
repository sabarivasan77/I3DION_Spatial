# I3DION MASTER PROMPT v3.0 — "Verified Build" Edition
**For:** Google Antigravity (Planning mode, multi-agent) • **Repo:** `sabarivasan77/I3DION_Spatial` @ `b29a313` or newer
**Put these in `/docs/` first:** `I3DION_Company_Ecosystem_Master_Documentation_v2.md`, `I3DION_Spatial_Review_Report.md`, `I3DION_Spatial_Security_First_Master_Prompt.md` (security annexes A1–A13 are binding), `I3DION_Spatial_Scorecard_and_Market_Comparison.md`, `I3DION_Flow_Engine_Studio_Architecture.md`, and apply `omni-studio-bugfixes.patch`.
**What v3 adds over v1/v2:** a verification loop with independent reviewer agents, measurable acceptance criteria tied to the scorecard, and phase prompts for Engine, Studio, Flow and Lens.

---

## PART A — CONSTITUTION (applies to every task)

1. **Order of work is fixed:** security gates (S1–S4) → Engine → Flow → Studio completion → Lens → pilots. No feature work that bypasses an open Critical/High finding.
2. **One phase at a time. Plan artifact first. Wait for approval. Stop at the gate.**
3. **Truth labels:** CONFIRMED / PROPOSED / UNKNOWN. Never claim "verified" without command output, test results or screenshots.
4. **Verification loop (new):** for every phase run three roles in sequence:
   - **Builder agent** implements in small vertical slices.
   - **Reviewer agent** (fresh context, no builder reasoning) reads only the diff + spec and writes defects. Builder must fix or justify each.
   - **Adversary agent** attacks the result (security tests, malformed input, cross-tenant attempts, stale-save conflicts, huge files, slow network, low-end phone). Findings go in the Session Report.
5. **Quality gate on every PR:** `lint` + **`tsc --noEmit` (zero errors in touched areas)** + unit + integration + Playwright smoke + `npm audit` (no high/critical) + secret scan. If CI does not exist yet, creating it is task #1 of Phase S1.
6. **Scorecard-driven:** every phase states which scorecard dimensions/checks (e.g. S1, AUTH-*, P4) it should raise and by how much, and re-scores them with evidence at the gate. No score is raised without evidence.
7. **Never invent** features, customers, certifications, deployment state, benchmark numbers.
8. **Fail closed, never fake success.** Errors surface honestly with retry; no demo data in production paths.
9. **Non-destructive by default:** user edits to 3D models are overrides in a Scene Document; original assets are immutable versions.
10. **Frozen:** iScript text language, DataBridge, duplicate "intelligence" engines, AI gateway. Do not extend. Migration only (decision D-14).
11. **Decisions D-1…D-15** are in the security prompt §10 and the architecture doc §9. Recommend; owner decides.
12. **Design rules:** follow the I3DION design system (`frontend/src/design-system`) and the anti-"AI look" checklist from master prompt v1 §7.5; every screen has designed empty/loading/error/permission states; WCAG 2.2 AA; screenshots desktop + mobile.

### Session Report (required)
```
Phase / task IDs: | Plan approved? |
Changes (files, commits): | Tests + exact commands + exact output: |
Reviewer-agent defects (fixed/justified): | Adversary findings: |
Scorecard items moved (before → after, evidence): |
Screenshots/recordings: | Open risks: | Decisions needed: | Next action: |
```

---

## PART B — PHASE PROMPTS (feed one at a time)

### PHASE S1 — Identity, Sessions, RLS, Private Storage, CI
Implement security prompt Phase S1–S3 exactly (Annex A1–A7, A13).
**Acceptance:** AUTH-*, AUTHZ-*, TENANT-*, UPLOAD-* test groups green; CI running with typecheck; zero routes without a policy; private asset without signature → 403/404; RLS proven by removing a `WHERE organization_id` in a test query and still getting 0 foreign rows.
**Scorecard targets:** dimensions 1, 2, 7, 8 ≥ +2 each.

### PHASE E1 — Omni Engine Core (editor + scene document)
**Goal:** a user opens a Vault GLB and makes **non-destructive** edits.
**Build:** Scene Document schema (extend `packages/contracts/experienceScene.ts`, versioned, zod-validated server + client); stable `nodeKey` + remap report; viewport (Three.js, glTF loader with Draco/Meshopt/KTX2), outliner, selection (click, tree, multi-select, outline), transform gizmo with snapping and numeric fields (units), colour picker, show/hide/isolate, virtual groups, command-pattern undo/redo, autosave with version check (409 on stale save → merge UI), save/load via API with tenant scoping.
**Acceptance:** open → move part → recolour → hide part → undo ×3 → redo ×3 → save → reload shows identical state; original GLB hash unchanged; replacing the asset with a new version produces a remap report with 0 silent losses; ≥ 30 fps on a mid-range Android with a 10 MB model; unit tests for every command and the remap; Playwright e2e of the above.
**Out of scope:** textures, animation, logic, AR bake.

### PHASE E2 — Materials, Textures, Variants, Hotspots
**Build:** PBR material editor (base colour, metallic, roughness, normal, emissive, opacity, UV transform); texture upload through the Vault pipeline (magic bytes, size/type limits, KTX2 transcode job, quota); material library/presets; variant sets (e.g. 3 paint finishes) with one-click switching; hotspot editor (pin anchored to nodeKey + spec card + CTA).
**Acceptance:** swapping a texture on one part leaves others unchanged; disallowed/oversized texture rejected with clear error; variants round-trip save/load; hotspot cards accessible by keyboard and screen reader; GPU texture-memory budget warning shown above 128 MB (mobile profile).

### PHASE F1 — I3DION Flow v1
**Build:** architecture §6 of the architecture doc: transactional outbox, dispatcher (`FOR UPDATE SKIP LOCKED`), idempotent runs, executor with retries/backoff/dead-letter, loop guard, quotas, SSRF-safe signed webhooks, secrets envelope encryption, form-based rule editor, run history, dry-run test, 8 templates, email + in-app + WhatsApp adapter (behind provider interface, sandbox first).
**Acceptance (FLOW-* tests):** duplicate event creates one run; killed worker resumes without duplicate side effects; failing adapter retries then dead-letters and alerts; cross-tenant event never triggers another org's flow; webhook to a private IP is blocked; secrets never appear in API responses/logs; loop depth > 5 rejected; the flagship story triggers "new lead → notify owner" end-to-end.

### PHASE E3 — Motion, Interactivity & CAD-lite
**Build:** animation tracks (position/rotation/scale/colour/opacity, easing) + glTF clip playback + timeline; exploded view; measure tool, dimension overlays, section plane; **interaction IR** (events → conditions → actions, typed variables, step cap, no `eval`) with visual block editor; migrate existing LogicCraft rules via converter; events `track` and `submit lead` wired to Lens and Core.
**Acceptance:** a scripted demo (click part → plays animation → switches variant → shows spec card → submits quote request) works on desktop and phone; malicious/huge logic graphs rejected by validation; runtime limits proven by a stress test; AR bake job produces GLB + USDZ that open on a real iPhone and Android (record evidence).

### PHASE ST — Omni Studio Completion
**Build:** dockable workspace shell hosting the Engine editor; project document + command bus; autosave with conflict handling; publish validator (missing assets, unreachable logic, budget breaches, accessibility); branded **quote PDF**; bulk CSV/Excel import with validation report; templates; fix the 9 `exhaustive-deps` warnings and remaining Studio `any` hot spots; retire misleading "compiler" naming.
**Acceptance:** non-technical tester builds and publishes a catalog with one interactive 3D experience in ≤ 15 minutes unaided; published snapshot unaffected by later asset edits; quote PDF generated from a lead; zero Studio TypeScript errors.

### PHASE L1 — Lens on Live Data
**Build:** remove sample-data defaults from production paths; event ingestion per Annex A12; metric definition page; funnel (visit → 3D → AR → lead), per-product ranking, lead response time.
**Acceptance:** every metric traceable to a written definition and a source table; empty-state (no data) shown honestly; no `Math.random`/sample data reachable in production build (CI grep test).

### PHASE H — Hardening & Pilots
Trust Pack, pen-test fixes, restore drill, performance budgets met (Hub LCP ≤ 2.5 s mid-range phone on 4G), accessibility audit, billing end-to-end, 2–3 pilot customers on the flagship story.
**Exit:** scorecard re-run with evidence; target ≥ 70 / 100.
