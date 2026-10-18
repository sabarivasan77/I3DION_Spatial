import fs from 'node:fs';
import path from 'node:path';

const modelsDir = path.resolve(process.cwd(), 'frontend/public/models');
const thumbnailsDir = path.resolve(process.cwd(), 'frontend/public/models/thumbnails');

if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

function generateMinimalGltfJson(index, title, category) {
  // Simple valid glTF 2.0 JSON geometry with distinct node hierarchy and names
  return {
    asset: {
      generator: "I3DION Spatial CAD Generator",
      version: "2.0"
    },
    scene: 0,
    scenes: [
      {
        name: `Scene_${index}`,
        nodes: [0, 1]
      }
    ],
    nodes: [
      {
        name: `Outer_Housing_Casing_${index}`,
        mesh: 0,
        translation: [0, 0, 0]
      },
      {
        name: `Internal_Mechanism_Rotor_${index}`,
        mesh: 1,
        translation: [0, 0, 0.2]
      }
    ],
    meshes: [
      {
        name: `Mesh_Outer_Housing_${category.replace(/[^a-zA-Z0-9]/g, '_')}`,
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0
          }
        ]
      },
      {
        name: `Mesh_Internal_Component_${category.replace(/[^a-zA-Z0-9]/g, '_')}`,
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 1
          }
        ]
      }
    ],
    materials: [
      {
        name: "housing_casing_shell",
        pbrMetallicRoughness: {
          baseColorFactor: [0.39, 0.45, 0.54, 1.0],
          metallicFactor: 0.8,
          roughnessFactor: 0.2
        }
      },
      {
        name: "internal_mechanism_gear_shaft",
        pbrMetallicRoughness: {
 baseColorFactor: [0.15, 0.39, 0.92, 1.0],
          metallicFactor: 0.85,
          roughnessFactor: 0.15
        }
      }
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 24,
        type: "VEC3",
        max: [1.0, 1.0, 1.0],
        min: [-1.0, -1.0, -1.0]
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 24,
        type: "VEC3",
        max: [1.0, 1.0, 1.0],
        min: [-1.0, -1.0, -1.0]
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: 36,
        type: "SCALAR"
      }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 288, target: 34962 },
      { buffer: 0, byteOffset: 288, byteLength: 288, target: 34962 },
      { buffer: 0, byteOffset: 576, byteLength: 72, target: 34963 }
    ],
    buffers: [
      {
        uri: "data:application/octet-stream;base64,AACAPwAAgD8AAIA/AACAPwAAgD8AAIC/AACAPwAAgL8AAIA/AACAPwAAgL8AAIC/AACAvwAAgD8AAIA/AACAvwAAgD8AAIC/AACAvwAAgL8AAIA/AACAvwAAgL8AAIC/AACAPwAAgD8AAIA/AACAPwAAgD8AAIC/AACAPwAAgL8AAIA/AACAPwAAgL8AAIC/AACAvwAAgD8AAIA/AACAvwAAgD8AAIC/AACAvwAAgL8AAIA/AACAvwAAgL8AAIC/AAAAAAAAgD8AAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAAAAAgD8AAAAA",
        byteLength: 648
      }
    ]
  };
}

function generateSvgThumbnail(index, title, category) {
  const colors = ['#2563EB', '#0F172A', '#1E40AF', '#0284C7', '#0369A1', '#1D4ED8'];
  const color = colors[index % colors.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
    <rect width="400" height="300" fill="#F8FAFC"/>
    <rect x="20" y="20" width="360" height="260" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <!-- 3D Studio Technical Grid Background -->
    <path d="M40 80 H360 M40 140 H360 M40 200 H360" stroke="#F1F5F9" stroke-width="1.5" stroke-dasharray="4 4"/>
    <path d="M100 40 V260 M200 40 V260 M300 40 V260" stroke="#F1F5F9" stroke-width="1.5" stroke-dasharray="4 4"/>
    
    <!-- CAD Wireframe / Solid Isometric Symbol -->
    <g transform="translate(200, 130)">
      <path d="M0 -50 L50 -25 L50 25 L0 50 L-50 25 L-50 -25 Z" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M0 -50 L0 0 M-50 -25 L0 0 M50 -25 L0 0" stroke="${color}" stroke-width="2" stroke-dasharray="3 3"/>
      <circle cx="0" cy="0" r="18" fill="${color}" fill-opacity="0.8"/>
      <path d="M-8 -8 L8 8 M-8 8 L8 -8" stroke="#FFFFFF" stroke-width="2.5"/>
    </g>

    <!-- Labels -->
    <rect x="35" y="215" width="110" height="22" rx="6" fill="#EFF6FF"/>
    <text x="90" y="230" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#2563EB" text-anchor="middle" letter-spacing="0.5">${category.toUpperCase()}</text>
    
    <text x="200" y="255" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#0F172A" text-anchor="middle">${title.length > 34 ? title.slice(0, 32) + '...' : title}</text>
  </svg>`;
}

console.log('Generating 30 unique GLTF model files and local SVG thumbnails...');

const categories = [
  'Industrial Gearbox', 'Electric Motor', 'Centrifugal Pump', 'Air Compressor', 'Hydraulic Pump',
  'Industrial Valve', 'Heat Exchanger', 'Pressure Vessel', 'Conveyor Assembly', 'Robotic Arm',
  'Industrial Fan', 'Generator', 'Turbine', 'Hydraulic Cylinder', 'Bearing Assembly',
  'Gear Train', 'Coupling Assembly', 'Pipe Valve Assembly', 'Water Pump', 'Welding Machine',
  'CNC Machine', 'Industrial Drill', 'Lathe Machine', 'Milling Machine', 'Injection Molding Machine',
  'Industrial Control Panel', 'Transformer', 'Forklift / Industrial Vehicle', 'Mechanical Jack / Lifting Assembly', 'Engine / Engine Assembly'
];

for (let i = 1; i <= 30; i++) {
  const cat = categories[i - 1];
  const title = `Industrial CAD Assembly ${i} — ${cat}`;
  
  // 1. Generate SVG Thumbnail File
  const svgContent = generateSvgThumbnail(i, title, cat);
  const svgPath = path.join(thumbnailsDir, `thumb_${i}.svg`);
  fs.writeFileSync(svgPath, svgContent, 'utf-8');

  // 2. Generate glTF JSON 3D Model File
  const gltfJson = generateMinimalGltfJson(i, title, cat);
  const gltfPath = path.join(modelsDir, `model_${i}.gltf`);
  fs.writeFileSync(gltfPath, JSON.stringify(gltfJson, null, 2), 'utf-8');
}

console.log('Successfully generated 30 distinct GLTF 3D assets and local thumbnail previews!');
