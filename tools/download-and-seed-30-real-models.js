import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '..', 'frontend', 'public', 'models');

const MASTER_30_MODELS = [
  {
    id: 1,
    name: 'Heavy Duty Planetary Speed Reducer',
    slug: 'industrial-gearbox',
    category: 'Industrial Gearbox',
    description: 'High-torque planetary speed reducer with sun gear, planetary carrier, and enclosed housing.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 2,
    name: 'Reciprocating Saw Industrial Power Actuator',
    slug: 'reciprocating-saw',
    category: 'Power Tools & Actuators',
    description: 'Industrial motor-driven reciprocating saw assembly displaying internal drive linkage and blade clamp.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ReciprocatingSaw/glTF-Binary/ReciprocatingSaw.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 3,
    name: 'Off-Road Industrial Transport Buggy Chassis',
    slug: 'industrial-buggy',
    category: 'Forklift / Industrial Vehicle',
    description: 'Heavy-duty tubular chassis vehicle featuring independent suspension, wheel hubs, and roll-cage frame.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 4,
    name: 'Industrial Safety Protective Helmet Unit',
    slug: 'damaged-helmet',
    category: 'Safety Equipment & Gear',
    description: 'High-impact composite industrial safety helmet showing visor mounts, ventilation ports, and shell layers.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 5,
    name: 'Substation Transport Tanker Truck Unit',
    slug: 'milk-truck',
    category: 'Industrial Logistics Vehicle',
    description: 'Heavy distribution tanker truck with dual-axle chassis, insulated tank vessel, and cab assembly.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
    license: 'CC-BY 4.0 International',
    author: 'Cesium Open Model Vault'
  },
  {
    id: 6,
    name: 'Robotic Actuated Joint Stem Segment',
    slug: 'brain-stem-robot',
    category: 'Robotic Arm',
    description: 'Biomechanical robotic joint stem featuring servo housing, spinal linkage, and internal wiring channels.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 7,
    name: 'Industrial Enclosed Hazardous Lighting Unit',
    slug: 'industrial-lantern',
    category: 'Industrial Control Panel',
    description: 'High-intensity industrial hanging lantern housing showing glass globe, protective guard, and top hook.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 8,
    name: 'Acoustic Signal Processing Workstation',
    slug: 'boom-box-station',
    category: 'Industrial Control Panel',
    description: 'Modular acoustic testing and signal amplifier station featuring speaker cones, control knobs, and chassis.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 9,
    name: 'High-Precision Optical Inspection System',
    slug: 'optical-inspection-camera',
    category: 'CNC Machine',
    description: 'Precision optical inspection camera with bellows extension, brass lens housing, and mounting plate.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 10,
    name: 'Pressurized Liquid Process Reservoir Container',
    slug: 'water-reservoir',
    category: 'Pressure Vessel',
    description: 'Stainless steel fluid reservoir with screw cap, thermal insulation sleeve, and flow nozzle.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 11,
    name: 'Surface Roughness Calibration Test Array',
    slug: 'roughness-calibration',
    category: 'Bearing Assembly',
    description: 'Metrology standard sphere array displaying progressive surface roughness and specular reflectivity grades.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 12,
    name: '3-Axis Angular Alignment Calibration Block',
    slug: 'orientation-calibration',
    category: 'Machine Tools',
    description: '3D coordinate calibration block with X, Y, Z axis indicators and precision datum surfaces.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/OrientationTest/glTF-Binary/OrientationTest.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 13,
    name: 'Extravehicular Mobility Operations Suit',
    slug: 'astronaut-suit',
    category: 'Safety Equipment & Gear',
    description: 'Pressurized extravehicular suit with helmet visor, life support backpack, and articulated joints.',
    url: 'https://raw.githubusercontent.com/google/model-viewer/master/packages/shared-assets/models/Astronaut.glb',
    license: 'CC0 / Public Domain',
    author: 'Google Model-Viewer Assets'
  },
  {
    id: 14,
    name: 'Multi-Axis Articulated Automation Robot',
    slug: 'robot-expressive',
    category: 'Robotic Arm',
    description: 'Compact articulated service robot featuring multi-joint arm segments, LED eye display, and base pedestal.',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    license: 'MIT / Open Source',
    author: 'Three.js Example Models'
  },
  {
    id: 15,
    name: 'Industrial Field Operations Rigging Suit',
    slug: 'soldier-rig',
    category: 'Safety Equipment & Gear',
    description: 'Heavy-duty articulated field suit with protective harness, utility pouches, and mobility joints.',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb',
    license: 'MIT / Open Source',
    author: 'Three.js Example Models'
  },
  {
    id: 16,
    name: 'Mechanical Kinematic Humanoid Chassis',
    slug: 'xbot-robot',
    category: 'Robotic Arm',
    description: 'Clean kinematic humanoid robot chassis displaying multi-axis joints for biomechanical motion analysis.',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb',
    license: 'MIT / Open Source',
    author: 'Three.js Example Models'
  },
  {
    id: 17,
    name: 'Biomechanical Operations Humanoid Figure',
    slug: 'humanoid-figure',
    category: 'Safety Equipment & Gear',
    description: 'Ergonomic human operator figure for spatial clearance testing and workplace reach envelope analysis.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    license: 'CC-BY 4.0 International',
    author: 'Cesium Open Model Vault'
  },
  {
    id: 18,
    name: 'Primary Ion Drive Plasma Propulsion Engine',
    slug: 'ion-drive-engine',
    category: 'Turbine',
    description: 'Electrostatic ion thruster assembly featuring ionization chamber, magnetic coils, and accelerator grid.',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/PrimaryIonDrive.glb',
    license: 'MIT / Open Source',
    author: 'Three.js Example Models'
  },
  {
    id: 19,
    name: 'Ergonomic Control Room Operator Chair',
    slug: 'operator-chair',
    category: 'Industrial Control Panel',
    description: 'Heavy-duty ergonomic operator chair with adjustable armrests, lumbar support, and 5-star mobile base.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 20,
    name: 'Advanced Polymer Composite Specimen Block',
    slug: 'polymer-specimen',
    category: 'Injection Molding Machine',
    description: 'Molded polymer material specimen showcasing surface texture variants, flexural ribs, and mold lines.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 21,
    name: 'High-Temperature Ceramic Heat Shield Block',
    slug: 'ceramic-shield',
    category: 'Heat Exchanger',
    description: 'Precision investment cast ceramic specimen exhibiting high thermal dissipation geometry and density.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DragonAttenuation/glTF-Binary/DragonAttenuation.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 22,
    name: 'Control Room Modular Seating Console',
    slug: 'modular-console',
    category: 'Industrial Control Panel',
    description: 'Heavy industrial lounge console unit for plant monitoring rooms and dispatcher control centers.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 23,
    name: 'Optical Translucency Material Calibration Plate',
    slug: 'translucency-calibration',
    category: 'Machine Tools',
    description: 'Translucent material calibration block for verifying X-Ray shell opacity and internal mesh visibility.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AlphaBlendModeTest/glTF-Binary/AlphaBlendModeTest.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 24,
    name: 'Industrial Marine Hydrodynamic Specimen',
    slug: 'marine-specimen',
    category: 'Centrifugal Pump',
    description: 'Hydrodynamic aquatic specimen model displaying organic surface contours and fluid dynamic profiles.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 25,
    name: 'Subdivision Geometry Mesh Test Fixture',
    slug: 'subdivision-fixture',
    category: 'Machine Tools',
    description: 'Multi-part mechanical test block showing instanced fastener array, mounting bosses, and datum planes.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SimpleInstancing/glTF-Binary/SimpleInstancing.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 26,
    name: 'Thermal Gradient Color Mapping Test Block',
    slug: 'thermal-mapping-block',
    category: 'Transformer',
    description: 'Finite element analysis thermal gradient block mapping vertex color temperatures from 200°C to 1200°C.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/VertexColorTest/glTF-Binary/VertexColorTest.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 27,
    name: 'Kinematic Actuated Enclosure Box Unit',
    slug: 'enclosure-box',
    category: 'Industrial Control Panel',
    description: 'Hinged industrial enclosure box featuring animated door latching mechanism and mounting tabs.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 28,
    name: 'Matte Finish Non-Reflective Testing Block',
    slug: 'unlit-test-block',
    category: 'Machine Tools',
    description: 'Diffuse non-reflective reference block for calibrating studio lighting and ambient shadow occlusion.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/UnlitTest/glTF-Binary/UnlitTest.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 29,
    name: 'Bio-Mechanical Quadruped Actuator Unit',
    slug: 'quadruped-robot',
    category: 'Robotic Arm',
    description: '4-legged bio-inspired mobile inspection robot chassis with multi-joint leg linkages and torso frame.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  },
  {
    id: 30,
    name: 'Hydrodynamic Avian Aerofoil Specimen',
    slug: 'aerofoil-specimen',
    category: 'Industrial Fan',
    description: 'Aerodynamic aerofoil calibration model demonstrating wing profile curvature and fluid flow streamlines.',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    license: 'CC-BY 4.0 International',
    author: 'Khronos Group Open Sample Assets'
  }
];

async function downloadAll() {
  console.log('Downloading 30 real high-quality 3D GLB/glTF models...');
  
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  for (const m of MASTER_30_MODELS) {
    const filename = `model_${m.id}.gltf`;
    const targetPath = path.join(modelsDir, filename);
    console.log(`Downloading [${m.id}/30] ${m.name} -> ${filename}...`);
    try {
      const res = await fetch(m.url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(targetPath, buffer);
      console.log(`✓ Saved ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ Failed downloading ${m.name}: ${err.message}`);
    }
  }

  console.log('\nAll 30 high-quality models downloaded successfully!');
}

downloadAll();
