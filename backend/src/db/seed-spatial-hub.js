import { pool } from './pool.js';

export const SEED_MODELS = [
  {
    "name": "Heavy Duty Planetary Speed Reducer",
    "slug": "industrial-gearbox",
    "category": "Industrial Gearbox",
    "description": "High-torque planetary speed reducer with sun gear, planetary carrier, and enclosed housing.",
    "model_url": "/models/model_1.gltf",
    "image_url": "/models/thumbnails/thumb_1.svg",
    "specs": {
      "objectType": "Mechanical Transmission Assembly",
      "industrialCategory": "Power Transmission & Drive Technology",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Housing, Sun Gear, Planetary Carrier, Output Shaft, Bearings",
      "modelCharacteristics": "High-Density CAD Geometry, Clean Mesh Topology, Sub-assembly Nodes"
    },
    "tags": [
      "gearbox",
      "transmission",
      "mechanical",
      "planetary-gears",
      "powertrain"
    ]
  },
  {
    "name": "Reciprocating Saw Industrial Power Actuator",
    "slug": "reciprocating-saw",
    "category": "Power Tools & Actuators",
    "description": "Industrial motor-driven reciprocating saw assembly displaying internal drive linkage and blade clamp.",
    "model_url": "/models/model_2.gltf",
    "image_url": "/models/thumbnails/thumb_2.svg",
    "specs": {
      "objectType": "Motorized Reciprocating Machine",
      "industrialCategory": "Power Tools & Actuators",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Electric Motor, Drive Gear, Crank Linkage, Slider Shaft, Ergonomic Casing",
      "modelCharacteristics": "High-Detail Kinematic Linkage CAD"
    },
    "tags": [
      "actuator",
      "saw",
      "reciprocating",
      "power-tool",
      "linkage",
      "machinery"
    ]
  },
  {
    "name": "Off-Road Industrial Transport Buggy Chassis",
    "slug": "industrial-buggy",
    "category": "Forklift / Industrial Vehicle",
    "description": "Heavy-duty tubular chassis vehicle featuring independent suspension, wheel hubs, and roll-cage frame.",
    "model_url": "/models/model_3.gltf",
    "image_url": "/models/thumbnails/thumb_3.svg",
    "specs": {
      "objectType": "Mobile Transport Vehicle",
      "industrialCategory": "Intralogistics & Mobile Equipment",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Spaceframe Chassis, Suspension Arms, Coil Springs, Steering Gear, Wheels",
      "modelCharacteristics": "Complex Multi-Body Vehicle Assembly"
    },
    "tags": [
      "buggy",
      "vehicle",
      "chassis",
      "suspension",
      "logistics",
      "transport"
    ]
  },
  {
    "name": "Industrial Safety Protective Helmet Unit",
    "slug": "damaged-helmet",
    "category": "Safety Equipment & Gear",
    "description": "High-impact composite industrial safety helmet showing visor mounts, ventilation ports, and shell layers.",
    "model_url": "/models/model_4.gltf",
    "image_url": "/models/thumbnails/thumb_4.svg",
    "specs": {
      "objectType": "Personal Protective Equipment",
      "industrialCategory": "Safety Equipment & Gear",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Outer Shell, Impact Foam Liner, Suspension Harness, Visor Mechanism",
      "modelCharacteristics": "High Poly Photoreal PBR Material Surface Mesh"
    },
    "tags": [
      "helmet",
      "ppe",
      "safety",
      "protective-gear",
      "industrial"
    ]
  },
  {
    "name": "Substation Transport Tanker Truck Unit",
    "slug": "milk-truck",
    "category": "Industrial Logistics Vehicle",
    "description": "Heavy distribution tanker truck with dual-axle chassis, insulated tank vessel, and cab assembly.",
    "model_url": "/models/model_5.gltf",
    "image_url": "/models/thumbnails/thumb_5.svg",
    "specs": {
      "objectType": "Bulk Liquid Transport Vehicle",
      "industrialCategory": "Intralogistics & Mobile Equipment",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Truck Cab, Insulated Tank Vessel, Chassis Frame, Valve Cabinet, Axles",
      "modelCharacteristics": "Full Scale Commercial Vehicle Geometry"
    },
    "tags": [
      "tanker",
      "truck",
      "logistics",
      "liquid-transport",
      "vehicle"
    ]
  },
  {
    "name": "Robotic Actuated Joint Stem Segment",
    "slug": "brain-stem-robot",
    "category": "Robotic Arm",
    "description": "Biomechanical robotic joint stem featuring servo housing, spinal linkage, and internal wiring channels.",
    "model_url": "/models/model_6.gltf",
    "image_url": "/models/thumbnails/thumb_6.svg",
    "specs": {
      "objectType": "Articulated Robotic Joint Stem",
      "industrialCategory": "Robotics & Automated Manufacturing",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Servo Actuators, Harmonic Drives, Stem Segment Linkage, Bus Wiring",
      "modelCharacteristics": "Precision Bio-Robotic CAD Assembly"
    },
    "tags": [
      "robotics",
      "joint-stem",
      "actuator",
      "automation",
      "servo"
    ]
  },
  {
    "name": "Industrial Enclosed Hazardous Lighting Unit",
    "slug": "industrial-lantern",
    "category": "Industrial Control Panel",
    "description": "High-intensity industrial hanging lantern housing showing glass globe, protective guard, and top hook.",
    "model_url": "/models/model_7.gltf",
    "image_url": "/models/thumbnails/thumb_7.svg",
    "specs": {
      "objectType": "Hazardous Luminaire Enclosure",
      "industrialCategory": "Industrial Automation & Electrical Controls",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Cast Housing, Glass Globe, Wire Guard, Heat Sink Fins, Mount Hook",
      "modelCharacteristics": "Heavy Cast Metal Surface Pattern Geometry"
    },
    "tags": [
      "lighting",
      "luminaire",
      "hazardous-area",
      "explosion-proof",
      "electrical"
    ]
  },
  {
    "name": "Acoustic Signal Processing Workstation",
    "slug": "boom-box-station",
    "category": "Industrial Control Panel",
    "description": "Modular acoustic testing and signal amplifier station featuring speaker cones, control knobs, and chassis.",
    "model_url": "/models/model_8.gltf",
    "image_url": "/models/thumbnails/thumb_8.svg",
    "specs": {
      "objectType": "Acoustic Test Instrument",
      "industrialCategory": "Instrumentation & Process Control",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Audio Drivers, Chassis Enclosure, Control Panel Knobs, Transport Handle",
      "modelCharacteristics": "Detailed Consumer & Industrial Electronic Assembly"
    },
    "tags": [
      "acoustic",
      "analyzer",
      "instrumentation",
      "control-panel",
      "audio"
    ]
  },
  {
    "name": "High-Precision Optical Inspection System",
    "slug": "optical-inspection-camera",
    "category": "CNC Machine",
    "description": "Precision optical inspection camera with bellows extension, brass lens housing, and mounting plate.",
    "model_url": "/models/model_9.gltf",
    "image_url": "/models/thumbnails/thumb_9.svg",
    "specs": {
      "objectType": "Optical Metrology Instrument",
      "industrialCategory": "Inspection & Quality Metrology",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Lens Barrel, Focus Bellows, Bed Frame, Focusing Screws, Plate Holder",
      "modelCharacteristics": "Ultra-High Polygon CAD Surface Detail"
    },
    "tags": [
      "camera",
      "optical",
      "metrology",
      "inspection",
      "precision"
    ]
  },
  {
    "name": "Pressurized Liquid Process Reservoir Container",
    "slug": "water-reservoir",
    "category": "Pressure Vessel",
    "description": "Stainless steel fluid reservoir with screw cap, thermal insulation sleeve, and flow nozzle.",
    "model_url": "/models/model_10.gltf",
    "image_url": "/models/thumbnails/thumb_10.svg",
    "specs": {
      "objectType": "Process Fluid Vessel",
      "industrialCategory": "Pumps & Fluid Handling",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Stainless Vessel Body, Threaded Cap, Insulating Sleeve, Bottom Ring",
      "modelCharacteristics": "Smooth Surface CAD Geometry"
    },
    "tags": [
      "reservoir",
      "vessel",
      "fluid-container",
      "stainless-steel",
      "process"
    ]
  },
  {
    "name": "Surface Roughness Calibration Test Array",
    "slug": "roughness-calibration",
    "category": "Bearing Assembly",
    "description": "Metrology standard sphere array displaying progressive surface roughness and specular reflectivity grades.",
    "model_url": "/models/model_11.gltf",
    "image_url": "/models/thumbnails/thumb_11.svg",
    "specs": {
      "objectType": "Metrology Calibration Standard",
      "industrialCategory": "Inspection & Quality Metrology",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Base Block, 16 Calibration Spheres, Reference Grid",
      "modelCharacteristics": "PBR Metallic Specular Reflectivity Grid"
    },
    "tags": [
      "calibration",
      "roughness",
      "metrology",
      "spheres",
      "inspection"
    ]
  },
  {
    "name": "3-Axis Angular Alignment Calibration Block",
    "slug": "orientation-calibration",
    "category": "Machine Tools",
    "description": "3D coordinate calibration block with X, Y, Z axis indicators and precision datum surfaces.",
    "model_url": "/models/model_12.gltf",
    "image_url": "/models/thumbnails/thumb_12.svg",
    "specs": {
      "objectType": "Spatial Orientation Datum Block",
      "industrialCategory": "CNC Machining & Subtractive Manufacturing",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Datum Cube Body, XYZ Arrow Markers, Mounting Hole",
      "modelCharacteristics": "Low Poly Exact Coordinate Geometry"
    },
    "tags": [
      "calibration",
      "xyz-axes",
      "datum",
      "cnc",
      "alignment"
    ]
  },
  {
    "name": "Extravehicular Mobility Operations Suit",
    "slug": "astronaut-suit",
    "category": "Safety Equipment & Gear",
    "description": "Pressurized extravehicular suit with helmet visor, life support backpack, and articulated joints.",
    "model_url": "/models/model_13.gltf",
    "image_url": "/models/thumbnails/thumb_13.svg",
    "specs": {
      "objectType": "Environmental Life Support Garment",
      "industrialCategory": "Safety Equipment & Gear",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Helmet & Visor, Torso Assembly, Life Support Pack, Gloves & Boots",
      "modelCharacteristics": "High Resolution Mesh & Fabric PBR Textures"
    },
    "tags": [
      "suit",
      "protective-gear",
      "life-support",
      "aerospace",
      "safety"
    ]
  },
  {
    "name": "Multi-Axis Articulated Automation Robot",
    "slug": "robot-expressive",
    "category": "Robotic Arm",
    "description": "Compact articulated service robot featuring multi-joint arm segments, LED eye display, and base pedestal.",
    "model_url": "/models/model_14.gltf",
    "image_url": "/models/thumbnails/thumb_14.svg",
    "specs": {
      "objectType": "Articulated Service Manipulator",
      "industrialCategory": "Robotics & Automated Manufacturing",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Base Pedestal, Torso Segment, Articulated Arms, Head Display Unit",
      "modelCharacteristics": "Rigged Kinematic Joint Assembly"
    },
    "tags": [
      "robot",
      "automation",
      "articulated",
      "service-robot",
      "kinematics"
    ]
  },
  {
    "name": "Industrial Field Operations Rigging Suit",
    "slug": "soldier-rig",
    "category": "Safety Equipment & Gear",
    "description": "Heavy-duty articulated field suit with protective harness, utility pouches, and mobility joints.",
    "model_url": "/models/model_15.gltf",
    "image_url": "/models/thumbnails/thumb_15.svg",
    "specs": {
      "objectType": "Modular Field Harness System",
      "industrialCategory": "Safety Equipment & Gear",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Chest Plate, Harness Belts, Pouches, Boots, Helmet",
      "modelCharacteristics": "Rigged Character Skeleton Mesh"
    },
    "tags": [
      "harness",
      "field-rig",
      "safety",
      "protective-gear",
      "ergonomics"
    ]
  },
  {
    "name": "Mechanical Kinematic Humanoid Chassis",
    "slug": "xbot-robot",
    "category": "Robotic Arm",
    "description": "Clean kinematic humanoid robot chassis displaying multi-axis joints for biomechanical motion analysis.",
    "model_url": "/models/model_16.gltf",
    "image_url": "/models/thumbnails/thumb_16.svg",
    "specs": {
      "objectType": "Humanoid Motion Test Bed",
      "industrialCategory": "Robotics & Automated Manufacturing",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Torso Chassis, 2x Arm Links, 2x Leg Links, Neck Pivot",
      "modelCharacteristics": "Subdivision Surface CAD Shell"
    },
    "tags": [
      "humanoid",
      "robot",
      "kinematics",
      "chassis",
      "motion-capture"
    ]
  },
  {
    "name": "Biomechanical Operations Humanoid Figure",
    "slug": "humanoid-figure",
    "category": "Safety Equipment & Gear",
    "description": "Ergonomic human operator figure for spatial clearance testing and workplace reach envelope analysis.",
    "model_url": "/models/model_17.gltf",
    "image_url": "/models/thumbnails/thumb_17.svg",
    "specs": {
      "objectType": "Ergonomic Calibration Mannequin",
      "industrialCategory": "Safety Equipment & Gear",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Head, Torso, Arms, Legs, Joint Pivots",
      "modelCharacteristics": "Standard Ergonomic CAD Mesh"
    },
    "tags": [
      "humanoid",
      "ergonomics",
      "mannequin",
      "reach-envelope",
      "safety"
    ]
  },
  {
    "name": "Primary Ion Drive Plasma Propulsion Engine",
    "slug": "ion-drive-engine",
    "category": "Turbine",
    "description": "Electrostatic ion thruster assembly featuring ionization chamber, magnetic coils, and accelerator grid.",
    "model_url": "/models/model_18.gltf",
    "image_url": "/models/thumbnails/thumb_18.svg",
    "specs": {
      "objectType": "Electrostatic Plasma Thruster",
      "industrialCategory": "Power Generation & Turbomachinery",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Anode Chamber, Solenoid Coils, Extraction Grids, Neutralizer Cathode",
      "modelCharacteristics": "Complex Propulsion Engine CAD Assembly"
    },
    "tags": [
      "ion-drive",
      "plasma",
      "thruster",
      "engine",
      "propulsion"
    ]
  },
  {
    "name": "Ergonomic Control Room Operator Chair",
    "slug": "operator-chair",
    "category": "Industrial Control Panel",
    "description": "Heavy-duty ergonomic operator chair with adjustable armrests, lumbar support, and 5-star mobile base.",
    "model_url": "/models/model_19.gltf",
    "image_url": "/models/thumbnails/thumb_19.svg",
    "specs": {
      "objectType": "Control Room Ergonomic Seating",
      "industrialCategory": "Industrial Automation & Electrical Controls",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Seat Cushion, Mesh Back, Armrests, Gas Lift Cylinder, 5-Star Base",
      "modelCharacteristics": "High-Detail Sheen Fabric PBR Textures"
    },
    "tags": [
      "chair",
      "operator-chair",
      "ergonomics",
      "control-room",
      "seating"
    ]
  },
  {
    "name": "Advanced Polymer Composite Specimen Block",
    "slug": "polymer-specimen",
    "category": "Injection Molding Machine",
    "description": "Molded polymer material specimen showcasing surface texture variants, flexural ribs, and mold lines.",
    "model_url": "/models/model_20.gltf",
    "image_url": "/models/thumbnails/thumb_20.svg",
    "specs": {
      "objectType": "Material Processing Sample Specimen",
      "industrialCategory": "Plastics Processing & Molding",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Molded Specimen Body, Structural Ribs, Texture Zones",
      "modelCharacteristics": "Multi-Material PBR Variant Specimen"
    },
    "tags": [
      "polymer",
      "injection-molding",
      "specimen",
      "material",
      "plastics"
    ]
  },
  {
    "name": "High-Temperature Ceramic Heat Shield Block",
    "slug": "ceramic-shield",
    "category": "Heat Exchanger",
    "description": "Precision investment cast ceramic specimen exhibiting high thermal dissipation geometry and density.",
    "model_url": "/models/model_21.gltf",
    "image_url": "/models/thumbnails/thumb_21.svg",
    "specs": {
      "objectType": "Refractory Thermal Barrier",
      "industrialCategory": "Process Equipment & Thermal Systems",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Ceramic Body, Cooling Channels, Mounting Bosses",
      "modelCharacteristics": "High Poly Sculpted Ceramic Mesh"
    },
    "tags": [
      "ceramic",
      "heat-shield",
      "thermal",
      "refractory",
      "process"
    ]
  },
  {
    "name": "Control Room Modular Seating Console",
    "slug": "modular-console",
    "category": "Industrial Control Panel",
    "description": "Heavy industrial lounge console unit for plant monitoring rooms and dispatcher control centers.",
    "model_url": "/models/model_22.gltf",
    "image_url": "/models/thumbnails/thumb_22.svg",
    "specs": {
      "objectType": "Control Room Monitoring Lounge",
      "industrialCategory": "Industrial Automation & Electrical Controls",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Modular Cushions, Base Frame, Backrest, Armrests",
      "modelCharacteristics": "Soft Velvet PBR Shading Mesh"
    },
    "tags": [
      "console",
      "seating",
      "control-room",
      "lounge",
      "automation"
    ]
  },
  {
    "name": "Optical Translucency Material Calibration Plate",
    "slug": "translucency-calibration",
    "category": "Machine Tools",
    "description": "Translucent material calibration block for verifying X-Ray shell opacity and internal mesh visibility.",
    "model_url": "/models/model_23.gltf",
    "image_url": "/models/thumbnails/thumb_23.svg",
    "specs": {
      "objectType": "Optical Rendering Test Target",
      "industrialCategory": "Inspection & Quality Metrology",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Stacked Alpha Plates, Frame Base, Calibration Grid",
      "modelCharacteristics": "Alpha Blend & Cutout Test Mesh"
    },
    "tags": [
      "translucency",
      "alpha",
      "calibration",
      "optical",
      "metrology"
    ]
  },
  {
    "name": "Industrial Marine Hydrodynamic Specimen",
    "slug": "marine-specimen",
    "category": "Centrifugal Pump",
    "description": "Hydrodynamic aquatic specimen model displaying organic surface contours and fluid dynamic profiles.",
    "model_url": "/models/model_24.gltf",
    "image_url": "/models/thumbnails/thumb_24.svg",
    "specs": {
      "objectType": "Bio-Inspired Hydrodynamic Specimen",
      "industrialCategory": "Pumps & Fluid Handling",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Body Shell, Fin Foil Surfaces, Tail Propulsor, Internal Skeleton",
      "modelCharacteristics": "High Poly Organic Surface Mesh"
    },
    "tags": [
      "marine",
      "hydrodynamic",
      "specimen",
      "fluid-dynamics",
      "bio-inspired"
    ]
  },
  {
    "name": "Subdivision Geometry Mesh Test Fixture",
    "slug": "subdivision-fixture",
    "category": "Machine Tools",
    "description": "Multi-part mechanical test block showing instanced fastener array, mounting bosses, and datum planes.",
    "model_url": "/models/model_25.gltf",
    "image_url": "/models/thumbnails/thumb_25.svg",
    "specs": {
      "objectType": "Instanced Fastener Test Block",
      "industrialCategory": "CNC Machining & Subtractive Manufacturing",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Base Block, 25x Hex Bolt Instances, Datum Plane",
      "modelCharacteristics": "GPU Instanced Mesh Geometry"
    },
    "tags": [
      "instancing",
      "test-fixture",
      "fasteners",
      "machining",
      "cad"
    ]
  },
  {
    "name": "Thermal Gradient Color Mapping Test Block",
    "slug": "thermal-mapping-block",
    "category": "Transformer",
    "description": "Finite element analysis thermal gradient block mapping vertex color temperatures from 200°C to 1200°C.",
    "model_url": "/models/model_26.gltf",
    "image_url": "/models/thumbnails/thumb_26.svg",
    "specs": {
      "objectType": "FEA Thermal Stress Test Block",
      "industrialCategory": "High Voltage Power Distribution",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Gradient Mesh Cylinder, Internal Temperature Core",
      "modelCharacteristics": "Per-Vertex Color Thermal Map Mesh"
    },
    "tags": [
      "thermal",
      "fea",
      "vertex-colors",
      "simulation",
      "stress-analysis"
    ]
  },
  {
    "name": "Kinematic Actuated Enclosure Box Unit",
    "slug": "enclosure-box",
    "category": "Industrial Control Panel",
    "description": "Hinged industrial enclosure box featuring animated door latching mechanism and mounting tabs.",
    "model_url": "/models/model_27.gltf",
    "image_url": "/models/thumbnails/thumb_27.svg",
    "specs": {
      "objectType": "Kinematic Electrical Enclosure",
      "industrialCategory": "Industrial Automation & Electrical Controls",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Enclosure Body, Hinged Door, Toggle Latches, Backplate",
      "modelCharacteristics": "Kinematic Animated Mesh"
    },
    "tags": [
      "enclosure",
      "box",
      "kinematics",
      "nema",
      "control-panel"
    ]
  },
  {
    "name": "Matte Finish Non-Reflective Testing Block",
    "slug": "unlit-test-block",
    "category": "Machine Tools",
    "description": "Diffuse non-reflective reference block for calibrating studio lighting and ambient shadow occlusion.",
    "model_url": "/models/model_28.gltf",
    "image_url": "/models/thumbnails/thumb_28.svg",
    "specs": {
      "objectType": "Diffuse Shading Reference Target",
      "industrialCategory": "Inspection & Quality Metrology",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Unlit Target Cube, Calibration Text Overlay",
      "modelCharacteristics": "Unlit Material Shading Mesh"
    },
    "tags": [
      "unlit",
      "diffuse",
      "calibration",
      "shading",
      "metrology"
    ]
  },
  {
    "name": "Bio-Mechanical Quadruped Actuator Unit",
    "slug": "quadruped-robot",
    "category": "Robotic Arm",
    "description": "4-legged bio-inspired mobile inspection robot chassis with multi-joint leg linkages and torso frame.",
    "model_url": "/models/model_29.gltf",
    "image_url": "/models/thumbnails/thumb_29.svg",
    "specs": {
      "objectType": "Autonomous Mobile Quadruped",
      "industrialCategory": "Robotics & Automated Manufacturing",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Torso Frame, 4x Leg Linkages, 12x Joint Servos, Sensor Head",
      "modelCharacteristics": "High Poly Bio-Robotic CAD Assembly"
    },
    "tags": [
      "quadruped",
      "robot",
      "inspection-robot",
      "robotics",
      "automation"
    ]
  },
  {
    "name": "Hydrodynamic Avian Aerofoil Specimen",
    "slug": "aerofoil-specimen",
    "category": "Industrial Fan",
    "description": "Aerodynamic aerofoil calibration model demonstrating wing profile curvature and fluid flow streamlines.",
    "model_url": "/models/model_30.gltf",
    "image_url": "/models/thumbnails/thumb_30.svg",
    "specs": {
      "objectType": "Aerodynamic Aerofoil Reference Standard",
      "industrialCategory": "HVAC & Process Air Systems",
      "visualizationType": "Solid / Wireframe Topology / Translucent X-Ray Shell",
      "componentStructure": "Aerofoil Body, Trailing Edge, Internal Rib Skeleton",
      "modelCharacteristics": "Smooth Curved Aerofoil Mesh"
    },
    "tags": [
      "aerofoil",
      "aerodynamics",
      "cfd",
      "fan-blade",
      "hvac"
    ]
  }
];

export async function seedSpatialHubDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure System Organization exists
    let orgRes = await client.query(`SELECT id FROM organizations WHERE name = 'I3DION Spatial System' LIMIT 1`);
    let orgId;
    if (orgRes.rows.length === 0) {
      const newOrg = await client.query(`
        INSERT INTO organizations (name, website, profile, primary_color)
        VALUES ('I3DION Spatial System', 'https://i3-dion-spatial.vercel.app', 'Official System Organization', '#2563EB')
        RETURNING id
      `);
      orgId = newOrg.rows[0].id;
    } else {
      orgId = orgRes.rows[0].id;
    }

    // 2. Insert/Update 30 Spatial Hub Models into database `products` table
    for (const item of SEED_MODELS) {
      await client.query(`
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
      `, [
        orgId, item.name, item.slug, item.category, item.description,
        item.model_url, item.image_url, JSON.stringify(item.specs), item.tags,
        `/product/${item.slug}`
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
