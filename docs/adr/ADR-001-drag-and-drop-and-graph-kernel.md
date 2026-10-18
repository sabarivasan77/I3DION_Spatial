# ADR-001: Editor Kernel, Layout Drag-and-Drop & Graph Framework Selection

**Status:** PROPOSED — PENDING OWNER APPROVAL  
**Date:** October 18, 2026  
**Context:** Phase K0 (Editor Kernel & Drag-and-Drop Framework)  
**Authors:** Principal Program Manager & Chief Architect  

---

## 1. Context & Problem Statement

I3DION Spatial currently contains three separate, hand-rolled canvas implementations:
1. **Omni Studio (`CanvasArea.tsx`):** Uses native HTML5 drag with no container targeting, no insertion index, no touch support, and no keyboard accessibility. Moving widgets is restricted to up/down chevron buttons.
2. **Spatial Engine ("Logic Puzzles"):** `LogicPuzzlesCanvas.tsx` is a static UI façade with no pointer drag, no wires, and no execution runtime.
3. **Studio Logic (`features/logic/components/LogicCanvas.tsx`):** A custom 267-line canvas using raw SVG bezier curves without typed ports, zoom/pan bounds, or undo/redo.

To resolve these defects permanently and power **Omni Studio**, **Omni Engine (Edit + Circuits)**, and **I3DION Flow** with a single interaction foundation, we must establish:
- A tree layout drag-and-drop framework for nested containers, sections, and catalog widgets (`packages/layout-dnd`).
- A node/wire graph editor framework for visual logic, Circuits, and Flow automations (`packages/graph-editor`).

---

## 2. Evaluation of Alternatives

### 2.1 Layout Drag-and-Drop: `dnd-kit` vs Atlassian `pragmatic-drag-and-drop`

| Evaluation Criteria | `@dnd-kit` (Core + Sortable + Modifiers) | Atlassian `pragmatic-drag-and-drop` |
|---|---|---|
| **Architecture** | Native React hooks (`useDraggable`, `useDroppable`, `useSortable`, `DndContext`) | Framework-agnostic vanilla JS functions attached via DOM refs |
| **Touch / Mobile Support** | **Built-in `TouchSensor`** with configurable delay and tolerance | Requires custom touch hitboxes and manual event handling |
| **Keyboard Accessibility** | **Built-in `KeyboardSensor`** + screen-reader announcement hooks (WCAG 2.2 AA) | Not built-in; requires bespoke keyboard event orchestration |
| **Drag Overlay / Ghosting** | **`<DragOverlay>`** renders outside DOM flow, maintaining 60 fps during complex layout drags | Relies on browser native ghost image or manual React portal creation |
| **Collision Detection** | Rich library (`closestCorners`, `rectIntersection`, custom hierarchical container collision) | Manual geometric rect calculation required for nested containers |
| **Bundle Size** | ~28 KB (gzipped across modules) | ~8 KB (gzipped) |
| **Community & Ecosystem** | Broad React ecosystem adoption; extensive recipes for nested sortable trees | Primarily developed for Atlassian Cloud (Jira/Trello); smaller open-source community |

### 2.2 Graph Editor Canvas: `@xyflow/react` (React Flow v12)

- **Selected Choice:** `@xyflow/react` (React Flow v12, MIT License).
- **Capabilities Verified:**
  - Virtualized viewport rendering (smooth 60 fps with 1,000+ nodes using `onlyRenderVisibleElements`).
  - Typed handles/ports with synchronous `isValidConnection` rejection (exec vs data ports).
  - Out-of-the-box support for mini-maps, controls, multi-select box, auto-scroll, and zoom/pan.
  - Seamless integration with `elkjs` / `dagre` for automatic hierarchical node layout.
  - Zero bespoke SVG path calculations needed.

---

## 3. Decision

1. **Adopt `@dnd-kit` for `packages/layout-dnd`:**
   - Powers the nested layout tree in Omni Studio and the hierarchy outliner in Omni Engine.
   - Provides guaranteed touch sensor support for tablets and keyboard accessibility out of the box.
   - Utilizes `<DragOverlay>` to achieve the ≥ 60 fps performance budget during drags.
2. **Adopt `@xyflow/react` for `packages/graph-editor`:**
   - Powers Omni Circuits (Engine), visual logic, and I3DION Flow automation designer.
   - Replaces the 3 disconnected canvas implementations with one unified, hardened component.
3. **Strangler Migration via Feature Flags:**
   - All migrations will be protected behind feature flags (`ff.kernel.studio`, `ff.kernel.logic`, `ff.engine.circuits`). Existing screens will remain intact until new kernel packages pass 100% of automated Playwright test scenarios.

---

## 4. Consequences

### Positive:
- Eliminates hundreds of lines of fragile, hand-rolled SVG and pointer math.
- Fixes all 8 drag-and-drop failures diagnosed in Architecture §0.
- Studio widgets can be dragged into nested containers with visible drop indicators.
- Circuits and Flow share the exact same node canvas, reducing future maintenance overhead.

### Negative / Mitigations:
- Adds `@dnd-kit` and `@xyflow/react` dependencies to the frontend bundle (~65 KB gzipped total).
- *Mitigation:* Both libraries will be code-split using `lazyWithRetry` and only loaded when navigating to `/omni-studio`, `/engine`, or `/flow`.
