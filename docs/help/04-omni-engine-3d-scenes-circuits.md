# Omni Engine — 3D Scenes & Logic Circuits Guide

**Omni Engine** empowers industrial engineers and technical sales teams to compose interactive 3D digital twins, exploded animations, and visual logic circuits.

---

## 1. Non-Destructive Scene Composer

- **Original GLB Integrity**: Your uploaded GLB file remains 100% untouched. All camera positions, material overrides, animations, and hotspot anchors are saved in an external, lightweight Scene Document JSON.
- **10x Undo/Redo**: Full history stack for transforming, rotating, scaling, and re-coloring parts.
- **Optimistic Concurrency Control (OCC)**: Prevents team members from accidentally overwriting concurrent edits by validating revision numbers on save (returns `HTTP 409 Conflict` on stale saves).

---

## 2. Visual Circuits Graph (70 Chips)

Connect interactive logic chips without writing code:
- **Events**: On Click, On Hover, On Scene Load, On Variant Changed.
- **Animations**: Play Exploded View, Orbit to Part, Set Opacity, Animate Camera.
- **Actions**: Show Spec Card, Add to Quote Basket, Switch Material, Emit Flow Event.
- **Logic & Flow Control**: Branch, Delay Timer, Counter, Compare.

---

## 3. Kahn DAG Compilation & Circuit Security Guards

When you hit "Publish", Omni Engine compiles your visual node graph into an optimized, deterministic Circuit Intermediate Representation (IR):
- **Cycle Detection**: Kahn's topological sort algorithm detects and blocks circular infinite loops.
- **Complexity Limits**: Caps graphs at 500 nodes to prevent memory exhaustion on mobile browsers.
- **Identical Runtimes**: The compiled IR produces 100% identical execution traces across the Studio editor, the mobile Catalog Player, and AR sessions.

---

## 4. 3-Tier Augmented Reality (AR) Matrix

1. **iOS AR QuickLook**: Automatic USDZ synthesis for native AR on iPhones and iPads.
2. **Android Scene Viewer / WebXR**: Native WebXR and Scene Viewer intent triggers on Android devices.
3. **Desktop Fallback**: Interactive 3D orbiting and full-screen camera inspection for desktop browsers.
