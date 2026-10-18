/**
 * Omni Engine Circuits Compiler & 70-Chip Catalog (Phase P8)
 * Implements visual 3D scripting compilation, Kahn DAG validation,
 * cycle/recursion guards, size caps, and deterministic Circuit IR generation.
 */

// Comprehensive catalog of ~70 chips across 5 domains
export const CHIP_CATALOG = {
  // 1. EVENT CHIPS (14)
  'on_object_click': { category: 'events', name: 'On Object Click', inputs: [], outputs: ['exec', 'objectId'] },
  'on_hotspot_click': { category: 'events', name: 'On Hotspot Click', inputs: [], outputs: ['exec', 'hotspotId'] },
  'on_scene_loaded': { category: 'events', name: 'On Scene Loaded', inputs: [], outputs: ['exec'] },
  'on_animation_end': { category: 'events', name: 'On Animation End', inputs: [], outputs: ['exec', 'clipName'] },
  'on_ar_launch': { category: 'events', name: 'On AR Launch', inputs: [], outputs: ['exec', 'tier'] },
  'on_variant_change': { category: 'events', name: 'On Variant Change', inputs: [], outputs: ['exec', 'variantId'] },
  'on_timer_tick': { category: 'events', name: 'On Timer Tick', inputs: [], outputs: ['exec'] },
  'on_pointer_enter': { category: 'events', name: 'On Pointer Enter', inputs: [], outputs: ['exec', 'objectId'] },
  'on_pointer_leave': { category: 'events', name: 'On Pointer Leave', inputs: [], outputs: ['exec', 'objectId'] },
  'on_camera_move': { category: 'events', name: 'On Camera Move', inputs: [], outputs: ['exec', 'position'] },
  'on_proximity': { category: 'events', name: 'On Proximity', inputs: [], outputs: ['exec', 'distance'] },
  'on_exploded_change': { category: 'events', name: 'On Exploded Change', inputs: [], outputs: ['exec', 'factor'] },
  'on_blueprint_toggle': { category: 'events', name: 'On Blueprint Toggle', inputs: [], outputs: ['exec', 'enabled'] },
  'on_qr_scanned': { category: 'events', name: 'On QR Scanned', inputs: [], outputs: ['exec', 'campaign'] },

  // 2. ACTION CHIPS (20)
  'play_animation': { category: 'actions', name: 'Play Animation', inputs: ['exec', 'clipName', 'speed'], outputs: ['exec'] },
  'stop_animation': { category: 'actions', name: 'Stop Animation', inputs: ['exec'], outputs: ['exec'] },
  'pause_animation': { category: 'actions', name: 'Pause Animation', inputs: ['exec'], outputs: ['exec'] },
  'set_material': { category: 'actions', name: 'Set Material', inputs: ['exec', 'objectId', 'color', 'roughness'], outputs: ['exec'] },
  'set_variant': { category: 'actions', name: 'Set Variant', inputs: ['exec', 'variantId'], outputs: ['exec'] },
  'show_part': { category: 'actions', name: 'Show Part', inputs: ['exec', 'objectId'], outputs: ['exec'] },
  'hide_part': { category: 'actions', name: 'Hide Part', inputs: ['exec', 'objectId'], outputs: ['exec'] },
  'toggle_part_visibility': { category: 'actions', name: 'Toggle Part Visibility', inputs: ['exec', 'objectId'], outputs: ['exec'] },
  'explode_view': { category: 'actions', name: 'Explode View', inputs: ['exec', 'factor', 'duration'], outputs: ['exec'] },
  'collapse_view': { category: 'actions', name: 'Collapse View', inputs: ['exec', 'duration'], outputs: ['exec'] },
  'focus_camera': { category: 'actions', name: 'Focus Camera', inputs: ['exec', 'targetId', 'distance'], outputs: ['exec'] },
  'reset_camera': { category: 'actions', name: 'Reset Camera', inputs: ['exec'], outputs: ['exec'] },
  'rotate_object': { category: 'actions', name: 'Rotate Object', inputs: ['exec', 'objectId', 'angles'], outputs: ['exec'] },
  'move_object': { category: 'actions', name: 'Move Object', inputs: ['exec', 'objectId', 'position'], outputs: ['exec'] },
  'scale_object': { category: 'actions', name: 'Scale Object', inputs: ['exec', 'objectId', 'scale'], outputs: ['exec'] },
  'show_spec_card': { category: 'actions', name: 'Show Spec Card', inputs: ['exec', 'title', 'specs'], outputs: ['exec'] },
  'hide_spec_card': { category: 'actions', name: 'Hide Spec Card', inputs: ['exec'], outputs: ['exec'] },
  'highlight_part': { category: 'actions', name: 'Highlight Part', inputs: ['exec', 'objectId', 'color'], outputs: ['exec'] },
  'set_light_intensity': { category: 'actions', name: 'Set Light Intensity', inputs: ['exec', 'intensity'], outputs: ['exec'] },
  'set_environment_preset': { category: 'actions', name: 'Set Environment Preset', inputs: ['exec', 'preset'], outputs: ['exec'] },

  // 3. ECOSYSTEM CHIPS (12)
  'submit_lead': { category: 'ecosystem', name: 'Submit Lead', inputs: ['exec', 'name', 'email', 'phone', 'notes'], outputs: ['exec', 'leadId'] },
  'track_event': { category: 'ecosystem', name: 'Track Event', inputs: ['exec', 'eventName', 'payload'], outputs: ['exec'] },
  'emit_flow_event': { category: 'ecosystem', name: 'Emit Flow Event', inputs: ['exec', 'eventType', 'data'], outputs: ['exec'] },
  'add_to_quote': { category: 'ecosystem', name: 'Add to Quote Basket', inputs: ['exec', 'productId', 'quantity'], outputs: ['exec'] },
  'show_quote_modal': { category: 'ecosystem', name: 'Show Quote Modal', inputs: ['exec'], outputs: ['exec'] },
  'open_url': { category: 'ecosystem', name: 'Open URL', inputs: ['exec', 'url', 'target'], outputs: ['exec'] },
  'show_toast': { category: 'ecosystem', name: 'Show Toast Message', inputs: ['exec', 'message', 'type'], outputs: ['exec'] },
  'download_pdf': { category: 'ecosystem', name: 'Download PDF Catalog', inputs: ['exec', 'catalogId'], outputs: ['exec'] },
  'share_whatsapp': { category: 'ecosystem', name: 'Share on WhatsApp', inputs: ['exec', 'phone', 'text'], outputs: ['exec'] },
  'trigger_webhook': { category: 'ecosystem', name: 'Trigger Webhook', inputs: ['exec', 'endpoint', 'payload'], outputs: ['exec'] },
  'launch_ar': { category: 'ecosystem', name: 'Launch AR Mode', inputs: ['exec'], outputs: ['exec'] },
  'change_language': { category: 'ecosystem', name: 'Change Language', inputs: ['exec', 'langCode'], outputs: ['exec'] },

  // 4. LOGIC CHIPS (14)
  'branch': { category: 'logic', name: 'Branch (If / Else)', inputs: ['exec', 'condition'], outputs: ['trueExec', 'falseExec'] },
  'compare_numbers': { category: 'logic', name: 'Compare Numbers', inputs: ['a', 'b', 'operator'], outputs: ['result'] },
  'compare_strings': { category: 'logic', name: 'Compare Strings', inputs: ['a', 'b'], outputs: ['isEqual'] },
  'and_gate': { category: 'logic', name: 'AND Gate', inputs: ['a', 'b'], outputs: ['result'] },
  'or_gate': { category: 'logic', name: 'OR Gate', inputs: ['a', 'b'], outputs: ['result'] },
  'not_gate': { category: 'logic', name: 'NOT Gate', inputs: ['a'], outputs: ['result'] },
  'delay': { category: 'logic', name: 'Delay (Timer)', inputs: ['exec', 'seconds'], outputs: ['exec'] },
  'debounce': { category: 'logic', name: 'Debounce', inputs: ['exec', 'ms'], outputs: ['exec'] },
  'counter': { category: 'logic', name: 'Counter', inputs: ['exec', 'increment'], outputs: ['exec', 'current'] },
  'clamp_number': { category: 'logic', name: 'Clamp Number', inputs: ['value', 'min', 'max'], outputs: ['result'] },
  'math_op': { category: 'logic', name: 'Math Operation', inputs: ['a', 'b', 'operator'], outputs: ['result'] },
  'random_number': { category: 'logic', name: 'Random Number', inputs: ['min', 'max'], outputs: ['result'] },
  'switch_case': { category: 'logic', name: 'Switch Case', inputs: ['exec', 'value'], outputs: ['case1', 'case2', 'default'] },
  'lerp_vector': { category: 'logic', name: 'Lerp Vector', inputs: ['start', 'end', 'alpha'], outputs: ['result'] },

  // 5. VARIABLE CHIPS (10)
  'get_variable': { category: 'variables', name: 'Get Variable', inputs: ['varName'], outputs: ['value'] },
  'set_variable': { category: 'variables', name: 'Set Variable', inputs: ['exec', 'varName', 'value'], outputs: ['exec'] },
  'toggle_boolean': { category: 'variables', name: 'Toggle Boolean', inputs: ['exec', 'varName'], outputs: ['exec', 'newValue'] },
  'increment_number': { category: 'variables', name: 'Increment Number', inputs: ['exec', 'varName', 'amount'], outputs: ['exec', 'newValue'] },
  'append_string': { category: 'variables', name: 'Append String', inputs: ['a', 'b'], outputs: ['result'] },
  'vector_split': { category: 'variables', name: 'Vector3 Split', inputs: ['vector'], outputs: ['x', 'y', 'z'] },
  'vector_compose': { category: 'variables', name: 'Vector3 Compose', inputs: ['x', 'y', 'z'], outputs: ['vector'] },
  'object_ref': { category: 'variables', name: 'Object Reference', inputs: ['objectId'], outputs: ['ref'] },
  'color_value': { category: 'variables', name: 'Color Value', inputs: ['hex'], outputs: ['color'] },
  'constant_value': { category: 'variables', name: 'Constant Value', inputs: ['value'], outputs: ['out'] }
};

