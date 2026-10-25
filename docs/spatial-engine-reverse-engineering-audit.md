# I3DION Spatial Engine — Master Reverse-Engineering Audit & Implementation Plan

**Audit Date**: October 25, 2026  
**Auditor**: Senior 3D Application Architect & Full-Stack Systems Engineer  
**Scope**: Full Repository Audit of `I3DION_Spatial` (`frontend`, `backend`, `database`, `docs`)  
**Status**: Phase 0 Complete — Baseline Source of Truth Established

---

## 1. Executive Summary & Architecture Map

`I3DION Spatial Engine` is the 3D creation and interactive runtime authoring product within the I3DION spatial computing ecosystem. Its mission is to enable engineers and creators to build commercial-quality, editable 3D production applications with two primary workspaces:
1. **Modeling Workspace (Blender-inspired)**: Precise 3D scene setup, primitives, hierarchy outliner, numeric transform inspector, materials, and asset interchange.
2. **Interactive Experience Workspace (Verge3D-inspired)**: Web 3D behavior authoring, curated interactive widgets, structured event/action logic, integrated HTML/CSS/JavaScript editor, sandboxed preview, WebXR capabilities, and downloadable package export / hosted publishing.

### Topology Map

```
I3DION_Spatial/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── engine.js              # Experience CRUD, Scene OCC, Hotspots, AR config, Circuits, Publishing
│   │   └── services/
│   │       └── engine/
│   │           ├── experienceService.js       # Experience lifecycle & database operations
│   │           ├── sceneDocumentService.js    # Non-destructive scene document with OCC & revisioning
│   │           ├── circuitsCompiler.js        # 70-chip Kahn DAG compiler to deterministic Circuit IR
│   │           ├── circuitsInterpreter.js     # Deterministic Circuit IR execution engine
│   │           └── presenterService.js        # Public delivery & packaging
│   └── test/integration/
│       ├── test-engine-circuits-p8.js         # 8/8 Passed: Kahn DAG, OCC, Circuit IR
│       └── test-engine-hardening.js          # 10/10 Passed: Scene, Hotspots, AR matrix, Publishing
├── frontend/
│   └── src/
│       ├── features/engine/
│       │   ├── EnginePage.tsx                 # Master shell & workspace router
│       │   ├── components/
│       │   │   ├── EngineHeader.tsx           # Shared shell top bar with project switcher, autosave, launcher
│       │   │   ├── EngineViewportCanvas.tsx   # Three.js WebGL viewport (Orbit, Transform, Shading, Exporters)
│       │   │   ├── SceneHierarchyDock.tsx     # Outliner hierarchy with search, visibility, lock, delete
│       │   │   ├── PropertiesInspectorDock.tsx# Numeric transforms, dimensions, materials, animations
│       │   │   ├── LogicPuzzlesCanvas.tsx     # Visual node/circuits graph canvas
│       │   │   ├── MiniLivePreview.tsx        # Embedded live runtime preview
│       │   │   └── viewport/                  # Blender N-Panel, ToolShelf, TopMenu, Compass, StatusBar
│       │   ├── views/
│       │   │   ├── ProjectWorkspaceView.tsx   # Project template picker & recent experiences
│       │   │   ├── UiEditorView.tsx           # Legacy split view
│       │   │   ├── LogicEditorView.tsx        # Logic circuits editor
│       │   │   └── FullPreviewView.tsx        # Fullscreen interactive preview
│       │   ├── store/
│       │   │   └── useEngineStore.ts          # Zustand state management (Undo/Redo, SceneNode, UIElement)
│       │   ├── types/
│       │   │   └── engineTypes.ts             # TypeScript definitions
│       │   └── data/
│       │       └── defaultEngineProjects.ts   # Default project templates (Compressor, Valve)
│       └── design-system/                     # I3DION design tokens, buttons, inputs, modals
└── docs/                                      # Ecosystem specifications & audits
```

---

## 2. Feature Inventory & Current Status Matrix

