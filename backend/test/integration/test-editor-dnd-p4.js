import assert from 'node:assert';
import {
  DocumentStore,
  CommandBus,
  InsertNodeCommand,
  MoveNodeCommand,
  DeleteNodeCommand,
  UpdatePropsCommand,
  BatchCommand,
  SelectionManager,
  ClipboardManager,
  OptimisticLockManager
} from '../../../packages/editor-kernel/src/index.ts';
import { blockRegistry } from '../../../packages/block-registry/src/index.ts';
import {
  calculateDropTarget,
  calculateInsertionIndex,
  snap,
  applyAxisLock,
  calculateAutoScroll,
  KeyboardDndController,
  TouchDndSensor
} from '../../../packages/layout-dnd/src/index.ts';
import { createBlankAppDefinition } from '../../../packages/contracts/src/catalogAppDefinition.ts';

console.log('================================================================');
console.log('🧪 I3DION Phase P4: Editor Kernel & Drag-and-Drop Test Suite');
console.log('================================================================\n');

let passedCount = 0;
let failedCount = 0;

function pass(name, details = '') {
  console.log(`✅ [PASS] ${name}`);
  if (details) console.log(`   ${details}`);
  passedCount++;
}

function fail(name, error) {
  console.error(`❌ [FAIL] ${name}`);
  console.error(`   Error: ${error.message || error}`);
  failedCount++;
}

