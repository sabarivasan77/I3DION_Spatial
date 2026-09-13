import { LogicNodeDefinition, NodeCategory } from '../types/logic';

class LogicNodeRegistryService {
  private registry: Map<string, LogicNodeDefinition> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // ─── 1. TRIGGERS (8 Nodes) ──────────────────────────────────────────────────
    this.register({
      type: 'widget_click',
      name: 'Widget Click',
      category: 'triggers',
      iconName: 'MousePointerClick',
      description: 'Fires flow when the selected OmniStudio widget is clicked.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [],
      outputPorts: [
        { id: 'flow_out', name: 'out', label: 'On Click', type: 'FLOW', direction: 'output' },
        { id: 'widget_ref', name: 'widget', label: 'Widget Reference', type: 'WIDGET', direction: 'output' },
      ],
      suggestedNextNodes: ['play_animation', 'show_widget', 'focus_object', 'set_text'],
      propertySchema: [
        { name: 'targetWidgetId', label: 'Source Widget', type: 'widget_picker', description: 'Select OmniStudio widget to attach click listener' },
      ],
    });

    this.register({
      type: 'widget_loaded',
      name: 'Widget Loaded',
      category: 'triggers',
      iconName: 'Sparkles',
      description: 'Fires when an OmniStudio widget mounts on the canvas.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [],
      outputPorts: [
        { id: 'flow_out', name: 'out', label: 'On Loaded', type: 'FLOW', direction: 'output' },
      ],
      suggestedNextNodes: ['show_widget', 'set_text'],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'model_loaded',
      name: '3D Model Loaded',
      category: 'triggers',
      iconName: 'Box',
      description: 'Fires when the Three.js 3D model finishes downloading.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [],
      outputPorts: [
        { id: 'flow_out', name: 'out', label: 'On Model Loaded', type: 'FLOW', direction: 'output' },
        { id: 'model_ref', name: 'model', label: '3D Model Target', type: 'WIDGET', direction: 'output' },
      ],
      suggestedNextNodes: ['play_animation', 'set_camera'],
      propertySchema: [{ name: 'targetWidgetId', label: '3D Viewer Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'model_object_selected',
      name: 'Model Mesh Clicked',
      category: 'triggers',
      iconName: 'MousePointer',
      description: 'Fires when a specific 3D mesh object is clicked inside the model.',
      version: 1,
      defaultProperties: { targetWidgetId: '', objectId: '' },
      inputPorts: [],
      outputPorts: [
        { id: 'flow_out', name: 'out', label: 'On Object Clicked', type: 'FLOW', direction: 'output' },
        { id: 'object_ref', name: 'object', label: 'Object ID', type: 'OBJECT', direction: 'output' },
      ],
      suggestedNextNodes: ['focus_object', 'open_hotspot', 'show_widget'],
      propertySchema: [
        { name: 'targetWidgetId', label: '3D Viewer Widget', type: 'widget_picker' },
        { name: 'objectId', label: 'Target 3D Object ID', type: '3d_object_picker' },
      ],
    });

    this.register({
      type: 'hotspot_click',
      name: 'Hotspot Clicked',
      category: 'triggers',
      iconName: 'MapPin',
      description: 'Fires when a spatial hotspot pin is selected.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [],
      outputPorts: [
        { id: 'flow_out', name: 'out', label: 'On Hotspot Click', type: 'FLOW', direction: 'output' },
      ],
      suggestedNextNodes: ['focus_object', 'open_hotspot'],
      propertySchema: [{ name: 'targetWidgetId', label: 'Hotspot Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'video_play',
      name: 'Video Play',
      category: 'triggers',
      iconName: 'Play',
      description: 'Fires when a media video begins playback.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'On Play', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Video Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'video_ended',
      name: 'Video Ended',
      category: 'triggers',
      iconName: 'CheckCircle2',
      description: 'Fires when video media finishes playing.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'On Ended', type: 'FLOW', direction: 'output' }],
      suggestedNextNodes: ['show_widget', 'play_animation'],
      propertySchema: [{ name: 'targetWidgetId', label: 'Video Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'form_submitted',
      name: 'Form Submitted',
      category: 'triggers',
      iconName: 'Send',
      description: 'Fires when a lead capture form is submitted by the user.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [],
      outputPorts: [
        { id: 'flow_out', name: 'out', label: 'On Submit', type: 'FLOW', direction: 'output' },
      ],
      suggestedNextNodes: ['show_widget', 'set_text'],
      propertySchema: [{ name: 'targetWidgetId', label: 'Form Container', type: 'widget_picker' }],
    });

    // ─── 2. LOGIC (5 Nodes) ────────────────────────────────────────────────────
    this.register({
      type: 'sequence',
      name: 'Sequence',
      category: 'logic',
      iconName: 'ListOrdered',
      description: 'Executes multiple output flow paths in sequential order.',
      version: 1,
      defaultProperties: {},
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [
        { id: 'flow_out_1', name: 'then_1', label: 'Then 1', type: 'FLOW', direction: 'output' },
        { id: 'flow_out_2', name: 'then_2', label: 'Then 2', type: 'FLOW', direction: 'output' },
      ],
    });

    this.register({
      type: 'delay',
      name: 'Delay',
      category: 'logic',
      iconName: 'Clock',
      description: 'Pauses execution flow for a specified duration in seconds.',
      version: 1,
      defaultProperties: { durationSeconds: 2 },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'After Delay', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'durationSeconds', label: 'Duration (Seconds)', type: 'number', default: 2 }],
    });

    this.register({
      type: 'branch',
      name: 'Branch (If/Else)',
      category: 'logic',
      iconName: 'GitFork',
      description: 'Splits flow based on a boolean condition input.',
      version: 1,
      defaultProperties: {},
      inputPorts: [
        { id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' },
        { id: 'condition_in', name: 'condition', label: 'Condition', type: 'BOOLEAN', direction: 'input' },
      ],
      outputPorts: [
        { id: 'flow_true', name: 'true', label: 'True', type: 'FLOW', direction: 'output' },
        { id: 'flow_false', name: 'false', label: 'False', type: 'FLOW', direction: 'output' },
      ],
    });

    this.register({
      type: 'set_variable',
      name: 'Set Variable',
      category: 'logic',
      iconName: 'Database',
      description: 'Stores a value into a named global variable.',
      version: 1,
      defaultProperties: { varName: 'userScore', value: '10' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'varName', label: 'Variable Name', type: 'text', default: 'myVar' },
        { name: 'value', label: 'Value', type: 'text', default: '1' },
      ],
    });

    this.register({
      type: 'get_variable',
      name: 'Get Variable',
      category: 'logic',
      iconName: 'Database',
      description: 'Retrieves the value of a stored variable.',
      version: 1,
      defaultProperties: { varName: 'userScore' },
      inputPorts: [],
      outputPorts: [{ id: 'val_out', name: 'val', label: 'Value', type: 'ANY', direction: 'output' }],
      propertySchema: [{ name: 'varName', label: 'Variable Name', type: 'text', default: 'myVar' }],
    });

    // ─── 3. CONDITIONS (7 Nodes) ───────────────────────────────────────────────
    this.register({
      type: 'if',
      name: 'If Condition',
      category: 'conditions',
      iconName: 'HelpCircle',
      description: 'Evaluates boolean value input.',
      version: 1,
      defaultProperties: {},
      inputPorts: [{ id: 'val_in', name: 'val', label: 'Input Value', type: 'BOOLEAN', direction: 'input' }],
      outputPorts: [{ id: 'bool_out', name: 'result', label: 'Is Valid', type: 'BOOLEAN', direction: 'output' }],
    });

    this.register({
      type: 'equals',
      name: 'Equals (A == B)',
      category: 'conditions',
      iconName: 'Equal',
      description: 'Returns true if input A equals input B.',
      version: 1,
      defaultProperties: { valueA: '', valueB: '' },
      inputPorts: [
        { id: 'val_a', name: 'a', label: 'Value A', type: 'ANY', direction: 'input' },
        { id: 'val_b', name: 'b', label: 'Value B', type: 'ANY', direction: 'input' },
      ],
      outputPorts: [{ id: 'result', name: 'result', label: 'Result', type: 'BOOLEAN', direction: 'output' }],
    });

    this.register({
      type: 'not_equals',
      name: 'Not Equals (A != B)',
      category: 'conditions',
      iconName: 'Slash',
      description: 'Returns true if input A does not equal input B.',
      version: 1,
      defaultProperties: {},
      inputPorts: [
        { id: 'val_a', name: 'a', label: 'Value A', type: 'ANY', direction: 'input' },
        { id: 'val_b', name: 'b', label: 'Value B', type: 'ANY', direction: 'input' },
      ],
      outputPorts: [{ id: 'result', name: 'result', label: 'Result', type: 'BOOLEAN', direction: 'output' }],
    });

    this.register({
      type: 'greater_than',
      name: 'Greater Than (A > B)',
      category: 'conditions',
      iconName: 'ChevronRight',
      description: 'Returns true if numeric A is greater than B.',
      version: 1,
      defaultProperties: {},
      inputPorts: [
        { id: 'val_a', name: 'a', label: 'Number A', type: 'NUMBER', direction: 'input' },
        { id: 'val_b', name: 'b', label: 'Number B', type: 'NUMBER', direction: 'input' },
      ],
      outputPorts: [{ id: 'result', name: 'result', label: 'Result', type: 'BOOLEAN', direction: 'output' }],
    });

    this.register({
      type: 'less_than',
      name: 'Less Than (A < B)',
      category: 'conditions',
      iconName: 'ChevronLeft',
      description: 'Returns true if numeric A is less than B.',
      version: 1,
      defaultProperties: {},
      inputPorts: [
        { id: 'val_a', name: 'a', label: 'Number A', type: 'NUMBER', direction: 'input' },
        { id: 'val_b', name: 'b', label: 'Number B', type: 'NUMBER', direction: 'input' },
      ],
      outputPorts: [{ id: 'result', name: 'result', label: 'Result', type: 'BOOLEAN', direction: 'output' }],
    });

    this.register({
      type: 'is_true',
      name: 'Is True',
      category: 'conditions',
      iconName: 'Check',
      description: 'Checks if input evaluates to true.',
      version: 1,
      defaultProperties: {},
      inputPorts: [{ id: 'val_in', name: 'in', label: 'Value', type: 'ANY', direction: 'input' }],
      outputPorts: [{ id: 'result', name: 'result', label: 'Result', type: 'BOOLEAN', direction: 'output' }],
    });

    this.register({
      type: 'is_false',
      name: 'Is False',
      category: 'conditions',
      iconName: 'X',
      description: 'Checks if input evaluates to false.',
      version: 1,
      defaultProperties: {},
      inputPorts: [{ id: 'val_in', name: 'in', label: 'Value', type: 'ANY', direction: 'input' }],
      outputPorts: [{ id: 'result', name: 'result', label: 'Result', type: 'BOOLEAN', direction: 'output' }],
    });

    // ─── 4. ACTIONS (14 Nodes) ─────────────────────────────────────────────────
    this.register({
      type: 'show_widget',
      name: 'Show Widget',
      category: 'actions',
      iconName: 'Eye',
      description: 'Makes the target OmniStudio widget visible.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'hide_widget',
      name: 'Hide Widget',
      category: 'actions',
      iconName: 'EyeOff',
      description: 'Hides the target OmniStudio widget from view.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'toggle_visibility',
      name: 'Toggle Visibility',
      category: 'actions',
      iconName: 'RefreshCw',
      description: 'Toggles widget visibility between visible and hidden.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'set_text',
      name: 'Set Text',
      category: 'actions',
      iconName: 'Type',
      description: 'Dynamically updates text or heading widget content.',
      version: 1,
      defaultProperties: { targetWidgetId: '', newText: 'Updated Content' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'targetWidgetId', label: 'Target Text Widget', type: 'widget_picker' },
        { name: 'newText', label: 'New Text Content', type: 'text', default: 'Updated Content' },
      ],
    });

    this.register({
      type: 'play_animation',
      name: 'Play 3D Animation',
      category: '3d',
      iconName: 'Play',
      description: 'Triggers animation playback on a 3D Model Viewer widget.',
      version: 1,
      defaultProperties: { targetWidgetId: '', animationName: 'Open' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'targetWidgetId', label: 'Target 3D Viewer', type: 'widget_picker' },
        { name: 'animationName', label: 'Animation Sequence', type: 'text', default: 'Open' },
      ],
    });

    this.register({
      type: 'stop_animation',
      name: 'Stop 3D Animation',
      category: '3d',
      iconName: 'Square',
      description: 'Stops model animation playback.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target 3D Viewer', type: 'widget_picker' }],
    });

