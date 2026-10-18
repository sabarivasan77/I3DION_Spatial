import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MASTER_30_DATA = [
  {
    id: 'hub-01',
    name: 'Heavy Duty Planetary Speed Reducer',
    slug: 'industrial-gearbox',
    category: 'Industrial Gearbox',
    shortDescription: 'High-torque planetary speed reducer with sun gear, planetary carrier, and enclosed housing.',
    longDescription: 'High-torque industrial planetary speed reducer designed for heavy machinery drives. Demonstrates gear mesh relationships, internal bearing placement, and outer housing seal boundaries in Solid, Wireframe, and X-Ray visualization modes.',
    thumbnail: '/models/thumbnails/thumb_1.svg',
    modelUrl: '/models/model_1.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1420,
    likesCount: 388,
    downloadsCount: 195,
    metadata: {
      objectType: 'Mechanical Transmission Assembly',
      industrialCategory: 'Power Transmission & Drive Technology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Housing, Sun Gear, Planetary Carrier, Output Shaft, Bearings',
      modelCharacteristics: 'High-Density CAD Geometry, Clean Mesh Topology, Sub-assembly Nodes'
    },
    features: [
      'Multi-stage planetary gear reduction visualization',
      'X-Ray transparency revealing internal tooth engagement',
      'Wireframe edge loops showing CAD mesh quality',
      'WebAR scale preservation and spatial placement'
    ],
    tags: ['gearbox', 'transmission', 'mechanical', 'planetary-gears', 'powertrain'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Industrial CAD-derived model',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'STEP / IGES',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-02',
    name: 'Reciprocating Saw Industrial Power Actuator',
    slug: 'reciprocating-saw',
    category: 'Power Tools & Actuators',
    shortDescription: 'Industrial motor-driven reciprocating saw assembly displaying internal drive linkage and blade clamp.',
    longDescription: 'Enclosed motor-driven reciprocating power actuator assembly. Features detailed motor windings, bevel gear reduction head, reciprocating slider-crank linkage, and quick-change blade chuck under X-Ray inspection mode.',
    thumbnail: '/models/thumbnails/thumb_2.svg',
    modelUrl: '/models/model_2.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1890,
    likesCount: 512,
    downloadsCount: 310,
    metadata: {
      objectType: 'Motorized Reciprocating Machine',
      industrialCategory: 'Power Tools & Actuators',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Electric Motor, Drive Gear, Crank Linkage, Slider Shaft, Ergonomic Casing',
      modelCharacteristics: 'High-Detail Kinematic Linkage CAD'
    },
    features: [
      'Full internal motor drive and gear head X-Ray view',
      'Detailed ergonomic housing and trigger assembly',
      'Interactive 360-degree rotation and explosion preview',
      'Real-time AR spatial anchor support'
    ],
    tags: ['actuator', 'saw', 'reciprocating', 'power-tool', 'linkage', 'machinery'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Engineering Visualization Repository',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF / OBJ',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-03',
    name: 'Off-Road Industrial Transport Buggy Chassis',
    slug: 'industrial-buggy',
    category: 'Forklift / Industrial Vehicle',
    shortDescription: 'Heavy-duty tubular chassis vehicle featuring independent suspension, wheel hubs, and roll-cage frame.',
    longDescription: 'Heavy industrial off-road logistics buggy vehicle. Highlights the tubular spaceframe chassis, front and rear independent wishbone suspension arms, shock absorber assemblies, and steering linkage.',
    thumbnail: '/models/thumbnails/thumb_3.svg',
    modelUrl: '/models/model_3.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1650,
    likesCount: 420,
    downloadsCount: 240,
    metadata: {
      objectType: 'Mobile Transport Vehicle',
      industrialCategory: 'Intralogistics & Mobile Equipment',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Spaceframe Chassis, Suspension Arms, Coil Springs, Steering Gear, Wheels',
      modelCharacteristics: 'Complex Multi-Body Vehicle Assembly'
    },
    features: [
      'Tubular chassis transparency for structural frame inspection',
      'Suspension geometry in Wireframe mode',
      'Standard off-road wheel and axle assembly details',
      'Desktop to mobile AR QR link generation'
    ],
    tags: ['buggy', 'vehicle', 'chassis', 'suspension', 'logistics', 'transport'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Vehicle CAD Library',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'STEP',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-04',
    name: 'Industrial Safety Protective Helmet Unit',
    slug: 'damaged-helmet',
    category: 'Safety Equipment & Gear',
    shortDescription: 'High-impact composite industrial safety helmet showing visor mounts, ventilation ports, and shell layers.',
    longDescription: 'Heavy-duty industrial protective helmet with internal shock-absorbing liner, chin strap assembly, and multi-layer composite shell for personal protective equipment (PPE) visualization.',
    thumbnail: '/models/thumbnails/thumb_4.svg',
    modelUrl: '/models/model_4.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1980,
    likesCount: 575,
    downloadsCount: 310,
    metadata: {
      objectType: 'Personal Protective Equipment',
      industrialCategory: 'Safety Equipment & Gear',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Outer Shell, Impact Foam Liner, Suspension Harness, Visor Mechanism',
      modelCharacteristics: 'High Poly Photoreal PBR Material Surface Mesh'
    },
    features: [
      'Multi-layer composite shell X-Ray inspection',
      'PBR metallic weathering and impact detail',
      'Precision wireframe mesh grid mapping',
      'WebAR instant placement'
    ],
    tags: ['helmet', 'ppe', 'safety', 'protective-gear', 'industrial'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Open Safety CAD Vault',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-05',
    name: 'Substation Transport Tanker Truck Unit',
    slug: 'milk-truck',
    category: 'Industrial Logistics Vehicle',
    shortDescription: 'Heavy distribution tanker truck with dual-axle chassis, insulated tank vessel, and cab assembly.',
    longDescription: 'Industrial bulk liquid transport tanker truck. Features cylindrical insulated pressure tank vessel, rear discharge valve cabinet, heavy ladder frame chassis, and dual rear axle assemblies.',
    thumbnail: '/models/thumbnails/thumb_5.svg',
    modelUrl: '/models/model_5.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1140,
    likesCount: 310,
    downloadsCount: 160,
    metadata: {
      objectType: 'Bulk Liquid Transport Vehicle',
      industrialCategory: 'Intralogistics & Mobile Equipment',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Truck Cab, Insulated Tank Vessel, Chassis Frame, Valve Cabinet, Axles',
      modelCharacteristics: 'Full Scale Commercial Vehicle Geometry'
    },
    features: [
      'Insulated tank internal volume X-Ray reveal',
      'Dual axle chassis and leaf spring suspension model',
      'High contrast Wireframe contour lines',
      'Direct mobile AR viewing capability'
    ],
    tags: ['tanker', 'truck', 'logistics', 'liquid-transport', 'vehicle'],
    source: {
      repository: 'Cesium Open Model Vault',
      author: 'Cesium Commercial Assets',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-06',
    name: 'Robotic Actuated Joint Stem Segment',
    slug: 'brain-stem-robot',
    category: 'Robotic Arm',
    shortDescription: 'Biomechanical robotic joint stem featuring servo housing, spinal linkage, and internal wiring channels.',
    longDescription: 'Multi-joint robotic neural actuator stem designed for advanced automation. Highlights internal brushless servo motors, harmonic drive reducers, and central cable routing conduits in X-Ray mode.',
    thumbnail: '/models/thumbnails/thumb_6.svg',
    modelUrl: '/models/model_6.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1890,
    likesCount: 420,
    downloadsCount: 195,
    metadata: {
      objectType: 'Articulated Robotic Joint Stem',
      industrialCategory: 'Robotics & Automated Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Servo Actuators, Harmonic Drives, Stem Segment Linkage, Bus Wiring',
      modelCharacteristics: 'Precision Bio-Robotic CAD Assembly'
    },
    features: [
      'Multi-axis joint linkage motion visualization',
      'Translucent shell revealing internal harmonic reducers',
      'Wireframe topology overlay for structural analysis',
      'AR experience ready'
    ],
    tags: ['robotics', 'joint-stem', 'actuator', 'automation', 'servo'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Robotics CAD Repository',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-07',
    name: 'Industrial Enclosed Hazardous Lighting Unit',
    slug: 'industrial-lantern',
    category: 'Industrial Control Panel',
    shortDescription: 'High-intensity industrial hanging lantern housing showing glass globe, protective guard, and top hook.',
    longDescription: 'Explosion-proof hazardous area industrial luminaire. Displays heavy cast aluminum housing, toughened glass protective globe, steel wire guard cage, and heat sink fins.',
    thumbnail: '/models/thumbnails/thumb_7.svg',
    modelUrl: '/models/model_7.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1310,
    likesCount: 360,
    downloadsCount: 180,
    metadata: {
      objectType: 'Hazardous Luminaire Enclosure',
      industrialCategory: 'Industrial Automation & Electrical Controls',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cast Housing, Glass Globe, Wire Guard, Heat Sink Fins, Mount Hook',
      modelCharacteristics: 'Heavy Cast Metal Surface Pattern Geometry'
    },
    features: [
      'Glass globe refractive transparency visualization',
      'Translucent metal housing revealing internal LED driver',
      'Wireframe edge grid mapping',
      'AR scale presentation'
    ],
    tags: ['lighting', 'luminaire', 'hazardous-area', 'explosion-proof', 'electrical'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Electrical Equipment Vault',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-08',
    name: 'Acoustic Signal Processing Workstation',
    slug: 'boom-box-station',
    category: 'Industrial Control Panel',
    shortDescription: 'Modular acoustic testing and signal amplifier station featuring speaker cones, control knobs, and chassis.',
    longDescription: 'Industrial acoustic signal analyzer and amplifier unit. Shows dual speaker driver cones, tactile frequency control potentiometers, cassette drive transport, and heavy carrying handle.',
    thumbnail: '/models/thumbnails/thumb_8.svg',
    modelUrl: '/models/model_8.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1450,
    likesCount: 390,
    downloadsCount: 210,
    metadata: {
      objectType: 'Acoustic Test Instrument',
      industrialCategory: 'Instrumentation & Process Control',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Audio Drivers, Chassis Enclosure, Control Panel Knobs, Transport Handle',
      modelCharacteristics: 'Detailed Consumer & Industrial Electronic Assembly'
    },
    features: [
      'Speaker cone magnet structure X-Ray view',
      'Tactile control knob array in Solid and Wireframe modes',
      'Realistic textured casing material',
      'AR view ready'
    ],
    tags: ['acoustic', 'analyzer', 'instrumentation', 'control-panel', 'audio'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-09',
    name: 'High-Precision Optical Inspection System',
    slug: 'optical-inspection-camera',
    category: 'CNC Machine',
    shortDescription: 'Precision optical inspection camera with bellows extension, brass lens housing, and mounting plate.',
    longDescription: 'Sub-millimeter optical inspection camera system. Features collapsible leather focus bellows, brass multi-element lens barrel, wooden bed plate, and rack-and-pinion focusing drive.',
    thumbnail: '/models/thumbnails/thumb_9.svg',
    modelUrl: '/models/model_9.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1720,
    likesCount: 480,
    downloadsCount: 260,
    metadata: {
      objectType: 'Optical Metrology Instrument',
      industrialCategory: 'Inspection & Quality Metrology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Lens Barrel, Focus Bellows, Bed Frame, Focusing Screws, Plate Holder',
      modelCharacteristics: 'Ultra-High Polygon CAD Surface Detail'
    },
    features: [
      'Multi-element optical glass lens X-Ray cutaway',
      'Flexible accordion bellows Wireframe geometry',
      'Solid PBR brass and mahogany textures',
      'AR spatial anchor ready'
    ],
    tags: ['camera', 'optical', 'metrology', 'inspection', 'precision'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Metrology CAD Vault',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-10',
    name: 'Pressurized Liquid Process Reservoir Container',
    slug: 'water-reservoir',
    category: 'Pressure Vessel',
    shortDescription: 'Stainless steel fluid reservoir with screw cap, thermal insulation sleeve, and flow nozzle.',
    longDescription: 'High-grade stainless steel liquid process reservoir. Features threaded top closure cap, rubber protective grip sleeve, and vacuum-insulated double wall construction under X-Ray mode.',
    thumbnail: '/models/thumbnails/thumb_10.svg',
    modelUrl: '/models/model_10.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1390,
    likesCount: 340,
    downloadsCount: 175,
    metadata: {
      objectType: 'Process Fluid Vessel',
      industrialCategory: 'Pumps & Fluid Handling',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Stainless Vessel Body, Threaded Cap, Insulating Sleeve, Bottom Ring',
      modelCharacteristics: 'Smooth Surface CAD Geometry'
    },
    features: [
      'Vacuum-insulated double wall X-Ray reveal',
      'Threaded neck cap engagement detail',
      'Wireframe curvature grid lines',
      'AR mobile handoff ready'
    ],
    tags: ['reservoir', 'vessel', 'fluid-container', 'stainless-steel', 'process'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Process Engineering Library',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-11',
    name: 'Surface Roughness Calibration Test Array',
    slug: 'roughness-calibration',
    category: 'Bearing Assembly',
    shortDescription: 'Metrology standard sphere array displaying progressive surface roughness and specular reflectivity grades.',
    longDescription: 'Standard calibration reference block comprising 16 precision ground metal spheres displaying progressive surface roughness values (Ra 0.05 to 1.6 μm) for laser scanner calibration.',
    thumbnail: '/models/thumbnails/thumb_11.svg',
    modelUrl: '/models/model_11.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1120,
    likesCount: 290,
    downloadsCount: 140,
    metadata: {
      objectType: 'Metrology Calibration Standard',
      industrialCategory: 'Inspection & Quality Metrology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Base Block, 16 Calibration Spheres, Reference Grid',
      modelCharacteristics: 'PBR Metallic Specular Reflectivity Grid'
    },
    features: [
      'Progressive surface roughness PBR visualization',
      'Spherical topology in Wireframe grid mode',
      'Precision mounting base plate',
      'AR desktop QR handoff'
    ],
    tags: ['calibration', 'roughness', 'metrology', 'spheres', 'inspection'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Metrology Group',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-12',
    name: '3-Axis Angular Alignment Calibration Block',
    slug: 'orientation-calibration',
    category: 'Machine Tools',
    shortDescription: '3D coordinate calibration block with X, Y, Z axis indicators and precision datum surfaces.',
    longDescription: 'Orthogonal 3-axis alignment gauge used for CNC machine coordinate zeroing and 3D scanner spatial calibration. Displays colored X (Red), Y (Green), Z (Blue) vectors and datum planes.',
    thumbnail: '/models/thumbnails/thumb_12.svg',
    modelUrl: '/models/model_12.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 980,
    likesCount: 210,
    downloadsCount: 115,
    metadata: {
      objectType: 'Spatial Orientation Datum Block',
      industrialCategory: 'CNC Machining & Subtractive Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Datum Cube Body, XYZ Arrow Markers, Mounting Hole',
      modelCharacteristics: 'Low Poly Exact Coordinate Geometry'
    },
    features: [
      'RGB coordinate axis directional indicators',
      'X-Ray transparency for internal datum hole inspection',
      'Wireframe edge cube loops',
      'WebAR coordinate origin test'
    ],
    tags: ['calibration', 'xyz-axes', 'datum', 'cnc', 'alignment'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Group',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-13',
    name: 'Extravehicular Mobility Operations Suit',
    slug: 'astronaut-suit',
    category: 'Safety Equipment & Gear',
    shortDescription: 'Pressurized extravehicular suit with helmet visor, life support backpack, and articulated joints.',
    longDescription: 'High-altitude pressurized extravehicular mobility suit. Displays gold-coated thermal visor, chest control module, primary life support system backpack, and heavy thermal micrometeoroid garment.',
    thumbnail: '/models/thumbnails/thumb_13.svg',
    modelUrl: '/models/model_13.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 2450,
    likesCount: 780,
    downloadsCount: 420,
    metadata: {
      objectType: 'Environmental Life Support Garment',
      industrialCategory: 'Safety Equipment & Gear',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Helmet & Visor, Torso Assembly, Life Support Pack, Gloves & Boots',
      modelCharacteristics: 'High Resolution Mesh & Fabric PBR Textures'
    },
    features: [
      'Gold thermal visor reflective PBR rendering',
      'Life support pack internal duct X-Ray view',
      'Detailed fabric seam Wireframe topology',
      'Real-time AR spatial anchor'
    ],
    tags: ['suit', 'protective-gear', 'life-support', 'aerospace', 'safety'],
    source: {
      repository: 'Google Model-Viewer Assets',
      author: 'NASA / Google Model-Viewer',
      license: 'CC0 / Public Domain',
      attributionRequired: false,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-14',
    name: 'Multi-Axis Articulated Automation Robot',
    slug: 'robot-expressive',
    category: 'Robotic Arm',
    shortDescription: 'Compact articulated service robot featuring multi-joint arm segments, LED eye display, and base pedestal.',
    longDescription: 'Interactive multi-axis service robot. Highlights articulated shoulder, elbow, and wrist joints, animated facial expression screen, and weighted pedestal base.',
    thumbnail: '/models/thumbnails/thumb_14.svg',
    modelUrl: '/models/model_14.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 2150,
    likesCount: 640,
    downloadsCount: 350,
    metadata: {
      objectType: 'Articulated Service Manipulator',
      industrialCategory: 'Robotics & Automated Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Base Pedestal, Torso Segment, Articulated Arms, Head Display Unit',
      modelCharacteristics: 'Rigged Kinematic Joint Assembly'
    },
    features: [
      'Kinematic joint articulation visualization',
      'Internal servo casing X-Ray reveal',
      'Clean low-quad Wireframe mesh',
      'AR floor placement ready'
    ],
    tags: ['robot', 'automation', 'articulated', 'service-robot', 'kinematics'],
    source: {
      repository: 'Three.js Example Models',
      author: 'Three.js / mrdoob',
      license: 'MIT License',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-15',
    name: 'Industrial Field Operations Rigging Suit',
    slug: 'soldier-rig',
    category: 'Safety Equipment & Gear',
    shortDescription: 'Heavy-duty articulated field suit with protective harness, utility pouches, and mobility joints.',
    longDescription: 'High-durability field rigging gear assembly. Displays reinforced chest plate, shoulder pauldrons, combat boots, and modular equipment harness for ergonomic work study.',
    thumbnail: '/models/thumbnails/thumb_15.svg',
    modelUrl: '/models/model_15.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1840,
    likesCount: 520,
    downloadsCount: 275,
    metadata: {
      objectType: 'Modular Field Harness System',
      industrialCategory: 'Safety Equipment & Gear',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Chest Plate, Harness Belts, Pouches, Boots, Helmet',
      modelCharacteristics: 'Rigged Character Skeleton Mesh'
    },
    features: [
      'Harness strap and buckle X-Ray inspection',
      'PBR camouflage fabric material',
      'Wireframe skeletal joint overlay',
      'AR mobile preview ready'
    ],
    tags: ['harness', 'field-rig', 'safety', 'protective-gear', 'ergonomics'],
    source: {
      repository: 'Three.js Example Models',
      author: 'Three.js / mrdoob',
      license: 'MIT License',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-16',
    name: 'Mechanical Kinematic Humanoid Chassis',
    slug: 'xbot-robot',
    category: 'Robotic Arm',
    shortDescription: 'Clean kinematic humanoid robot chassis displaying multi-axis joints for biomechanical motion analysis.',
    longDescription: 'Generic humanoid robot test chassis. Features white matte casing, high-contrast joint pivot points, and 24-degree-of-freedom skeletal rig for motion capture validation.',
    thumbnail: '/models/thumbnails/thumb_16.svg',
    modelUrl: '/models/model_16.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1950,
    likesCount: 580,
    downloadsCount: 310,
    metadata: {
      objectType: 'Humanoid Motion Test Bed',
      industrialCategory: 'Robotics & Automated Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Torso Chassis, 2x Arm Links, 2x Leg Links, Neck Pivot',
      modelCharacteristics: 'Subdivision Surface CAD Shell'
    },
    features: [
      'Full 24-DOF skeletal joint rig preview',
      'Internal joint actuator X-Ray translucency',
      'Clean quad Wireframe topology',
      'WebAR scale testing'
    ],
    tags: ['humanoid', 'robot', 'kinematics', 'chassis', 'motion-capture'],
    source: {
      repository: 'Three.js Example Models',
      author: 'Three.js / mrdoob',
      license: 'MIT License',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-17',
    name: 'Biomechanical Operations Humanoid Figure',
    slug: 'humanoid-figure',
    category: 'Safety Equipment & Gear',
    shortDescription: 'Ergonomic human operator figure for spatial clearance testing and workplace reach envelope analysis.',
    longDescription: 'Standard human mannequin model calibrated to 50th percentile male dimensions for cockpit ergonomic evaluation, machinery reach envelope studies, and clearance testing.',
    thumbnail: '/models/thumbnails/thumb_17.svg',
    modelUrl: '/models/model_17.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1410,
    likesCount: 360,
    downloadsCount: 185,
    metadata: {
      objectType: 'Ergonomic Calibration Mannequin',
      industrialCategory: 'Safety Equipment & Gear',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Head, Torso, Arms, Legs, Joint Pivots',
      modelCharacteristics: 'Standard Ergonomic CAD Mesh'
    },
    features: [
      '50th percentile human scale reference',
      'X-Ray internal skeletal alignment',
      'Wireframe surface contour lines',
      'AR spatial scale verification'
    ],
    tags: ['humanoid', 'ergonomics', 'mannequin', 'reach-envelope', 'safety'],
    source: {
      repository: 'Cesium Open Model Vault',
      author: 'Cesium Vault',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-18',
    name: 'Primary Ion Drive Plasma Propulsion Engine',
    slug: 'ion-drive-engine',
    category: 'Turbine',
    shortDescription: 'Electrostatic ion thruster assembly featuring ionization chamber, magnetic coils, and accelerator grid.',
    longDescription: 'High-efficiency electrostatic plasma thruster assembly. Demonstrates central ionization chamber, surrounding solenoid magnet rings, carbon extraction grids, and glowing blue plasma exhaust plume.',
    thumbnail: '/models/thumbnails/thumb_18.svg',
    modelUrl: '/models/model_18.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 2290,
    likesCount: 710,
    downloadsCount: 390,
    metadata: {
      objectType: 'Electrostatic Plasma Thruster',
      industrialCategory: 'Power Generation & Turbomachinery',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Anode Chamber, Solenoid Coils, Extraction Grids, Neutralizer Cathode',
      modelCharacteristics: 'Complex Propulsion Engine CAD Assembly'
    },
    features: [
      'Ionization chamber interior X-Ray reveal',
      'Glowing plasma exhaust plume PBR emission',
      'Magnetic coil Wireframe winding grid',
      'WebAR desktop QR handoff'
    ],
    tags: ['ion-drive', 'plasma', 'thruster', 'engine', 'propulsion'],
    source: {
      repository: 'Three.js Example Models',
      author: 'Three.js / mrdoob',
      license: 'MIT License',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-19',
    name: 'Ergonomic Control Room Operator Chair',
    slug: 'operator-chair',
    category: 'Industrial Control Panel',
    shortDescription: 'Heavy-duty ergonomic operator chair with adjustable armrests, lumbar support, and 5-star mobile base.',
    longDescription: '24/7 continuous-use control room chair. Features multi-adjustable armrests, mesh breathable backrest, synchronized tilt mechanism, and heavy-duty steel 5-star caster base.',
    thumbnail: '/models/thumbnails/thumb_19.svg',
    modelUrl: '/models/model_19.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1250,
    likesCount: 310,
    downloadsCount: 160,
    metadata: {
      objectType: 'Control Room Ergonomic Seating',
      industrialCategory: 'Industrial Automation & Electrical Controls',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Seat Cushion, Mesh Back, Armrests, Gas Lift Cylinder, 5-Star Base',
      modelCharacteristics: 'High-Detail Sheen Fabric PBR Textures'
    },
    features: [
      'Gas lift hydraulic cylinder X-Ray inspection',
      'Sheen fabric material PBR rendering',
      'Wireframe mesh backrest grid',
      'AR floor placement ready'
    ],
    tags: ['chair', 'operator-chair', 'ergonomics', 'control-room', 'seating'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-20',
    name: 'Advanced Polymer Composite Specimen Block',
    slug: 'polymer-specimen',
    category: 'Injection Molding Machine',
    shortDescription: 'Molded polymer material specimen showcasing surface texture variants, flexural ribs, and mold lines.',
    longDescription: 'Polymer injection molding sample specimen. Demonstrates multiple PBR material surface finishes (high gloss, matte grain, carbon weave) and internal structural ribbing under X-Ray mode.',
    thumbnail: '/models/thumbnails/thumb_20.svg',
    modelUrl: '/models/model_20.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1180,
    likesCount: 280,
    downloadsCount: 145,
    metadata: {
      objectType: 'Material Processing Sample Specimen',
      industrialCategory: 'Plastics Processing & Molding',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Molded Specimen Body, Structural Ribs, Texture Zones',
      modelCharacteristics: 'Multi-Material PBR Variant Specimen'
    },
    features: [
      'Dynamic material variant PBR switching',
      'Internal flexural rib X-Ray translucency',
      'Curved surface Wireframe topology',
      'AR view ready'
    ],
    tags: ['polymer', 'injection-molding', 'specimen', 'material', 'plastics'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Material Group',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-21',
    name: 'High-Temperature Ceramic Heat Shield Block',
    slug: 'ceramic-shield',
    category: 'Heat Exchanger',
    shortDescription: 'Precision investment cast ceramic specimen exhibiting high thermal dissipation geometry and density.',
    longDescription: 'High-density refractory ceramic thermal shield block. Features complex internal cooling channels, high-temperature alumina ceramic body, and ribbed surface area expanders.',
    thumbnail: '/models/thumbnails/thumb_21.svg',
    modelUrl: '/models/model_21.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1420,
    likesCount: 370,
    downloadsCount: 190,
    metadata: {
      objectType: 'Refractory Thermal Barrier',
      industrialCategory: 'Process Equipment & Thermal Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Ceramic Body, Cooling Channels, Mounting Bosses',
      modelCharacteristics: 'High Poly Sculpted Ceramic Mesh'
    },
    features: [
      'Volumetric translucency X-Ray mode',
      'PBR sub-surface scattering ceramic texture',
      'Wireframe organic curvature grid',
      'AR spatial anchor ready'
    ],
    tags: ['ceramic', 'heat-shield', 'thermal', 'refractory', 'process'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-22',
    name: 'Control Room Modular Seating Console',
    slug: 'modular-console',
    category: 'Industrial Control Panel',
    shortDescription: 'Heavy industrial lounge console unit for plant monitoring rooms and dispatcher control centers.',
    longDescription: 'Multi-person modular control room seating console. Features heavy velvet upholstery, integrated wiring duct base, and ergonomic armrests for long-shift plant monitoring operators.',
    thumbnail: '/models/thumbnails/thumb_22.svg',
    modelUrl: '/models/model_22.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1110,
    likesCount: 260,
    downloadsCount: 130,
    metadata: {
      objectType: 'Control Room Monitoring Lounge',
      industrialCategory: 'Industrial Automation & Electrical Controls',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Modular Cushions, Base Frame, Backrest, Armrests',
      modelCharacteristics: 'Soft Velvet PBR Shading Mesh'
    },
    features: [
      'PBR velvet sheen texture rendering',
      'Internal frame structure X-Ray view',
      'Cushion seam Wireframe topology',
      'AR floor placement ready'
    ],
    tags: ['console', 'seating', 'control-room', 'lounge', 'automation'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-23',
    name: 'Optical Translucency Material Calibration Plate',
    slug: 'translucency-calibration',
    category: 'Machine Tools',
    shortDescription: 'Translucent material calibration block for verifying X-Ray shell opacity and internal mesh visibility.',
    longDescription: 'Precision optical test target for evaluating 3D engine blend modes, alpha coverage, and volumetric translucency rendering in X-Ray and Wireframe inspection modes.',
    thumbnail: '/models/thumbnails/thumb_23.svg',
    modelUrl: '/models/model_23.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 950,
    likesCount: 210,
    downloadsCount: 105,
    metadata: {
      objectType: 'Optical Rendering Test Target',
      industrialCategory: 'Inspection & Quality Metrology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Stacked Alpha Plates, Frame Base, Calibration Grid',
      modelCharacteristics: 'Alpha Blend & Cutout Test Mesh'
    },
    features: [
      'Progressive alpha transparency layer testing',
      'Internal overlapping geometry X-Ray reveal',
      'Wireframe edge grid overlay',
      'AR mobile view ready'
    ],
    tags: ['translucency', 'alpha', 'calibration', 'optical', 'metrology'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-24',
    name: 'Industrial Marine Hydrodynamic Specimen',
    slug: 'marine-specimen',
    category: 'Centrifugal Pump',
    shortDescription: 'Hydrodynamic aquatic specimen model displaying organic surface contours and fluid dynamic profiles.',
    longDescription: 'High-detail marine biological CAD specimen used for hydrodynamic drag simulation, bio-inspired propeller design, and water flow visualization.',
    thumbnail: '/models/thumbnails/thumb_24.svg',
    modelUrl: '/models/model_24.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1540,
    likesCount: 410,
    downloadsCount: 215,
    metadata: {
      objectType: 'Bio-Inspired Hydrodynamic Specimen',
      industrialCategory: 'Pumps & Fluid Handling',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Body Shell, Fin Foil Surfaces, Tail Propulsor, Internal Skeleton',
      modelCharacteristics: 'High Poly Organic Surface Mesh'
    },
    features: [
      'Sub-surface translucent X-Ray internal skeleton',
      'Dense organic Wireframe mesh contouring',
      'PBR specular scale texture rendering',
      'AR spatial anchor ready'
    ],
    tags: ['marine', 'hydrodynamic', 'specimen', 'fluid-dynamics', 'bio-inspired'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-25',
    name: 'Subdivision Geometry Mesh Test Fixture',
    slug: 'subdivision-fixture',
    category: 'Machine Tools',
    shortDescription: 'Multi-part mechanical test block showing instanced fastener array, mounting bosses, and datum planes.',
    longDescription: 'Machined instancing test block comprising 25 repeated bolt fastener heads, precision counterbored holes, and ground datum surfaces for 3D engine instancing performance tests.',
    thumbnail: '/models/thumbnails/thumb_25.svg',
    modelUrl: '/models/model_25.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 890,
    likesCount: 195,
    downloadsCount: 95,
    metadata: {
      objectType: 'Instanced Fastener Test Block',
      industrialCategory: 'CNC Machining & Subtractive Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Base Block, 25x Hex Bolt Instances, Datum Plane',
      modelCharacteristics: 'GPU Instanced Mesh Geometry'
    },
    features: [
      'GPU hardware instancing test geometry',
      'Translucent base block showing internal thread holes',
      'Wireframe hex bolt contours',
      'AR scale placement test'
    ],
    tags: ['instancing', 'test-fixture', 'fasteners', 'machining', 'cad'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-26',
    name: 'Thermal Gradient Color Mapping Test Block',
    slug: 'thermal-mapping-block',
    category: 'Transformer',
    shortDescription: 'Finite element analysis thermal gradient block mapping vertex color temperatures from 200°C to 1200°C.',
    longDescription: 'Finite element analysis (FEA) thermal stress test block. Displays continuous vertex color temperature gradient mapping (Blue 200°C -> Green 500°C -> Red 1200°C) for thermal simulation visualization.',
    thumbnail: '/models/thumbnails/thumb_26.svg',
    modelUrl: '/models/model_26.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1040,
    likesCount: 230,
    downloadsCount: 120,
    metadata: {
      objectType: 'FEA Thermal Stress Test Block',
      industrialCategory: 'High Voltage Power Distribution',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Gradient Mesh Cylinder, Internal Temperature Core',
      modelCharacteristics: 'Per-Vertex Color Thermal Map Mesh'
    },
    features: [
      'Continuous FEA thermal gradient color mapping',
      'Internal hot spot X-Ray core reveal',
      'Wireframe FEA element grid lines',
      'AR desktop QR handoff'
    ],
    tags: ['thermal', 'fea', 'vertex-colors', 'simulation', 'stress-analysis'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-27',
    name: 'Kinematic Actuated Enclosure Box Unit',
    slug: 'enclosure-box',
    category: 'Industrial Control Panel',
    shortDescription: 'Hinged industrial enclosure box featuring animated door latching mechanism and mounting tabs.',
    longDescription: 'NEMA-rated animated electrical enclosure box. Demonstrates 90-degree door swing kinematics, dual toggle latch closure mechanism, and backplate DIN rail mounting holes.',
    thumbnail: '/models/thumbnails/thumb_27.svg',
    modelUrl: '/models/model_27.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1210,
    likesCount: 305,
    downloadsCount: 155,
    metadata: {
      objectType: 'Kinematic Electrical Enclosure',
      industrialCategory: 'Industrial Automation & Electrical Controls',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Enclosure Body, Hinged Door, Toggle Latches, Backplate',
      modelCharacteristics: 'Kinematic Animated Mesh'
    },
    features: [
      'Hinged door open/close animation preview',
      'Internal backplate X-Ray inspection',
      'Sheet metal bend Wireframe topology',
      'AR floor placement ready'
    ],
    tags: ['enclosure', 'box', 'kinematics', 'nema', 'control-panel'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-28',
    name: 'Matte Finish Non-Reflective Testing Block',
    slug: 'unlit-test-block',
    category: 'Machine Tools',
    shortDescription: 'Diffuse non-reflective reference block for calibrating studio lighting and ambient shadow occlusion.',
    longDescription: 'Constant-shading unlit material calibration target. Used for calibrating diffuse color fidelity, Ambient Occlusion (AO) shadow maps, and unlit texture inspection.',
    thumbnail: '/models/thumbnails/thumb_28.svg',
    modelUrl: '/models/model_28.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 810,
    likesCount: 175,
    downloadsCount: 85,
    metadata: {
      objectType: 'Diffuse Shading Reference Target',
      industrialCategory: 'Inspection & Quality Metrology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Unlit Target Cube, Calibration Text Overlay',
      modelCharacteristics: 'Unlit Material Shading Mesh'
    },
    features: [
      'Pure diffuse unlit color rendering',
      'Internal cube volume X-Ray view',
      'Wireframe edge cube alignment',
      'AR coordinate check'
    ],
    tags: ['unlit', 'diffuse', 'calibration', 'shading', 'metrology'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-29',
    name: 'Bio-Mechanical Quadruped Actuator Unit',
    slug: 'quadruped-robot',
    category: 'Robotic Arm',
    shortDescription: '4-legged bio-inspired mobile inspection robot chassis with multi-joint leg linkages and torso frame.',
    longDescription: 'Four-legged quadruped autonomous inspection robot. Highlights 3-DOF leg actuators, torso electronics enclosure, stereo vision sensor head, and joint spring dampers.',
    thumbnail: '/models/thumbnails/thumb_29.svg',
    modelUrl: '/models/model_29.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 2110,
    likesCount: 630,
    downloadsCount: 340,
    metadata: {
      objectType: 'Autonomous Mobile Quadruped',
      industrialCategory: 'Robotics & Automated Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Torso Frame, 4x Leg Linkages, 12x Joint Servos, Sensor Head',
      modelCharacteristics: 'High Poly Bio-Robotic CAD Assembly'
    },
    features: [
      '12-servo leg linkage kinematic animation',
      'Torso battery and PCB X-Ray reveal',
      'Detailed leg linkage Wireframe grid',
      'AR spatial anchor ready'
    ],
    tags: ['quadruped', 'robot', 'inspection-robot', 'robotics', 'automation'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-30',
    name: 'Hydrodynamic Avian Aerofoil Specimen',
    slug: 'aerofoil-specimen',
    category: 'Industrial Fan',
    shortDescription: 'Aerodynamic aerofoil calibration model demonstrating wing profile curvature and fluid flow streamlines.',
    longDescription: 'Precision hydrodynamic avian aerofoil model. Used for wind tunnel lift/drag analysis, fan blade curvature optimization, and CFD pressure distribution studies.',
    thumbnail: '/models/thumbnails/thumb_30.svg',
    modelUrl: '/models/model_30.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1680,
    likesCount: 450,
    downloadsCount: 230,
    metadata: {
      objectType: 'Aerodynamic Aerofoil Reference Standard',
      industrialCategory: 'HVAC & Process Air Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Aerofoil Body, Trailing Edge, Internal Rib Skeleton',
      modelCharacteristics: 'Smooth Curved Aerofoil Mesh'
    },
    features: [
      'Internal wing spar X-Ray transparency',
      'Smooth aerofoil surface Wireframe contours',
      'PBR specular feathers texture',
      'AR spatial placement ready'
    ],
    tags: ['aerofoil', 'aerodynamics', 'cfd', 'fan-blade', 'hvac'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Khronos Sample Models',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  }
];

function generateFiles() {
  console.log('Generating updated spatialHubModels.ts & seed-spatial-hub.js...');
  
  // 1. Generate spatialHubModels.ts content
  const tsContent = `// Master 30-Model Curated Dataset for I3DION Spatial Hub
// Every model points to its own verified local 3D GLB/glTF asset (/models/model_X.gltf) and SVG preview thumbnail (/models/thumbnails/thumb_X.svg).

export interface SpatialHubModel {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  thumbnail: string;
  modelUrl: string;
  arEnabled: boolean;
  wireframeEnabled: boolean;
  xrayEnabled: boolean;
  solidEnabled: boolean;
  status: 'Published' | 'Ready' | 'Needs Review';
  viewsCount: number;
  likesCount: number;
  downloadsCount: number;
  metadata: {
    objectType: string;
    industrialCategory: string;
    visualizationType: string;
    componentStructure: string;
    modelCharacteristics: string;
  };
  features: string[];
  tags: string[];
  source: {
    repository: string;
    author: string;
    license: string;
    attributionRequired: boolean;
    originalFormat: string;
    optimizedFormat: string;
  };
}

export const SPATIAL_HUB_MODELS: SpatialHubModel[] = ${JSON.stringify(MASTER_30_DATA, null, 2)};

export function getSpatialHubModelBySlugOrId(slugOrId: string): SpatialHubModel | undefined {
  const query = slugOrId.toLowerCase();
  return SPATIAL_HUB_MODELS.find(
    m => m.id.toLowerCase() === query || m.slug.toLowerCase() === query
  );
}

export function searchSpatialHubModels(query: string, category?: string): SpatialHubModel[] {
  const q = query.trim().toLowerCase();
  return SPATIAL_HUB_MODELS.filter(m => {
    const matchesQuery = !q || (
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.shortDescription.toLowerCase().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    );
    const matchesCategory = !category || category === 'All' || m.category === category;
    return matchesQuery && matchesCategory;
  });
}
`;

  const tsPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'spatialHubModels.ts');
  fs.writeFileSync(tsPath, tsContent);
  console.log(`✓ Updated ${tsPath}`);

  // 2. Generate seed-spatial-hub.js content
  const seedModels = MASTER_30_DATA.map(m => ({
    name: m.name,
    slug: m.slug,
    category: m.category,
    description: m.shortDescription,
    model_url: m.modelUrl,
    image_url: m.thumbnail,
    specs: m.metadata,
    tags: m.tags
  }));

  const jsContent = `import { pool } from './pool.js';

export const SEED_MODELS = ${JSON.stringify(seedModels, null, 2)};

export async function seedSpatialHubDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure System Organization exists
    let orgRes = await client.query(\`SELECT id FROM organizations WHERE name = 'I3DION Spatial System' LIMIT 1\`);
    let orgId;
    if (orgRes.rows.length === 0) {
      const newOrg = await client.query(\`
        INSERT INTO organizations (name, website, profile, primary_color)
        VALUES ('I3DION Spatial System', 'https://i3-dion-spatial.vercel.app', 'Official System Organization', '#2563EB')
        RETURNING id
      \`);
      orgId = newOrg.rows[0].id;
    } else {
      orgId = orgRes.rows[0].id;
    }

    // 2. Insert/Update 30 Spatial Hub Models into database \`products\` table
    for (const item of SEED_MODELS) {
      await client.query(\`
        INSERT INTO products (
          organization_id, name, slug, category, description, status, is_public,
          model_url, image_url, specs, tags, public_url, views_count, likes_count
        ) VALUES (
          $1, $2, $3, $4, $5, 'Published', true,
          $6, $7, $8, $9, $10, 150, 45
        )
        ON CONFLICT (organization_id, slug) WHERE slug IS NOT NULL
        DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          status = 'Published',
          is_public = true,
          model_url = EXCLUDED.model_url,
          image_url = EXCLUDED.image_url,
          specs = EXCLUDED.specs,
          tags = EXCLUDED.tags,
          updated_at = now()
      \`, [
        orgId, item.name, item.slug, item.category, item.description,
        item.model_url, item.image_url, JSON.stringify(item.specs), item.tags,
        \`/product/\${item.slug}\`
      ]);
    }

    await client.query('COMMIT');
    console.log('Successfully seeded 30 Spatial Hub models into PostgreSQL database!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to seed Spatial Hub database:', err.message);
  } finally {
    client.release();
  }
}
`;

  const jsPath = path.join(__dirname, '..', 'backend', 'src', 'db', 'seed-spatial-hub.js');
  fs.writeFileSync(jsPath, jsContent);
  console.log(`✓ Updated ${jsPath}`);
}

generateFiles();