export const TOTAL_REGISTERED_CHIPS = Object.keys(CHIP_CATALOG).length; // 70 chips

/**
 * Validate and compile a Circuits visual graph into deterministic Circuit IR
 * Enforces Kahn DAG topological sorting, cycle detection, and complexity limits.
 * 
 * @param {Object} graph - { nodes: Array, edges: Array }
 * @returns {Object} Compiled Circuit IR
 */
export function compileCircuitGraph(graph = {}) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  // 1. Guard against DoS / excessive complexity
  if (nodes.length > 500) {
    throw new Error(`Circuit exceeds maximum allowable complexity: ${nodes.length} nodes (500 limit).`);
  }

  // 2. Validate node chips against catalog
  const nodeMap = new Map();
  for (const node of nodes) {
    if (!node.id || !node.chipId) {
      throw new Error(`Invalid circuit node: missing id or chipId`);
    }
    const chipDef = CHIP_CATALOG[node.chipId];
    if (!chipDef) {
      throw new Error(`Unknown circuit chip: "${node.chipId}"`);
    }
    nodeMap.set(node.id, {
      ...node,
      def: chipDef,
      inputs: [],
      outputs: []
    });
  }

  // 3. Build adjacency list & compute in-degrees for Kahn DAG validation
  const inDegree = new Map();
  const adjList = new Map();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      throw new Error(`Edge references non-existent node: ${edge.source} -> ${edge.target}`);
    }
    adjList.get(edge.source).push(edge.target);
    inDegree.set(edge.target, inDegree.get(edge.target) + 1);
  }

  // 4. Kahn Topological Sort: cycle detection
  const queue = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const sorted = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    sorted.push(curr);

    for (const neighbor of adjList.get(curr)) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Circuit compilation failed: circular loop / cycle detected in circuit graph.');
  }

  // 5. Generate Intermediate Representation (IR)
  const entrypoints = {};
  const instructions = {};

  for (const node of nodes) {
    const chipDef = CHIP_CATALOG[node.chipId];
    const nextSteps = adjList.get(node.id) || [];

    instructions[node.id] = {
      chipId: node.chipId,
      category: chipDef.category,
      params: node.params || {},
      nextSteps
    };

    if (chipDef.category === 'events') {
      const triggerKey = node.params?.targetId 
        ? `${node.chipId}:${node.params.targetId}`
        : node.chipId;

      if (!entrypoints[triggerKey]) entrypoints[triggerKey] = [];
      entrypoints[triggerKey].push(node.id);
    }
  }

  return {
    version: '1.0',
    totalChips: nodes.length,
    entrypoints,
    instructions
  };
}