    this.register({
      type: 'pause_animation',
      name: 'Pause 3D Animation',
      category: '3d',
      iconName: 'Pause',
      description: 'Pauses model animation at current frame.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target 3D Viewer', type: 'widget_picker' }],
    });

    this.register({
      type: 'set_camera',
      name: 'Set Camera Angle',
      category: '3d',
      iconName: 'Camera',
      description: 'Smoothly transitions 3D camera to preset view angle.',
      version: 1,
      defaultProperties: { targetWidgetId: '', preset: 'Front' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'targetWidgetId', label: 'Target 3D Viewer', type: 'widget_picker' },
        {
          name: 'preset',
          label: 'Camera Angle Preset',
          type: 'select',
          options: [
            { label: 'Front', value: 'Front' },
            { label: 'Top', value: 'Top' },
            { label: 'Isometric', value: 'Isometric' },
            { label: 'Exploded View', value: 'Exploded' },
          ],
          default: 'Front',
        },
      ],
    });

    this.register({
      type: 'focus_object',
      name: 'Focus 3D Object',
      category: '3d',
      iconName: 'Maximize2',
      description: 'Zooms camera to focus on a specific sub-mesh object inside 3D model.',
      version: 1,
      defaultProperties: { targetWidgetId: '', objectId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'targetWidgetId', label: 'Target 3D Viewer', type: 'widget_picker' },
        { name: 'objectId', label: 'Sub-Mesh Object ID', type: '3d_object_picker' },
      ],
    });

    this.register({
      type: 'open_hotspot',
      name: 'Open Hotspot',
      category: '3d',
      iconName: 'MapPin',
      description: 'Highlights and expands a spatial hotspot detail card.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target Hotspot', type: 'widget_picker' }],
    });

    this.register({
      type: 'rotate_model',
      name: 'Rotate 3D Model',
      category: '3d',
      iconName: 'RotateCcw',
      description: 'Rotates 3D model around specified axis by degrees.',
      version: 1,
      defaultProperties: { targetWidgetId: '', axis: 'Y', degrees: 90 },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'targetWidgetId', label: 'Target 3D Viewer', type: 'widget_picker' },
        { name: 'axis', label: 'Rotation Axis', type: 'select', options: [{ label: 'X Axis', value: 'X' }, { label: 'Y Axis', value: 'Y' }, { label: 'Z Axis', value: 'Z' }], default: 'Y' },
        { name: 'degrees', label: 'Degrees', type: 'number', default: 90 },
      ],
    });

    this.register({
      type: 'set_model_position',
      name: 'Set 3D Position',
      category: '3d',
      iconName: 'Move',
      description: 'Sets 3D model X, Y, Z coordinates.',
      version: 1,
      defaultProperties: { targetWidgetId: '', posX: 0, posY: 0, posZ: 0 },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'targetWidgetId', label: 'Target 3D Viewer', type: 'widget_picker' },
        { name: 'posX', label: 'Position X', type: 'number', default: 0 },
        { name: 'posY', label: 'Position Y', type: 'number', default: 0 },
        { name: 'posZ', label: 'Position Z', type: 'number', default: 0 },
      ],
    });

    this.register({
      type: 'set_model_scale',
      name: 'Set 3D Scale',
      category: '3d',
      iconName: 'Maximize2',
      description: 'Sets 3D model uniform or axis scale factor.',
      version: 1,
      defaultProperties: { targetWidgetId: '', scaleFactor: 1.5 },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'targetWidgetId', label: 'Target 3D Viewer', type: 'widget_picker' },
        { name: 'scaleFactor', label: 'Scale Factor', type: 'number', default: 1.5 },
      ],
    });

    this.register({
      type: 'play_video',
      name: 'Play Video',
      category: 'actions',
      iconName: 'Play',
      description: 'Starts media video playback.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target Video Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'pause_video',
      name: 'Pause Video',
      category: 'actions',
      iconName: 'Pause',
      description: 'Pauses video player.',
      version: 1,
      defaultProperties: { targetWidgetId: '' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'targetWidgetId', label: 'Target Video Widget', type: 'widget_picker' }],
    });

    this.register({
      type: 'navigate',
      name: 'Navigate URL',
      category: 'actions',
      iconName: 'ExternalLink',
      description: 'Redirects browser to external URL or product experience.',
      version: 1,
      defaultProperties: { url: 'https://i3dion.com' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'url', label: 'Destination URL', type: 'text', default: 'https://i3dion.com' }],
    });

    this.register({
      type: 'action_set_variable',
      name: 'Modify Variable Action',
      category: 'actions',
      iconName: 'Database',
      description: 'Action node that sets a global variable value during flow execution.',
      version: 1,
      defaultProperties: { varName: 'userState', value: 'active' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [
        { name: 'varName', label: 'Variable Name', type: 'text', default: 'userState' },
        { name: 'value', label: 'New Value', type: 'text', default: 'active' },
      ],
    });

    this.register({
      type: 'start_timeline',
      name: 'Start Timeline',
      category: 'actions',
      iconName: 'Play',
      description: 'Triggers animation timeline playback.',
      version: 1,
      defaultProperties: {},
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
    });

    this.register({
      type: 'stop_timeline',
      name: 'Stop Timeline',
      category: 'actions',
      iconName: 'Square',
      description: 'Stops animation timeline playback.',
      version: 1,
      defaultProperties: {},
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
    });

    this.register({
      type: 'seek_timeline',
      name: 'Seek Timeline',
      category: 'actions',
      iconName: 'Clock',
      description: 'Seeks animation timeline to specified time in seconds.',
      version: 1,
      defaultProperties: { timeSeconds: 0 },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
      propertySchema: [{ name: 'timeSeconds', label: 'Seek Time (Seconds)', type: 'number', default: 0 }],
    });
  }

  public register(nodeDef: LogicNodeDefinition): void {
    this.registry.set(nodeDef.type, nodeDef);
  }

  public get(type: string): LogicNodeDefinition | undefined {
    return this.registry.get(type);
  }

  public has(type: string): boolean {
    return this.registry.has(type);
  }

  public getAll(): LogicNodeDefinition[] {
    return Array.from(this.registry.values());
  }

  public getByCategory(category: NodeCategory): LogicNodeDefinition[] {
    return this.getAll().filter((n) => n.category === category);
  }
}

export const logicNodeRegistry = new LogicNodeRegistryService();
