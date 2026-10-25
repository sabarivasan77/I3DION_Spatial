import { EngineProject } from '../types/engineTypes';

export const DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT: EngineProject = {
  id: 'proj_industrial_compressor_01',
  name: 'Industrial Compressor',
  description: 'High performance industrial rotary compressor experience with interactive telemetry, inspection hotspots, and WebXR inspection.',
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
      name: 'Vibration_Damping_Base',
      type: 'mesh',
      geometryType: 'cube',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 0, y: -0.8, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 3.2, y: 0.3, z: 1.8 } },
      material: { color: '#1E293B', roughness: 0.6, metalness: 0.8 },
    },
    {
      id: 'node_motor',
      name: 'Electric_Motor_Core',
      type: 'mesh',
      geometryType: 'cylinder',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 1.1, y: 0.2, z: 0 }, rotation: { x: 0, y: 0, z: 90 }, scale: { x: 0.9, y: 1.6, z: 0.9 } },
      material: { color: '#E94B4B', roughness: 0.3, metalness: 0.7 },
      activeAnimation: 'Motor_Start',
      animationClips: ['Motor_Start', 'Motor_Idle', 'Motor_Vibrate'],
    },
    {
      id: 'node_pump_housing',
      name: 'Compression_Chamber',
      type: 'mesh',
      geometryType: 'cylinder',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: -1.0, y: 0.2, z: 0 }, rotation: { x: 0, y: 0, z: 90 }, scale: { x: 1.0, y: 1.8, z: 1.0 } },
      material: { color: '#475569', roughness: 0.45, metalness: 0.65 },
    },
    {
      id: 'node_rotor',
      name: 'Twin_Screw_Rotor',
      type: 'mesh',
      geometryType: 'torus',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: -1.0, y: 0.2, z: 0 }, rotation: { x: 90, y: 0, z: 0 }, scale: { x: 0.65, y: 0.65, z: 0.65 } },
      material: { color: '#0EA5E9', roughness: 0.2, metalness: 0.9 },
    },
    {
      id: 'node_inlet_pipe',
      name: 'Air_Inlet_Filter_Manifold',
      type: 'mesh',
      geometryType: 'cylinder',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: -1.4, y: 1.4, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.35, y: 1.2, z: 0.35 } },
      material: { color: '#64748B', roughness: 0.4, metalness: 0.8 },
    },
    {
      id: 'node_outlet_pipe',
      name: 'Discharge_Exhaust_Flange',
      type: 'mesh',
      geometryType: 'cylinder',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 1.3, y: 1.3, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.3, y: 1.0, z: 0.3 } },
      material: { color: '#64748B', roughness: 0.4, metalness: 0.8 },
    },
    {
      id: 'node_valve_group',
      name: 'Pressure_Relief_Valve',
      type: 'mesh',
      geometryType: 'cone',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 0, y: 1.2, z: 0.6 }, rotation: { x: 180, y: 0, z: 0 }, scale: { x: 0.4, y: 0.7, z: 0.4 } },
      material: { color: '#F59E0B', roughness: 0.3, metalness: 0.85 },
    },
    {
      id: 'node_cam_main',
      name: 'Camera_Main',
      type: 'camera',
      parent: null,
      visible: true,
      transform: { position: { x: 3.5, y: 2.2, z: 4.5 }, rotation: { x: -0.2, y: 0.6, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'node_light_key',
      name: 'Key_Light',
      type: 'light',
      parent: null,
      visible: true,
      transform: { position: { x: 6, y: 8, z: 6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    }
  ],
  widgets: [
    {
      id: 'widget_hotspot_motor',
      title: '75 kW High-Torque Motor',
      type: 'hotspot',
      targetNodeId: 'node_motor',
      position: { x: 1.1, y: 0.9, z: 0 },
      content: 'Variable frequency permanent magnet electric motor driving direct helical coupling at 1,450 RPM.',
      config: { pulseColor: '#E94B4B', icon: 'zap' },
      enabled: true,
    },
    {
      id: 'widget_hotspot_rotor',
      title: 'Precision Twin Screw Rotor',
      type: 'hotspot',
      targetNodeId: 'node_rotor',
      position: { x: -1.0, y: 0.8, z: 0 },
      content: 'Asymmetric 5/6 lobe profile CNC-milled from forged chrome-moly steel alloy.',
      config: { pulseColor: '#0EA5E9', icon: 'rotate-cw' },
      enabled: true,
    },
    {
      id: 'widget_hotspot_valve',
      title: 'Safety Relief Valve',
      type: 'hotspot',
      targetNodeId: 'node_valve_group',
      position: { x: 0, y: 1.6, z: 0.6 },
      content: 'ASME Section VIII certified safety valve rated for 16.0 bar emergency venting.',
      config: { pulseColor: '#F59E0B', icon: 'shield-alert' },
      enabled: true,
    },
    {
      id: 'widget_info_card',
      title: 'Compressor Telemetry HUD',
      type: 'infocard',
      content: 'Status: Operating at 12.4 bar | Flow: 820 m³/h | Temp: 68.4°C | Oil: 98%',
      config: { position: 'top-right', collapsible: true, updateInterval: 2000 },
      enabled: true,
    },
    {
      id: 'widget_exploded_slider',
      title: 'Component Exploded View',
      type: 'exploded_slider',
      config: { maxDistance: 2.2, axis: 'x' },
      enabled: true,
    },
    {
      id: 'widget_variant_switcher',
      title: 'Industrial Colorway Variant',
      type: 'variant_switcher',
      config: {
        targetNodeIds: ['node_motor', 'node_pump_housing'],
        variants: [
          { name: 'I3DION Crimson', color: '#E94B4B' },
          { name: 'Titanium Graphite', color: '#334155' },
          { name: 'Cleanroom Cyan', color: '#0EA5E9' },
          { name: 'Safety Amber', color: '#D97706' }
        ]
      },
      enabled: true,
    },
    {
      id: 'widget_xr_launch',
      title: 'WebXR Spatial View',
      type: 'xr_button',
      config: { arLabel: 'Place in Real Space (AR)', vrLabel: 'Inspect in Virtual Reality (VR)' },
      enabled: true,
    }
  ],
  interactions: [
    {
      id: 'interact_hotspot_motor',
      name: 'Inspect Motor Hotspot',
      trigger: 'hotspot_click',
      targetNodeId: 'node_motor',
      action: 'open_info',
      parameters: { title: '75 kW Electric Drive Unit', text: 'Nominal efficiency: 96.2%, IP55 sealed enclosure.' },
      enabled: true,
    },
    {
      id: 'interact_hotspot_rotor',
      name: 'Inspect Rotor Hotspot',
      trigger: 'hotspot_click',
      targetNodeId: 'node_rotor',
      action: 'play_animation',
      parameters: { clip: 'Motor_Start', loop: true, speed: 1.0 },
      enabled: true,
    },
    {
      id: 'interact_toggle_valve',
      name: 'Inspect Relief Valve',
      trigger: 'click',
      targetNodeId: 'node_valve_group',
      action: 'change_material',
      parameters: { color: '#EF4444', roughness: 0.1, metalness: 0.9 },
      enabled: true,
    }
  ],
  codeFiles: {
    html: `<!-- I3DION Spatial Engine - Industrial Compressor Runtime HUD -->
<div id="spatial-hud" class="hud-container">
  <div class="hud-card">
    <div class="hud-badge"><span class="badge-dot"></span> LIVE TELEMETRY</div>
    <h2 class="hud-title">Rotary Screw Compressor C-75</h2>
    <div class="metrics-grid">
      <div class="metric-item">
        <span class="label">Discharge Pressure</span>
        <span class="value" id="val-pressure">12.4 <small>bar</small></span>
      </div>
      <div class="metric-item">
        <span class="label">Shaft Velocity</span>
        <span class="value" id="val-rpm">1,450 <small>RPM</small></span>
      </div>
      <div class="metric-item">
        <span class="label">Oil Temp</span>
        <span class="value" id="val-temp">68.2 <small>°C</small></span>
      </div>
    </div>
    <div class="hud-actions">
      <button id="btn-explode" class="action-btn">Explode Assembly</button>
      <button id="btn-xr" class="action-btn primary">Enter WebXR</button>
    </div>
  </div>
</div>`,
    css: `/* I3DION Engine Spatial HUD Styles */
.hud-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  pointer-events: none;
}
.hud-card {
  pointer-events: auto;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 18px;
  color: #F8FAFC;
  width: 290px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}
.hud-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #38BDF8;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px #10B981;
}
.hud-title {
  margin: 0 0 14px 0;
  font-size: 15px;
  font-weight: 600;
}
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.metric-item {
  background: rgba(255, 255, 255, 0.04);
  padding: 8px 10px;
  border-radius: 8px;
}
.metric-item .label {
  display: block;
  font-size: 11px;
  color: #94A3B8;
}
.metric-item .value {
  font-size: 14px;
  font-weight: 700;
  color: #FFFFFF;
}
.metric-item small {
  font-size: 10px;
  color: #64748B;
}
.hud-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}
.action-btn.primary {
  background: #E94B4B;
  border-color: #E94B4B;
}
.action-btn.primary:hover {
  background: #D43838;
}`,
    js: `// I3DION Spatial Runtime Controller
(function() {
  console.log('[I3DION Engine] Runtime initialized for Industrial Compressor.');
  let isExploded = false;

  const btnExplode = document.getElementById('btn-explode');
  if (btnExplode) {
    btnExplode.addEventListener('click', () => {
      isExploded = !isExploded;
      btnExplode.textContent = isExploded ? 'Assemble Model' : 'Explode Assembly';
      console.log('[I3DION Engine] Exploded view state:', isExploded);
      if (window.i3dion) {
        window.i3dion.setExploded(isExploded ? 1.0 : 0.0);
      }
    });
  }

  const btnXR = document.getElementById('btn-xr');
  if (btnXR) {
    btnXR.addEventListener('click', () => {
      console.log('[I3DION Engine] Requesting WebXR session...');
      if (window.i3dion && window.i3dion.launchXR) {
        window.i3dion.launchXR();
      } else {
        alert('WebXR session requested. Launching spatial immersive mode.');
      }
    });
  }

  // Periodic telemetry pulse
  setInterval(() => {
    const pEl = document.getElementById('val-pressure');
    if (pEl) {
      const p = (12.3 + Math.random() * 0.25).toFixed(1);
      pEl.innerHTML = p + ' <small>bar</small>';
    }
  }, 3000);
})();`
  },
  uiElements: [
    {
      id: 'ui_title',
      name: 'Title Text',
      type: 'text',
      content: 'Industrial Rotary Compressor C-75',
      visible: true,
      style: { fontSize: '20px', color: '#0F172A' }
    },
    {
      id: 'btnStart',
      name: 'Play Animation Button',
      type: 'button',
      content: 'Start Motor',
      visible: true,
      onClickLogicId: 'logic_block_01'
    },
    {
      id: 'btnExplode',
      name: 'Explode View Button',
      type: 'button',
      content: 'Exploded View',
      visible: true
    },
    {
      id: 'btnAR',
      name: 'AR View Button',
      type: 'button',
      content: 'WebXR Spatial View',
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
      }
    ],
    connections: [
      { id: 'conn_1', fromNodeId: 'node_event_click', fromPortId: 'out_flow', toNodeId: 'node_find_obj', toPortId: 'in_flow' },
      { id: 'conn_2', fromNodeId: 'node_find_obj', fromPortId: 'out_flow', toNodeId: 'node_play_anim', toPortId: 'in_flow' }
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

export const DEFAULT_MECHANICAL_ASSEMBLY_PROJECT: EngineProject = {
  id: 'proj_mechanical_gearbox_02',
  name: 'Interactive Mechanical Gearbox Assembly',
  description: 'Multi-stage helical industrial reduction gearbox featuring parent/child kinematics, component inspection hotspots, and 3:1 torque reduction.',
  status: 'Published',
  updatedAt: '10 minutes ago',
  thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  sceneGraph: [
    {
      id: 'gearbox_root',
      name: 'Gearbox_Assembly_Root',
      type: 'group',
      parent: null,
      visible: true,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    },
    {
      id: 'gearbox_casing_lower',
      name: 'Lower_Casing_Sump',
      type: 'mesh',
      geometryType: 'cube',
      parent: 'gearbox_root',
      visible: true,
      transform: { position: { x: 0, y: -0.6, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 3.4, y: 0.8, z: 2.2 } },
      material: { color: '#334155', roughness: 0.4, metalness: 0.8 },
    },
    {
      id: 'gearbox_casing_upper',
      name: 'Upper_Housing_Cover',
      type: 'mesh',
      geometryType: 'cube',
      parent: 'gearbox_root',
      visible: true,
      transform: { position: { x: 0, y: 0.6, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 3.2, y: 0.7, z: 2.0 } },
      material: { color: '#475569', roughness: 0.45, metalness: 0.75 },
    },
    {
      id: 'shaft_input',
      name: 'Input_Drive_Shaft',
      type: 'mesh',
      geometryType: 'cylinder',
      parent: 'gearbox_root',
      visible: true,
      transform: { position: { x: -0.85, y: 0.05, z: 0 }, rotation: { x: 90, y: 0, z: 0 }, scale: { x: 0.35, y: 2.8, z: 0.35 } },
      material: { color: '#94A3B8', roughness: 0.25, metalness: 0.9 },
    },
    {
      id: 'gear_pinion',
      name: 'Helical_Drive_Pinion_24T',
      type: 'mesh',
      geometryType: 'cylinder',
      parent: 'gearbox_root',
      visible: true,
      transform: { position: { x: -0.85, y: 0.05, z: 0 }, rotation: { x: 90, y: 0, z: 0 }, scale: { x: 0.85, y: 0.75, z: 0.85 } },
      material: { color: '#E94B4B', roughness: 0.3, metalness: 0.85 },
    },
    {
      id: 'shaft_output',
      name: 'Output_Driven_Shaft',
      type: 'mesh',
      geometryType: 'cylinder',
      parent: 'gearbox_root',
      visible: true,
      transform: { position: { x: 0.85, y: 0.05, z: 0 }, rotation: { x: 90, y: 0, z: 0 }, scale: { x: 0.5, y: 2.8, z: 0.5 } },
      material: { color: '#94A3B8', roughness: 0.25, metalness: 0.9 },
    },
    {
      id: 'gear_spur',
      name: 'Helical_Bull_Gear_72T',
      type: 'mesh',
      geometryType: 'cylinder',
      parent: 'gearbox_root',
      visible: true,
      transform: { position: { x: 0.85, y: 0.05, z: 0 }, rotation: { x: 90, y: 0, z: 0 }, scale: { x: 1.5, y: 0.75, z: 1.5 } },
      material: { color: '#3B82F6', roughness: 0.3, metalness: 0.85 },
    },
    {
      id: 'bearings_pack',
      name: 'Tapered_Roller_Bearings',
      type: 'mesh',
      geometryType: 'torus',
      parent: 'gearbox_root',
      visible: true,
      transform: { position: { x: -0.85, y: 0.05, z: 1.1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.55, y: 0.55, z: 0.55 } },
      material: { color: '#F59E0B', roughness: 0.15, metalness: 0.95 },
    },
    {
      id: 'plug_inspection',
      name: 'Magnetic_Drain_Plug',
      type: 'mesh',
      geometryType: 'sphere',
      parent: 'gearbox_root',
      visible: true,
      transform: { position: { x: 0, y: -0.9, z: 1.1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.25, y: 0.25, z: 0.25 } },
      material: { color: '#10B981', roughness: 0.3, metalness: 0.8 },
    }
  ],
  widgets: [
    {
      id: 'widget_hotspot_pinion',
      title: 'Drive Pinion (24 Teeth)',
      type: 'hotspot',
      targetNodeId: 'gear_pinion',
      position: { x: -0.85, y: 0.7, z: 0 },
      content: 'Case-hardened 18CrNiMo7-6 steel pinion with 20° pressure angle and 15° helix angle.',
      config: { pulseColor: '#E94B4B', icon: 'settings' },
      enabled: true,
    },
    {
      id: 'widget_hotspot_gear',
      title: 'Bull Gear (72 Teeth - 3:1 Ratio)',
      type: 'hotspot',
      targetNodeId: 'gear_spur',
      position: { x: 0.85, y: 1.2, z: 0 },
      content: 'Precision ground bull gear delivering 3:1 speed reduction and 850 Nm torque multiplication.',
      config: { pulseColor: '#3B82F6', icon: 'disc' },
      enabled: true,
    },
    {
      id: 'widget_hotspot_bearing',
      title: 'Tapered Roller Bearing Pack',
      type: 'hotspot',
      targetNodeId: 'bearings_pack',
      position: { x: -0.85, y: 0.6, z: 1.1 },
      content: 'Dual opposing roller bearings carrying combined radial loads and axial thrust forces.',
      config: { pulseColor: '#F59E0B', icon: 'circle-dot' },
      enabled: true,
    },
    {
      id: 'widget_gearbox_info',
      title: 'Mechanical Drivetrain Specifications',
      type: 'infocard',
      content: 'Ratio: 3.0:1 | Max Input: 3,000 RPM | Output Torque: 850 Nm | Efficiency: 98.4%',
      config: { position: 'top-right', collapsible: true },
      enabled: true,
    },
    {
      id: 'widget_gearbox_exploded',
      title: 'Assembly Cutaway & Explode',
      type: 'exploded_slider',
      config: { maxDistance: 2.5, axis: 'y' },
      enabled: true,
    },
    {
      id: 'widget_gearbox_variant',
      title: 'Alloy Surface Finish',
      type: 'variant_switcher',
      config: {
        targetNodeIds: ['gear_pinion', 'gear_spur'],
        variants: [
          { name: 'Industrial Red / Blue', color: '#E94B4B' },
          { name: 'Nitrided Titanium', color: '#64748B' },
          { name: 'Phosphated Bronze', color: '#B45309' }
        ]
      },
      enabled: true,
    }
  ],
  interactions: [
    {
      id: 'interact_pinion_click',
      name: 'Pinion Inspection',
      trigger: 'hotspot_click',
      targetNodeId: 'gear_pinion',
      action: 'open_info',
      parameters: { title: 'High-Speed Pinion', text: 'Tooth root stress safety factor: 1.85 under full load.' },
      enabled: true,
    },
    {
      id: 'interact_toggle_cover',
      name: 'Toggle Upper Casing Visibility',
      trigger: 'click',
      targetNodeId: 'gearbox_casing_upper',
      action: 'show_hide',
      parameters: { toggle: true },
      enabled: true,
    }
  ],
  codeFiles: {
    html: `<!-- I3DION Spatial Engine - Gearbox Mechanical Inspection HUD -->
<div id="gearbox-hud" class="hud-container">
  <div class="hud-card">
    <div class="hud-badge"><span class="badge-dot"></span> KINEMATICS READY</div>
    <h2 class="hud-title">Helical Reduction Gearbox GB-300</h2>
    <div class="metrics-grid">
      <div class="metric-item">
        <span class="label">Reduction Ratio</span>
        <span class="value">3.00 : 1</span>
      </div>
      <div class="metric-item">
        <span class="label">Max Torque</span>
        <span class="value">850 <small>Nm</small></span>
      </div>
      <div class="metric-item">
        <span class="label">Mesh Efficiency</span>
        <span class="value">98.4 <small>%</small></span>
      </div>
      <div class="metric-item">
        <span class="label">Sump Temp</span>
        <span class="value" id="val-sump">58.4 <small>°C</small></span>
      </div>
    </div>
    <div class="hud-actions">
      <button id="btn-cutaway" class="action-btn">Toggle Cutaway</button>
      <button id="btn-xr" class="action-btn primary">Spatial WebXR</button>
    </div>
  </div>
</div>`,
    css: `/* Gearbox HUD Styles */
.hud-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  pointer-events: none;
}
.hud-card {
  pointer-events: auto;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 18px;
  color: #F8FAFC;
  width: 290px;
}
.hud-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #38BDF8;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38BDF8;
  box-shadow: 0 0 8px #38BDF8;
}
.hud-title {
  margin: 0 0 14px 0;
  font-size: 15px;
  font-weight: 600;
}
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.metric-item {
  background: rgba(255, 255, 255, 0.04);
  padding: 8px 10px;
  border-radius: 8px;
}
.metric-item .label {
  display: block;
  font-size: 11px;
  color: #94A3B8;
}
.metric-item .value {
  font-size: 14px;
  font-weight: 700;
  color: #FFFFFF;
}
.metric-item small {
  font-size: 10px;
  color: #64748B;
}
.hud-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}
.action-btn.primary {
  background: #E94B4B;
  border-color: #E94B4B;
}
.action-btn.primary:hover {
  background: #D43838;
}`,
    js: `// Gearbox Kinematics Controller
(function() {
  console.log('[I3DION Engine] Runtime initialized for Mechanical Gearbox.');
  let cutaway = false;

  const btnCutaway = document.getElementById('btn-cutaway');
  if (btnCutaway) {
    btnCutaway.addEventListener('click', () => {
      cutaway = !cutaway;
      btnCutaway.textContent = cutaway ? 'Show Casing' : 'Toggle Cutaway';
      if (window.i3dion) {
        window.i3dion.toggleVisibility('gearbox_casing_upper');
      }
    });
  }
})();`
  },
  uiElements: [
    {
      id: 'ui_gearbox_title',
      name: 'Gearbox Title',
      type: 'text',
      content: 'Helical Reduction Gearbox GB-300',
      visible: true,
      style: { fontSize: '20px', color: '#0F172A' }
    }
  ],
  logicGraph: {
    nodes: [],
    connections: []
  },
  variables: [
    { id: 'var_ratio', name: 'reductionRatio', type: 'number', value: 3.0 },
    { id: 'var_torque', name: 'outputTorque', type: 'number', value: 850 }
  ],
  animations: [
    { id: 'anim_mesh', name: 'Gear_Mesh_Rotation', duration: 4.0 }
  ]
};

export const INITIAL_PROJECT_TEMPLATES: EngineProject[] = [
  DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT,
  DEFAULT_MECHANICAL_ASSEMBLY_PROJECT
];