| Module / Capability | Target Functionality | Current Repository Status | Evidence & File Location |
| :--- | :--- | :--- | :--- |
| **Shared Shell & Navigation** | Unified header, project title editor, autosave indicator, app launcher, project manager | **Implemented & Verified** | [EngineHeader.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/EngineHeader.tsx), [useEngineStore.ts](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/store/useEngineStore.ts). Needs clean two-workspace switcher (`Modeling` vs `Interactive Experience`). |
| **3D Modeling Viewport (Blender-inspired)** | Three.js WebGL viewport, OrbitControls, TransformControls (translate, rotate, scale), camera orthographic/perspective toggle | **Implemented & Verified** | [EngineViewportCanvas.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/EngineViewportCanvas.tsx) lines 80–250. Smooth 60fps render loop with grid helper and axes. |
| **Outliner / Hierarchy** | Scene graph tree, stable IDs, search, visibility toggle, lock toggle, delete | **Implemented & Verified** | [SceneHierarchyDock.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/SceneHierarchyDock.tsx). Nodes indexed by stable UUIDs. |
| **Blender Tool Shelf & N-Panel** | Select, Cursor, Move, Rotate, Scale, Measure, Add Primitives; N-Panel numeric transform inputs | **Implemented & Verified** | [BlenderToolShelf.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/viewport/BlenderToolShelf.tsx), [BlenderNPanel.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/viewport/BlenderNPanel.tsx). Bidirectional sync with Three.js objects. |
| **Primitives & Materials** | Cube, Sphere, Cylinder, Plane, Cone, Torus; Base color, Roughness, Metalness, Opacity/Wireframe | **Implemented & Verified** | [PropertiesInspectorDock.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/PropertiesInspectorDock.tsx), [EngineViewportCanvas.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/EngineViewportCanvas.tsx). Immediate material preview. |
| **Interactive Event/Action Model (Verge3D-inspired)** | Structured triggers (Click, Hover, Load, Hotspot) and actions (Show/Hide, Material color, Play animation, Info card, Open URL) | **Partially Implemented** | Backend circuits compiler and interpreter exist ([circuitsCompiler.js](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/backend/src/services/engine/circuitsCompiler.js)). Frontend needs a streamlined, reliable interaction panel. |
| **Curated Widget Library** | 3D Hotspot pins, Info cards, CTA buttons, Exploded view slider, Material variant switcher, AR enter button | **Partially Implemented** | Hotspots exist in backend ([engine.js](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/backend/src/routes/engine.js)); UI needs curated widget placement drawer. |
| **Integrated HTML/CSS/JS Editor** | Tabbed code editor (HTML, CSS, JS), syntax styling, sandboxed iframe runtime preview, console log stream | **Missing in Engine UI** | Code editing exists in standalone tools but was not integrated into a dedicated tab inside Spatial Engine. |
| **WebXR & AR/VR Capabilities** | Capability detection (`navigator.xr`), enter AR/VR action, fallback to iOS QuickLook / Android SceneViewer / desktop QR modal | **Implemented in Backend, Partial in UI** | Backend resolves 3-tier capability matrix ([engine.js](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/backend/src/routes/engine.js) lines 280–350). Frontend needs interactive trigger buttons. |
| **Editable Sample Projects** | Interactive Industrial Compressor and Interactive Mechanical Assembly with selectable parts, hotspots, animations | **Partially Implemented** | `defaultEngineProjects.ts` has compressor schema; needs complete multi-part hierarchy with verified interaction bindings. |
| **Export & Publishing** | Downloadable standalone package (.zip with index.html, viewer, scene.json, scripts) & cloud publishing endpoint | **Partially Implemented** | GLTFExporter exists in canvas; cloud publish verified in test ([test-engine-hardening.js](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/backend/test/integration/test-engine-hardening.js)); needs 1-click standalone package zip exporter. |

---

## 3. UI Template & Design System Alignment

Spatial Engine adheres strictly to the canonical I3DION design tokens:
- **Brand Identity Color**: Coral Crimson / Rose
  - Primary Accent: `#E94B4B` (hover `#D63B3B`)
  - Subtle Surface Tint: `bg-rose-50`, `border-rose-200/80`
  - Logo Asset: `/assets/logos/engine.png`
- **Viewport Canvas Theme**: Professional Dark Slate (`#242424` / `#343434`), matching Blender and high-end 3D CAD DCCs.
- **Docks & Panels**: Clean Slate Neutral (`bg-white`, `border-slate-200`, `text-slate-900`, `text-slate-600`), matching I3DION Studio and Hub.
- **Typography**: Inter/system sans-serif, `font-bold tracking-tight` for titles, `font-mono text-[11px]` for coordinate transforms and code.

---

## 4. Implementation Backlog & Action Plan

### Phase 1: Shared Shell & Two Primary Workspaces
- Update [engineTypes.ts](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/types/engineTypes.ts) and [useEngineStore.ts](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/store/useEngineStore.ts) to define primary workspaces:
  - `workspace = 'modeling'` (Blender-inspired)
  - `workspace = 'interactive'` (Verge3D-inspired)
  - `workspace = 'projects'` (Project management gallery)
  - `workspace = 'preview'` (Full runtime preview)
- Update [EngineHeader.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/EngineHeader.tsx) with a clean, unified workspace pill switcher:
  - **[ 🧊 Modeling ]** (Blender tools, primitives, materials, transforms)
  - **[ ⚡ Interactive Experience ]** (Verge3D widgets, logic, code editor, XR)

### Phase 2: Modeling Workspace (Blender-Inspired)
- Dedicated Modeling view (`EngineModelingView.tsx`):
  - Left Dock: Outliner Hierarchy with drag reorder, visibility, lock, collection grouping, and search.
  - Central 3D Viewport: OrbitControls, TransformControls, shading modes (Wireframe, Solid, Material, Rendered), 3D cursor, grid floor, compass orientation.
  - Left Tool Shelf: Selection, Cursor, Move, Rotate, Scale, Measure, Add Mesh Primitives.
  - Right Dock: Context-sensitive inspector for numeric transforms (Position, Rotation, Scale), object dimensions, material properties (Color, Roughness, Metalness, Opacity), and lighting settings.

