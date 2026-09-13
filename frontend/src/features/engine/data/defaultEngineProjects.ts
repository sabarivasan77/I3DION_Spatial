import { EngineProject } from '../types/engineTypes';

export const DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT: EngineProject = {
  id: 'proj_industrial_compressor_01',
  name: 'Industrial Compressor',
  description: 'High performance industrial compressor experience with interactive animations and AR views.',
  status: 'Draft',
  updatedAt: '2 minutes ago',
  thumbnailUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  sceneGraph: [
    {
      id: 'root_compressor',
      name: 'Industrial_Compressor',
      type: 'group',
      parent: null,
      visible: true,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_base',
      name: 'Base',
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      material: { color: '#334155', roughness: 0.4, metalness: 0.8 },
    },
    {
      id: 'node_motor',
      name: 'Motor',
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 1.25, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      material: { color: '#E94B4B', roughness: 0.3, metalness: 0.7 },
      activeAnimation: 'Motor_Start',
      animationClips: ['Motor_Start', 'Motor_Idle', 'Motor_Vibrate'],
    },
    {
      id: 'node_pump_housing',
      name: 'Pump_Housing',
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: -1.1, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      material: { color: '#475569', roughness: 0.5, metalness: 0.6 },
    },
    {
      id: 'node_rotor',
      name: 'Rotor',
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_inlet_pipe',
      name: 'Inlet_Pipe',
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: -1.5, y: 1.2, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_outlet_pipe',
      name: 'Outlet_Pipe',
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 1.5, y: 1.2, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_valve_group',
      name: 'Valve_Group',
      type: 'group',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 0, y: 1.8, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_bolts',
      name: 'Bolts',
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_frame',
      name: 'Frame',
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_cam_main',
      name: 'Camera_Main',
      type: 'camera',
      parent: null,
      visible: true,
      transform: { position: { x: 3, y: 2, z: 4 }, rotation: { x: -0.2, y: 0.6, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_light_key',
      name: 'Key_Light',
      type: 'light',
      parent: null,
      visible: true,
      transform: { position: { x: 5, y: 5, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_light_fill',
      name: 'Fill_Light',
      type: 'light',
      parent: null,
      visible: true,
      transform: { position: { x: -5, y: 3, z: -5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    }
  ],
  uiElements: [
    {
      id: 'ui_title',
      name: 'Title Text',
      type: 'text',
      content: 'Industrial Compressor',
      visible: true,
      style: { fontSize: '20px', color: '#0F172A' }
    },
    {
      id: 'btnStart',
      name: 'Play Animation Button',
      type: 'button',
      content: 'Play Animation',
      visible: true,
      onClickLogicId: 'logic_block_01'
    },
    {
      id: 'btnExplode',
      name: 'Explode View Button',
      type: 'button',
      content: 'Explode View',
      visible: true
    },
    {
      id: 'btnAR',
      name: 'AR View Button',
      type: 'button',
      content: 'AR View',
      visible: true
    },
    {
      id: 'btnQuote',
      name: 'Request Quote Button',
      type: 'button',
      content: 'Request Quote',
      visible: true
    }
  ],
  logicGraph: {
    nodes: [
      {
        id: 'node_event_click',
        type: 'on_click',
        category: 'events',
        title: 'On Click',
        position: { x: 100, y: 150 },
        inputs: [{ id: 'in_target', name: 'Target', type: 'string' }],
        outputs: [{ id: 'out_flow', name: 'Exec', type: 'flow' }],
        properties: { uiButton: 'btnStart' }
      },
      {
        id: 'node_find_obj',
        type: 'find_object',
        category: 'objects',
        title: 'Find Object',
        position: { x: 280, y: 150 },
        inputs: [
          { id: 'in_flow', name: 'Exec', type: 'flow' },
          { id: 'in_name', name: 'Name', type: 'string' }
        ],
        outputs: [
          { id: 'out_flow', name: 'Exec', type: 'flow' },
          { id: 'out_obj', name: 'Object', type: 'object' }
        ],
        properties: { name: 'Motor', scope: 'Scene' }
      },
      {
        id: 'node_play_anim',
        type: 'play_animation',
        category: 'actions',
        title: 'Play Animation',
        position: { x: 480, y: 150 },
        inputs: [
          { id: 'in_flow', name: 'Exec', type: 'flow' },
          { id: 'in_clip', name: 'Clip', type: 'string' }
        ],
        outputs: [
          { id: 'out_flow_1', name: 'Next', type: 'flow' },
          { id: 'out_flow_2', name: 'On Complete', type: 'flow' }
        ],
        properties: { clip: 'Motor_Start', loop: false, speed: 1.0 }
      },
      {
        id: 'node_set_var',
        type: 'set_variable',
        category: 'variables',
        title: 'Set Variable',
        position: { x: 720, y: 100 },
        inputs: [
          { id: 'in_flow', name: 'Exec', type: 'flow' },
          { id: 'in_val', name: 'Value', type: 'string' }
        ],
        outputs: [{ id: 'out_flow', name: 'Exec', type: 'flow' }],
        properties: { name: 'machineState', value: 'running' }
      },
      {
        id: 'node_show_ui',
        type: 'show_ui_panel',
        category: 'ui',
        title: 'Show UI Panel',
        position: { x: 720, y: 240 },
        inputs: [
          { id: 'in_flow', name: 'Exec', type: 'flow' },
          { id: 'in_panel', name: 'Panel', type: 'string' }
        ],
        outputs: [{ id: 'out_flow', name: 'Exec', type: 'flow' }],
        properties: { panel: 'statusPanel', visible: true }
      }
    ],
    connections: [
      { id: 'conn_1', fromNodeId: 'node_event_click', fromPortId: 'out_flow', toNodeId: 'node_find_obj', toPortId: 'in_flow' },
      { id: 'conn_2', fromNodeId: 'node_find_obj', fromPortId: 'out_flow', toNodeId: 'node_play_anim', toPortId: 'in_flow' },
      { id: 'conn_3', fromNodeId: 'node_play_anim', fromPortId: 'out_flow_1', toNodeId: 'node_set_var', toPortId: 'in_flow' },
      { id: 'conn_4', fromNodeId: 'node_play_anim', fromPortId: 'out_flow_2', toNodeId: 'node_show_ui', toPortId: 'in_flow' }
    ]
  },
  variables: [
    { id: 'var_1', name: 'machineState', type: 'string', value: 'idle' },
    { id: 'var_2', name: 'rpmSpeed', type: 'number', value: 0 },
    { id: 'var_3', name: 'isExploded', type: 'boolean', value: false }
  ],
  animations: [
    { id: 'anim_1', name: 'Motor_Start', duration: 3.5 },
    { id: 'anim_2', name: 'Explode_Sequence', duration: 5.0 },
    { id: 'anim_3', name: 'Valve_Rotation', duration: 2.0 }
  ]
};

export const INITIAL_PROJECT_TEMPLATES: EngineProject[] = [
  DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT,
  {
    id: 'proj_hvac_demo_02',
    name: 'HVAC Demo',
    description: 'Interactive commercial HVAC assembly with airflow simulation triggers.',
    status: 'Draft',
    updatedAt: '1 day ago',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    sceneGraph: [
      { id: 'hvac_root', name: 'HVAC_Unit', type: 'group', visible: true, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } }
    ],
    uiElements: [],
    logicGraph: { nodes: [], connections: [] },
    variables: [],
    animations: []
  },
  {
    id: 'proj_valve_assembly_03',
    name: 'Valve Assembly',
    description: 'High-pressure hydraulic valve inspection with X-Ray cutaway logic.',
    status: 'Published',
    updatedAt: '3 days ago',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    sceneGraph: [
      { id: 'valve_root', name: 'Valve_Main', type: 'group', visible: true, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } }
    ],
    uiElements: [],
    logicGraph: { nodes: [], connections: [] },
    variables: [],
    animations: []
  },
  {
    id: 'proj_factory_line_04',
    name: 'Factory Line',
    description: 'Automated robotic arm conveyor line with multi-station event triggers.',
    status: 'Draft',
    updatedAt: '5 days ago',
    thumbnailUrl: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80',
    sceneGraph: [
      { id: 'factory_root', name: 'Factory_Line', type: 'group', visible: true, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } }
    ],
    uiElements: [],
    logicGraph: { nodes: [], connections: [] },
    variables: [],
    animations: []
  }
];
