# I3DION Flow — Workflow Designer Interaction Specification v1.0
**Document Version:** 1.0 • **Audience:** Frontend Engineers & Interaction Designers

---

## 1. Visual Designer Architecture
The Flow Designer is a first-class visual graph canvas built to provide the Microsoft Power Automate authoring experience tailored for 3D spatial commerce.

### 1.1 Desktop 3-Panel Layout
```
+----------------------------------------------------------------------------------------------------+
|  [Logo] I3DION Flow | Flow: "New Lead Quotation Pipeline"  [Draft]  |  [Validate]  [▶ Test Run]  [Publish] |
+--------------------+---------------------------------------------------------------+---------------+
| PALETTE (280px)    | CANVAS AREA (Center, Flex-1)                                  | INSPECTOR     |
| [Search Nodes...]  |                                                               | (340px)       |
|                    |   +-----------------------+                                   |               |
| > Triggers         |   | [⚡] Trigger: Inbound  |                                   | Selected:     |
|   - Manual Trigger |   +-----------+-----------+                                   | "Condition"   |
|   - Webhook        |               | (exec)                                        |               |
|   - 3D Viewer Evt  |               v                                               | Field:        |
|                    |   +-----------+-----------+                                   | [dwellTime ]  |
| > Logic            |   | [?] Dwell Time > 45s? |                                   |               |
|   - Condition      |   +-----+-----------+-----+                                   | Operator:     |
|   - Delay          |   True  |           | False                                   | [ >        ]  |
|   - Terminate      |         v           v                                         |               |
|                    |    [Send Email]  [Terminate]                                  | Value:        |
| > Communication    |                                                               | [45        ]  |
|   - Send Email     |                                                               |               |
|   - In-App Notice  |                                                               | Error Policy: |
|                    |                                                               | [Stop on err] |
| > Ecosystem        |                                                               |               |
|   - Assign Lead    |                                                               |               |
+--------------------+---------------------------------------------------------------+---------------+
| [Telemetry Drawer: Live Test Runner Results & Step Timers]                                         |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Drag-and-Drop Interaction Mechanics

### 2.1 Dragging from Palette onto Canvas
1. User clicks and drags a node card from the left palette.
2. An interactive semi-transparent drag ghost follows the pointer.
3. Canvas highlights drop targets with subtle 8px grid snapping.
4. On drop, the new node is instantiated with a unique UUID, placed at `screenToCanvasPosition(pointer)`, and auto-selected in the Inspector.

### 2.2 Wire Connection Affordances
1. Every node displays circular port handles on its perimeter:
   - Top/Left: Input handles (`in`).
   - Bottom/Right: Output handles (`out`, `true`, `false`).
2. Clicking and dragging from an output handle pulls a Bezier wire.
3. Compatible input handles glow emerald (`#10b981`).
4. Incompatible handles (e.g. self-connection or type mismatch) glow ruby with a tooltip explaining why the connection cannot be made.
5. On release over a valid handle, an edge is created and Kahn's cycle detection immediately validates the graph.

### 2.3 Inserting a Node Between Connected Nodes
1. When a user drags a node over an existing connection wire, the wire turns cyan (`#0891b2`) and pulses.
2. Dropping the node splits the wire: `Source -> Dropped Node -> Target`.

---

## 3. Dynamic Variable Picker (`{x}`)
Next to every text, number, and boolean parameter in the Node Inspector, a blue `{x}` chip button allows users to insert outputs from preceding steps.

- **Dropdown Display:**
  - Grouped by preceding node labels (e.g., *Trigger*, *Step 1: Extract CAD Metadata*).
  - Shows variable name, data type chip (`STRING`, `NUMBER`, `OBJECT`), and nullable badge.
- **Insertion:** Inserts typed tokens such as `{{trigger.contact.email}}` or `{{nodes.step_1.output.dimensions.width}}`.

---

## 4. Keyboard Shortcuts & Accessibility
| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> + Drag | Pan canvas without selecting nodes |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo last node or wire operation |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo operation |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Delete selected node or wire (with confirmation dialog if connected) |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Duplicate selected node (offset by 20px) |
| <kbd>F</kbd> | Fit entire workflow to viewport |
| <kbd>Esc</kbd> | Deselect node / close drawer |
| <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> | Cycle keyboard focus across node ports for keyboard-only wiring |