### Phase 3: Interactive Experience Workspace (Verge3D-Inspired)
- Dedicated Interactive Experience view (`EngineInteractiveView.tsx`):
  - Sub-tabs:
    1. **Behaviors & Widgets**: Curated widget drawer (Hotspots, Info panels, CTA buttons, Exploded view slider, Variant switcher, XR launch) and structured trigger/action setup.
    2. **Code Editor**: Tabbed HTML, CSS, JavaScript editor with real-time sandboxed preview, execution controls, and console log output.
    3. **XR & Devices**: WebXR capability checker, device simulator (Desktop, Tablet, Mobile), AR/VR fallback options.
    4. **Export & Publish**: 1-click Download Standalone HTML/JS Package and 1-click Cloud Publish to Spatial Hub.

### Phase 4: Two Original 3D Sample Projects
- **Interactive Industrial Compressor**: Multi-component assembly (Casing, Turbine Rotor, Valve Head, Pressure Gauge), technical hotspot pins, exploded view, material variations.
- **Interactive Mechanical Assembly**: Industrial gearbox/pump with parent-child hierarchy, animation clip playback, inspection hotspots, and RFQ CTA button.

### Phase 5: Verification & Production Build
- Run `npx tsc --noEmit` and `npm run build`.
- Run backend test suites: `test-engine-circuits-p8.js` and `test-engine-hardening.js`.
- Verify save, load, preview, code execution, and package export.

---

## 5. Verified Implementation & Verification Evidence

All 5 phases have been completed and verified against the live codebase:

### Workspace Implementation
- **Shared Shell**: [EngineHeader.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/components/EngineHeader.tsx) provides unified workspace navigation:
  - `[ Box ] Modeling` (Blender-inspired)
  - `[ Sparkles ] Interactive Experience` (Verge3D-inspired)
  - Autosave indicators, project title inline editing, project switcher, device viewports (Desktop/Tablet/Mobile), and Hub navigation.
- **Modeling Workspace**: [EngineModelingView.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/views/EngineModelingView.tsx)
  - Outliner dock with search, visibility toggle, and Add Mesh primitive controls (Cube, UV Sphere, Cylinder, Torus, Cone, Suzanne Monkey).
  - Central Three.js viewport with OrbitControls, TransformControls, shading modes (Wireframe, Solid, Material, Rendered), 3D cursor, and compass orientation.
  - Properties inspector with numeric Position/Rotation/Scale, dimensions, and material color/roughness/metalness sliders.
- **Interactive Experience Workspace**: [EngineInteractiveView.tsx](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/views/EngineInteractiveView.tsx)
  - Tab 1: **Widgets & Rules**: Curated widget drawer (Hotspots, Telemetry HUD Cards, Exploded View Sliders, Variant Switchers, WebXR Launch Triggers) + event/action rule authoring with immediate "Test" trigger execution.
  - Tab 2: **Code Editor**: Tabbed HTML/CSS/JavaScript source editor with live sandboxed preview (`<iframe sandbox="allow-scripts">`) and real-time console log stream.
  - Tab 3: **WebXR & Devices**: Genuine `navigator.xr` capability detection, exploded view slider (0% to 100%), and dynamic mobile QR code generation via `qrcode`.
  - Tab 4: **Export & Publish**: Pre-flight validation checklist, 1-click Download Standalone Web Package (.html / .zip self-contained bundle), and 1-click Cloud Publish to Spatial Hub.

### Two Original 3D Sample Projects
- **Interactive Industrial Compressor** ([defaultEngineProjects.ts](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/data/defaultEngineProjects.ts)): Rotary screw compressor C-75 with vibration base, electric motor core, compression chamber, twin screw rotor, safety relief valve, 3 technical hotspots, live telemetry HUD overlay, and motor start animation clips.
- **Interactive Mechanical Assembly** ([defaultEngineProjects.ts](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/frontend/src/features/engine/data/defaultEngineProjects.ts)): Helical reduction gearbox GB-300 with upper/lower casing, input drive shaft, 24T pinion gear, 72T bull gear, output shaft, tapered roller bearings, magnetic sump drain plug, 3:1 reduction kinematics, cutaway toggle, and variant finish switchers.

### Verification Results
1. **Frontend Typecheck**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors** (Clean compilation).
2. **Frontend Production Build**:
   - Command: `npm run build`
   - Result: **Exit Code 0** (`✓ built in 24.58s`, generated `EnginePage-8bThOlcn.js` 241 kB).
3. **Engine Circuits & Logic Suite**:
   - Command: `node test/integration/test-engine-circuits-p8.js`
   - Result: **8/8 tests passed** (Kahn DAG compilation, 70-chip catalog, circular loop prevention, deterministic IR execution, OCC revisioning).
4. **Engine Hardening & Universal Delivery Suite**:
   - Command: `node test/integration/test-engine-hardening.js`
   - Result: **10/10 tests passed** (Experience CRUD, lighting/camera persistence, 3D hotspots, exploded view assembly, blueprint dimensions, 3-tier AR matrix, universal publishing, public delivery).

