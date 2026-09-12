import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidates = [
  { id: 1, name: 'Heavy Duty Planetary Speed Reducer', slug: 'industrial-gearbox', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb' },
  { id: 2, name: '3-Phase AC Power Saw Actuator', slug: 'reciprocating-saw', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ReciprocatingSaw/glTF-Binary/ReciprocatingSaw.glb' },
  { id: 3, name: 'Off-Road Industrial Transport Vehicle Chassis', slug: 'industrial-buggy', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb' },
  { id: 4, name: 'Heavy Industrial Protective Helmet Assembly', slug: 'damaged-helmet', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb' },
  { id: 5, name: 'Industrial Transport Tanker Truck Unit', slug: 'milk-truck', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb' },
  { id: 6, name: 'Robotic Actuated Joint Stem Assembly', slug: 'brain-stem-robot', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb' },
  { id: 7, name: 'Industrial Enclosed Lighting Fixture', slug: 'industrial-lantern', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb' },
  { id: 8, name: 'Acoustic Signal Processing Workstation', slug: 'boom-box-station', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb' },
  { id: 9, name: 'High-Precision Optical Inspection System', slug: 'optical-inspection-camera', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb' },
  { id: 10, name: 'Pressurized Liquid Process Reservoir', slug: 'water-reservoir', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb' },
  { id: 11, name: 'Surface Finish Roughness Calibration Array', slug: 'roughness-calibration', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb' },
  { id: 12, name: '3-Axis Angular Alignment Calibration Block', slug: 'orientation-calibration', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/OrientationTest/glTF-Binary/OrientationTest.glb' },
  { id: 13, name: 'Extravehicular Mobility Protection Suit', slug: 'astronaut-suit', url: 'https://raw.githubusercontent.com/google/model-viewer/master/packages/shared-assets/models/Astronaut.glb' },
  { id: 14, name: 'Multi-Axis Articulated Automation Robot', slug: 'robot-expressive', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb' },
  { id: 15, name: 'Industrial Defense Field Personnel Rig', slug: 'soldier-rig', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb' },
  { id: 16, name: 'Mechanical Kinematic Humanoid Chassis', slug: 'xbot-robot', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb' },
  { id: 17, name: 'Ergonomic Operations Testing Model', slug: 'stacy-figure', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Stacy.glb' },
  { id: 18, name: 'Primary Plasma Ion Engine Propulsion Unit', slug: 'ion-drive-engine', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/PrimaryIonDrive.glb' },
  { id: 19, name: 'Ergonomic Control Room Operator Chair', slug: 'operator-chair', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb' },
  { id: 20, name: 'Advanced Polymer Material Specimen', slug: 'polymer-specimen', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb' },
  { id: 21, name: 'High-Temperature Ceramic Casting Block', slug: 'ceramic-casting', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DragonAttenuation/glTF-Binary/DragonAttenuation.glb' },
  { id: 22, name: 'Control Room Modular Seating Console', slug: 'velvet-sofa', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb' },
  { id: 23, name: 'Optical Translucency Material Calibration Block', slug: 'translucency-calibration', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AlphaBlendModeTest/glTF-Binary/AlphaBlendModeTest.glb' },
  { id: 24, name: 'High-Precision Threaded Shaft Assembly', slug: 'threaded-shaft', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SimpleSparseAccessor/glTF-Binary/SimpleSparseAccessor.glb' },
  { id: 25, name: 'Flat Surface Milling Calibration Plate', slug: 'milling-calibration', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/NormalFlatTest/glTF-Binary/NormalFlatTest.glb' },
  { id: 26, name: 'Thermal Gradient Color Mapping Test Block', slug: 'thermal-mapping-block', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/VertexColorTest/glTF-Binary/VertexColorTest.glb' },
  { id: 27, name: 'Surface Texture Transform Calibration Plate', slug: 'texture-transform-plate', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/TextureTransformTest/glTF-Binary/TextureTransformTest.glb' },
  { id: 28, name: 'Matte Finish Non-Reflective Test Block', slug: 'unlit-test-block', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/UnlitTest/glTF-Binary/UnlitTest.glb' },
  { id: 29, name: 'Subdivision Geometry Mesh Test Fixture', slug: 'subdivision-fixture', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SimpleInstancing/glTF-Binary/SimpleInstancing.glb' },
  { id: 30, name: 'Kinematic Enclosure Box Assembly', slug: 'enclosure-box', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb' }
];

async function verifyAll() {
  console.log('Testing 30 candidate high-quality 3D model URLs...');
  let successCount = 0;
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, { method: 'HEAD' });
      if (res.status === 200) {
        successCount++;
        console.log(`[OK ${c.id}] ${c.name} (${c.slug})`);
      } else {
        console.error(`[FAIL ${c.id}] ${c.name}: HTTP ${res.status}`);
      }
    } catch (err) {
      console.error(`[ERR ${c.id}] ${c.name}: ${err.message}`);
    }
  }
  console.log(`\nVerified: ${successCount} / ${candidates.length} candidate URLs available.`);
}

verifyAll();