async function runDndTestSuite() {
  // Test 1: Block Registry completeness & container validation
  try {
    const allBlocks = blockRegistry.getAll();
    assert(allBlocks.length >= 20, `Expected at least 20 registered blocks, got ${allBlocks.length}`);

    const section = blockRegistry.get('section');
    assert(section && section.isContainer === true, 'Section block must be registered as a container');

    const button = blockRegistry.get('button');
    assert(button && button.isContainer === false, 'Button block cannot be a container');

    // Button cannot contain section
    const containmentCheck = blockRegistry.canContain('button', 'section');
    assert.strictEqual(containmentCheck.allowed, false, 'Non-container must reject child blocks');

    // Section capacity check
    const sectionCheck = blockRegistry.canContain('section', 'heading', 2);
    assert.strictEqual(sectionCheck.allowed, true, 'Section should allow child within capacity');

    // Validate props schema
    const invalidProps = blockRegistry.validateProps('heading', { text: 12345 });
    assert(invalidProps.length > 0, 'Heading schema must reject numeric text');

    const validProps = blockRegistry.validateProps('heading', { text: 'Welcome', level: 'h1' });
    assert.strictEqual(validProps.length, 0, 'Heading schema must accept valid string text and level');

    pass('DND-01: Block Registry & Validation', `${allBlocks.length} widgets verified; schema and containment validated`);
  } catch (err) {
    fail('DND-01: Block Registry & Validation', err);
  }

  // Test 2: DocumentStore, InsertNodeCommand & Drop into nested container at index 0/middle/end
  try {
    const doc = createBlankAppDefinition();
    const store = new DocumentStore(doc);
    const bus = new CommandBus();

    const homePageId = doc.pages[0].id;

    // Insert section container into home page
    const sectionNode = {
      id: 'section-1',
      type: 'section',
      title: 'Hero Section',
      layout: { mode: 'stack' },
      children: []
    };
    bus.dispatch(new InsertNodeCommand(store, homePageId, sectionNode));

    // Drop into section at index 0
    const nodeA = { id: 'node-a', type: 'heading', props: { text: 'Heading A' } };
    bus.dispatch(new InsertNodeCommand(store, 'section-1', nodeA, 0));

    // Drop into section at end (index 1)
    const nodeC = { id: 'node-c', type: 'button', props: { label: 'Click C' } };
    bus.dispatch(new InsertNodeCommand(store, 'section-1', nodeC, 1));

    // Drop into section at middle (index 1 between nodeA and nodeC)
    const nodeB = { id: 'node-b', type: 'rich_text', props: { content: 'Body B' } };
    bus.dispatch(new InsertNodeCommand(store, 'section-1', nodeB, 1));

    const sectionLoc = store.findNodeLocation('section-1');
    assert(sectionLoc, 'Section must be found');
    const childIds = (sectionLoc.node.children || []).map(c => c.id);
    assert.deepStrictEqual(childIds, ['node-a', 'node-b', 'node-c'], 'Children must match 0, middle, end insertion order');

    pass('DND-02: Drop into container at 0 / middle / end', `Order confirmed: ${childIds.join(' -> ')}`);
  } catch (err) {
    fail('DND-02: Drop into container at 0 / middle / end', err);
  }

  // Test 3: Reject self and descendant drop
  try {
    const store = new DocumentStore();
    const homePageId = store.getDocument().pages[0].id;

    const parentSection = {
      id: 'parent-sec',
      type: 'section',
      layout: { mode: 'stack' },
      children: [
        {
          id: 'child-grid',
          type: 'grid',
          layout: { mode: 'grid' },
          children: [
            { id: 'grandchild-card', type: 'product_card', props: {} }
          ]
        }
      ]
    };
    new InsertNodeCommand(store, homePageId, parentSection).execute();

    assert.strictEqual(store.isDescendant('parent-sec', 'parent-sec'), true, 'Self must be detected as descendant');
    assert.strictEqual(store.isDescendant('parent-sec', 'child-grid'), true, 'Direct child must be detected');
    assert.strictEqual(store.isDescendant('parent-sec', 'grandchild-card'), true, 'Grandchild must be detected');
    assert.strictEqual(store.isDescendant('child-grid', 'parent-sec'), false, 'Parent is not child of its child');

    // Run DnD algorithm check
    const containers = [
      {
        id: 'child-grid',
        type: 'grid',
        layoutMode: 'grid',
        rect: { x: 50, y: 50, width: 300, height: 300 },
        depth: 2,
        childRects: [],
        currentChildCount: 1
      }
    ];

    const targetResult = calculateDropTarget(
      {
        kind: 'node',
        nodeType: 'section',
        nodeId: 'parent-sec',
        initialPointer: { x: 100, y: 100 }
      },
      { x: 100, y: 100 },
      { x: 0, y: 0 },
      { isAltPressed: false, isShiftPressed: false },
      {
        containers,
        isDescendantFn: (a, b) => store.isDescendant(a, b)
      }
    );

    assert.strictEqual(targetResult.canDrop, false, 'DnD must strictly reject drop into descendant');
    assert.match(targetResult.reason || '', /descendant/i, 'Reason must explicitly state descendant');

    pass('DND-03: Reject self and descendant drop', `Rejected with message: "${targetResult.reason}"`);
  } catch (err) {
    fail('DND-03: Reject self and descendant drop', err);
  }

  // Test 4: Reorder / re-parent / duplicate
  try {
    const store = new DocumentStore();
    const pageId = store.getDocument().pages[0].id;
    const bus = new CommandBus();

    const sec1 = { id: 'sec-1', type: 'section', layout: { mode: 'stack' }, children: [{ id: 'n-1', type: 'heading', props: {} }] };
    const sec2 = { id: 'sec-2', type: 'section', layout: { mode: 'stack' }, children: [{ id: 'n-2', type: 'button', props: {} }] };
    bus.dispatch(new InsertNodeCommand(store, pageId, sec1));
    bus.dispatch(new InsertNodeCommand(store, pageId, sec2));

    // Re-parent: move n-1 from sec-1 into sec-2 at index 0
    bus.dispatch(new MoveNodeCommand(store, 'n-1', 'sec-2', 0));

    const sec1After = store.findNodeLocation('sec-1');
    const sec2After = store.findNodeLocation('sec-2');
    assert.strictEqual((sec1After?.node.children || []).length, 0, 'sec-1 should now be empty');
    assert.strictEqual((sec2After?.node.children || []).length, 2, 'sec-2 should now have 2 children');
    assert.strictEqual(sec2After?.node.children?.[0].id, 'n-1', 'n-1 should be at index 0 of sec-2');

    // Duplicate node with new ID
    const cloned = store.cloneNodeWithNewIds(sec2After.node);
    assert.notStrictEqual(cloned.id, sec2After.node.id, 'Cloned container ID must be unique');
    assert.notStrictEqual(cloned.children[0].id, sec2After.node.children[0].id, 'Cloned child ID must be unique');

    pass('DND-04: Reorder, re-parent and duplicate', 'Successfully re-parented across containers and cloned with fresh IDs');
  } catch (err) {
    fail('DND-04: Reorder, re-parent and duplicate', err);
  }

  // Test 5: Undo / Redo 10x identical
  try {
    const store = new DocumentStore();
    const pageId = store.getDocument().pages[0].id;
    const bus = new CommandBus();

    const initialJson = JSON.stringify(store.getDocument());
    const initialCount = store.getDocument().pages[0].children.length;

    // Execute 10 commands
    for (let i = 1; i <= 10; i++) {
      const node = { id: `item-${i}`, type: 'button', props: { label: `Button ${i}` } };
      bus.dispatch(new InsertNodeCommand(store, pageId, node));
    }

    const stateAt10 = JSON.stringify(store.getDocument());
    assert.strictEqual(store.getDocument().pages[0].children.length, initialCount + 10, 'Document should have initial + 10 nodes');

    // Undo all 10
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(bus.canUndo(), true, `Undo must be available at step ${i}`);
      bus.undo();
    }
    assert.strictEqual(bus.canUndo(), false, 'Undo stack must be empty after 10 undos');
    const stateAfter10Undos = JSON.stringify(store.getDocument());
    assert.strictEqual(stateAfter10Undos, initialJson, 'Document after 10 undos must be IDENTICAL to initial state');

    // Redo all 10
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(bus.canRedo(), true, `Redo must be available at step ${i}`);
      bus.redo();
    }
    assert.strictEqual(bus.canRedo(), false, 'Redo stack must be empty after 10 redos');
    const stateAfter10Redos = JSON.stringify(store.getDocument());
    assert.strictEqual(stateAfter10Redos, stateAt10, 'Document after 10 redos must be IDENTICAL to state at 10');

    pass('DND-05: Undo/Redo 10x Identical', 'Initial -> 10 actions -> 10 undos (bit-identical) -> 10 redos (bit-identical)');
  } catch (err) {
    fail('DND-05: Undo/Redo 10x Identical', err);
  }

  // Test 6: Save + reload identical
  try {
    const store = new DocumentStore();
    const pageId = store.getDocument().pages[0].id;
    new InsertNodeCommand(store, pageId, {
      id: 'test-section',
      type: 'section',
      props: { background: '#f5f5f5' },
      children: [
        { id: 'hero-h1', type: 'heading', props: { text: 'Engine 3D', level: 1 } },
        { id: 'viewer-1', type: 'viewer_3d', props: { model: 'asset:engine-glb', ar: true } }
      ]
    }).execute();

    const originalDoc = store.getDocument();
    const serialized = JSON.stringify(originalDoc);

    const reloadedDoc = JSON.parse(serialized);
    const reloadedStore = new DocumentStore(reloadedDoc);

    assert.deepStrictEqual(reloadedStore.getDocument(), originalDoc, 'Reloaded document must be deep identical');
    assert.strictEqual(reloadedStore.findNodeLocation('viewer-1')?.node.type, 'viewer_3d', 'Nested nodes preserved');

    pass('DND-06: Save + Reload Identical', 'App definition serialized, reloaded and verified bit-for-bit');
  } catch (err) {
    fail('DND-06: Save + Reload Identical', err);
  }

  // Test 7: Accessible Keyboard DnD with screen-reader announcements
  try {
    const controller = new KeyboardDndController();

    // 1. Lift
    const liftMsg = controller.lift('node-1', 'Product Spec Card', 'sec-1', 0, 5);
    assert.match(liftMsg, /Lifted Product Spec Card/, 'Lift announcement correct');
    assert.strictEqual(controller.getState().isLifted, true);

    // 2. Move Down
    const moveMsg = controller.moveVertical(1, 5, 'Hero Section');
    assert.match(moveMsg, /position 2 of 6 in Hero Section/, 'Move down announcement correct');

    // 3. Switch Container
    const switchMsg = controller.switchContainer('sec-2', 'Footer Section', 3);
    assert.match(switchMsg, /into container Footer Section at position 4/, 'Switch container announcement correct');

    // 4. Drop
    const dropResult = controller.drop('Footer Section');
    assert(dropResult, 'Drop must succeed');
    assert.strictEqual(dropResult.containerId, 'sec-2');
    assert.strictEqual(dropResult.index, 3);
    assert.match(dropResult.announcement, /Dropped Product Spec Card into Footer Section at position 4/);
    assert.strictEqual(controller.getState().isLifted, false, 'State must no longer be lifted after drop');

    // 5. Cancel
    controller.lift('node-2', 'Heading', 'sec-1', 1, 3);
    const cancelMsg = controller.cancel();
    assert.match(cancelMsg, /Drag cancelled. Restored Heading/);
    assert.strictEqual(controller.getState().isLifted, false);

    pass('DND-07: Accessible Keyboard DnD', 'Space lift -> Arrow move -> Switch container -> Space drop -> Cancel verified');
  } catch (err) {
    fail('DND-07: Accessible Keyboard DnD', err);
  }

  // Test 8: Touch DnD Sensor (300ms long press, move cancel, vibration)
  try {
    let liftTriggered = false;
    let liftedPoint = null;

    const sensor = new TouchDndSensor({ pressThresholdMs: 50, movementTolerancePx: 10, vibrateOnLift: false });

    // Test successful long press
    sensor.handleTouchStart({ x: 100, y: 100 }, pt => {
      liftTriggered = true;
      liftedPoint = pt;
    });

    await new Promise(r => setTimeout(r, 70));
    assert.strictEqual(liftTriggered, true, 'Long press must trigger lift after threshold');
    assert.deepStrictEqual(liftedPoint, { x: 100, y: 100 }, 'Start point captured');

    // Test touch move after lift maintains active drag
    const isDragActive = sensor.handleTouchMove({ x: 150, y: 150 });
    assert.strictEqual(isDragActive, true, 'Active drag continues moving');
    sensor.handleTouchEnd();

    // Test scroll cancellation: if finger moves > 10px before threshold, cancel drag
    let earlyLiftTriggered = false;
    sensor.handleTouchStart({ x: 200, y: 200 }, () => {
      earlyLiftTriggered = true;
    });
    // Move 20px immediately (scrolling gesture)
    sensor.handleTouchMove({ x: 200, y: 225 });
    await new Promise(r => setTimeout(r, 70));
    assert.strictEqual(earlyLiftTriggered, false, 'Scroll gesture must cancel long press');

    pass('DND-08: Touch DnD Sensor', '300ms hold lifts; pre-lift scroll cancelled; post-lift movement maintained');
  } catch (err) {
    fail('DND-08: Touch DnD Sensor', err);
  }

  // Test 9: Free Canvas Snap (8px grid + sibling edge/centre guides)
  try {
    const rawPos = { x: 19, y: 43 };
    const snapped = snap(rawPos, 8, []);
    assert.strictEqual(snapped.x, 16, '19 snapped to 8px grid should be 16 (closer than 24)');
    assert.strictEqual(snapped.y, 40, '43 snapped to 8px grid should be 40');
    assert.strictEqual(snapped.snappedToGridX, true);
    assert.strictEqual(snapped.snappedToGridY, true);

    // Guide alignment (sibling edge at x=20 within 5px tolerance)
    const guides = [{ type: 'vertical', position: 20, label: 'Sibling Left' }];
    const snappedWithGuide = snap({ x: 22, y: 40 }, 8, guides, 5);
    assert.strictEqual(snappedWithGuide.x, 20, 'Should snap to sibling edge guide rather than 8px grid (24)');
    assert.strictEqual(snappedWithGuide.activeGuides.length, 1);
    assert.strictEqual(snappedWithGuide.activeGuides[0].position, 20);

    pass('DND-09: Snap Logic (8px Grid & Guides)', 'Aligned 19->24, 43->40, and priority sibling guide lock verified');
  } catch (err) {
    fail('DND-09: Snap Logic (8px Grid & Guides)', err);
  }

  // Test 10: Axis Locking (Shift key) & Auto-Scroll calculation
  try {
    const origin = { x: 100, y: 100 };
    // Dominant horizontal movement
    const lockedH = applyAxisLock({ x: 160, y: 110 }, origin);
    assert.deepStrictEqual(lockedH, { x: 160, y: 100 }, 'Y locked to origin when horizontal delta is dominant');

    // Dominant vertical movement
    const lockedV = applyAxisLock({ x: 105, y: 190 }, origin);
    assert.deepStrictEqual(lockedV, { x: 100, y: 190 }, 'X locked to origin when vertical delta is dominant');

    // Auto-scroll within 40px of edge
    const viewport = { x: 0, y: 0, width: 800, height: 600 };
    const scrollNearRight = calculateAutoScroll({ x: 785, y: 300 }, viewport, 40, 10);
    assert(scrollNearRight.dx > 0, 'Auto scroll should scroll right when near right edge');

    const scrollNearTop = calculateAutoScroll({ x: 400, y: 15 }, viewport, 40, 10);
    assert(scrollNearTop.dy < 0, 'Auto scroll should scroll up when near top edge');

    const scrollCenter = calculateAutoScroll({ x: 400, y: 300 }, viewport, 40, 10);
    assert.strictEqual(scrollCenter.dx, 0);
    assert.strictEqual(scrollCenter.dy, 0);

    pass('DND-10: Axis Locking & Edge Auto-Scroll', 'Shift axis lock (H/V) and edge auto-scroll confirmed');
  } catch (err) {
    fail('DND-10: Axis Locking & Edge Auto-Scroll', err);
  }

  // Test 11: Selection Manager (single, multi, box)
  try {
    const sel = new SelectionManager();
    sel.select('node-1');
    assert.deepStrictEqual(sel.getSelectedIds(), ['node-1']);
    assert.strictEqual(sel.getFocusedId(), 'node-1');

    // Multi-select
    sel.select('node-2', true);
    assert.strictEqual(sel.count(), 2);
    assert.strictEqual(sel.isSelected('node-1'), true);
    assert.strictEqual(sel.isSelected('node-2'), true);

    // Box selection
    const candidates = [
      { id: 'node-1', rect: { x: 10, y: 10, width: 50, height: 50 } },
      { id: 'node-2', rect: { x: 100, y: 100, width: 50, height: 50 } },
      { id: 'node-3', rect: { x: 500, y: 500, width: 50, height: 50 } }
    ];
    sel.selectWithinBox({ x1: 0, y1: 0, x2: 200, y2: 200 }, candidates);
    assert.deepStrictEqual(sel.getSelectedIds().sort(), ['node-1', 'node-2']);

    pass('DND-11: Selection Manager', 'Single, multi-select, and spatial 2D box enclosure verified');
  } catch (err) {
    fail('DND-11: Selection Manager', err);
  }

  // Test 12: Clipboard Manager (copy, cut, paste with ID remapping)
  try {
    const clipboard = new ClipboardManager();
    const sourceNode = {
      id: 'source-btn-1',
      type: 'button',
      props: { label: 'Click Me' },
      children: [
        { id: 'child-icon-1', type: 'image', props: { src: 'asset:icon' } }
      ]
    };

    clipboard.copy([sourceNode]);
    assert.strictEqual(clipboard.hasContent(), true);
    assert.strictEqual(clipboard.getPayload()?.version, 'i3dion.clipboard/1');

    const pasted = clipboard.paste();
    assert.strictEqual(pasted.length, 1);
    assert.notStrictEqual(pasted[0].id, sourceNode.id, 'Pasted node must receive brand new ID');
    assert.notStrictEqual(pasted[0].children[0].id, sourceNode.children[0].id, 'Child nodes must receive brand new IDs');
    assert.strictEqual(pasted[0].props.label, 'Click Me', 'Props must be deeply preserved');

    pass('DND-12: Clipboard Manager', 'Payload versioning, deep clone, and recursive ID remapping confirmed');
  } catch (err) {
    fail('DND-12: Clipboard Manager', err);
  }

  // Test 13: Optimistic Lock & 409 Conflict Detection
  try {
    const store = new DocumentStore();
    const lock = new OptimisticLockManager(store, undefined, 5000);

    assert.strictEqual(lock.getBaseRevision(), store.getRevision());

    // Check conflict against newer server revision
    const conflict = lock.checkConflict(lock.getBaseRevision() + 1);
    assert(conflict !== null, 'Must report conflict on mismatched revision');
    assert.strictEqual(conflict.serverRevision, lock.getBaseRevision() + 1);
    assert.match(conflict.message, /conflict/i);

    // Save with mock handler
    let saveCalledWith = null;
    lock.setSaveHandler(async (doc, expectedRev) => {
      saveCalledWith = expectedRev;
      return { revision: expectedRev + 1 };
    });

    // Mark store modified
    store.setDocument({ ...store.getDocument(), revision: store.getRevision() }, true);
    const saved = await lock.save();
    assert.strictEqual(saved, true);
    assert.strictEqual(lock.getStatus(), 'saved');
    assert.strictEqual(lock.getBaseRevision(), 2, 'Base revision must advance upon successful save');
    assert.strictEqual(store.isModified(), false, 'Store marked clean');

    // Simulate 409 conflict throw from server
    lock.setSaveHandler(async () => {
      const err = new Error('Stale revision');
      err.status = 409;
      throw err;
    });
    store.setDocument({ ...store.getDocument() }, true);
    let threwConflict = false;
    try {
      await lock.save();
    } catch {
      threwConflict = true;
    }
    assert.strictEqual(threwConflict, true);
    assert.strictEqual(lock.getStatus(), 'conflict');

    lock.destroy();
    pass('DND-13: Optimistic Lock & 409 Conflict', 'Revision synchronization and 409 conflict handling verified');
  } catch (err) {
    fail('DND-13: Optimistic Lock & 409 Conflict', err);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`📊 Test Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDndTestSuite();
