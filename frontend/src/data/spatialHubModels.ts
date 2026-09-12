// Master 30-Model Curated Dataset for I3DION Spatial Hub
// Every model has its own unique 3D asset file (/models/model_X.gltf) and thumbnail image file (/models/thumbnails/thumb_X.svg).

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

export const SPATIAL_HUB_MODELS: SpatialHubModel[] = [
  {
    id: 'hub-01',
    name: 'Heavy Duty Planetary Speed Reducer',
    slug: 'industrial-gearbox',
    category: 'Industrial Gearbox',
    shortDescription: 'Mechanical transmission assembly showcasing planetary gear set, sun gear, carrier, and enclosed housing.',
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
      modelCharacteristics: 'Manifold CAD Geometry, Clean Mesh Topology, Sub-assembly Nodes'
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
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-02',
    name: '3-Phase AC Induction Electric Motor',
    slug: 'electric-motor',
    category: 'Electric Motor',
    shortDescription: 'Industrial asynchronous electric motor displaying stator windings, rotor shaft, cooling fins, and terminal box.',
    longDescription: 'Enclosed fan-cooled (TEFC) 3-phase induction motor assembly. Features detailed cooling fins, internal rotor core assembly, copper winding heads, and end-shield bearing housings for mechanical and electrical engineering preview.',
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
      objectType: 'Rotating Electrical Machine',
      industrialCategory: 'Motors & Actuators',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Stator Frame, Rotor Shaft, Winding Assemblies, Cooling Fan, Terminal Enclosure',
      modelCharacteristics: 'Subdivision Surface Mesh, Balanced Rotational Inertia Geometry'
    },
    features: [
      'Full internal rotor and stator core X-Ray view',
      'Detailed thermal dissipate cooling fin exterior geometry',
      'Interactive 360-degree rotation and explosion depth preview',
      'Real-time AR spatial anchor support'
    ],
    tags: ['motor', 'electric', 'induction', 'stator', 'rotor', 'machinery'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Engineering Visualization Open Repository',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF / OBJ',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-03',
    name: 'Single-Stage End Suction Centrifugal Pump',
    slug: 'centrifugal-pump',
    category: 'Centrifugal Pump',
    shortDescription: 'Fluid handling pump assembly showing volute casing, closed impeller, wear rings, and mechanical shaft seal.',
    longDescription: 'Standard industrial centrifugal pump for liquid transfer applications. Highlights the internal hydrodynamic impeller vanes, suction flange, discharge nozzle, and stuffing box arrangement under X-Ray inspection mode.',
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
      objectType: 'Hydrodynamic Fluid Machinery',
      industrialCategory: 'Pumps & Fluid Handling',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Volute Casing, Closed Impeller, Shaft Sleeve, Mechanical Seal, Flanges',
      modelCharacteristics: 'Clean CAD Surface Reconstruction, Low Quad-Poly Count'
    },
    features: [
      'Volute casing translucency for internal fluid path inspection',
      'Curved impeller blade geometry in Wireframe mode',
      'Standard industrial DIN/ANSI flanged connection details',
      'Desktop to mobile AR QR link generation'
    ],
    tags: ['pump', 'centrifugal', 'fluid-dynamics', 'impeller', 'hydraulics'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Open Mechanical CAD Library',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'STEP',
      optimizedFormat: 'Binary glTF (GLB)'
    }
  },
  {
    id: 'hub-04',
    name: 'Rotary Screw Industrial Air Compressor',
    slug: 'air-compressor',
    category: 'Air Compressor',
    shortDescription: 'Twin-screw positive displacement air compressor unit demonstrating helical male and female rotors.',
    longDescription: 'Continuous-duty rotary screw compressor assembly. Reveals interlocking male/female helical rotors, oil separator manifold, and intake filter housing for air compression system studies.',
    thumbnail: '/models/thumbnails/thumb_4.svg',
    modelUrl: '/models/model_4.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 980,
    likesCount: 275,
    downloadsCount: 110,
    metadata: {
      objectType: 'Positive Displacement Gas Compressor',
      industrialCategory: 'Pneumatics & Compressed Air Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Helical Rotor Pair, Compressor Air-End Casing, Bearings, Intake Manifold',
      modelCharacteristics: 'High Precision Helical Mesh Profile, Enclosed Chassis Geometry'
    },
    features: [
      'Twin interlocking rotor profile visualization',
      'Translucent air-end body reveal under X-Ray mode',
      'Precision wireframe mesh grid mapping',
      'WebAR instant placement on factory floor'
    ],
    tags: ['compressor', 'pneumatics', 'air-end', 'rotary-screw', 'industrial'],
    source: {
      repository: 'Engineering Open Model Repository',
      author: 'Industrial Machinery CAD Project',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-05',
    name: 'Variable Displacement Axial Piston Hydraulic Pump',
    slug: 'hydraulic-pump',
    category: 'Hydraulic Pump',
    shortDescription: 'High-pressure hydraulic axial piston pump showing swashplate angle mechanism, cylinder barrel, and pistons.',
    longDescription: 'Swashplate design axial piston pump used in fluid power applications. Demonstrates piston slipper pads, rotating cylinder block, valve plate, and control displacement piston in X-Ray structural mode.',
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
      objectType: 'Fluid Power Displacement Generator',
      industrialCategory: 'Hydraulics & Fluid Power',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Swashplate, Cylinder Barrel, Pistons, Slipper Pads, Shaft & Valve Plate',
      modelCharacteristics: 'Detailed Kinematic Mechanism Geometry, Sub-millimeter Tolerance CAD'
    },
    features: [
      'Angle-adjustable swashplate mechanism model',
      'Piston stroke array visible inside translucent cylinder block',
      'High contrast Wireframe mechanical contour lines',
      'Direct mobile AR viewing capability'
    ],
    tags: ['hydraulic-pump', 'axial-piston', 'swashplate', 'hydraulics', 'fluid-power'],
    source: {
      repository: 'Open Industrial CAD Vault',
      author: 'Fluid Power Mechanics Guild',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-06',
    name: 'High-Pressure Flanged Globe Valve Assembly',
    slug: 'industrial-valve',
    category: 'Industrial Valve',
    shortDescription: 'Flanged linear-motion globe valve featuring handwheel actuator, threaded stem, valve plug, and seat ring.',
    longDescription: 'Heavy-duty industrial globe valve engineered for fluid throttling and flow control. Shows internal seat orifice, parabolic plug profile, packing gland, and heavy cast body flanges in full X-Ray cutaway clarity.',
    thumbnail: '/models/thumbnails/thumb_6.svg',
    modelUrl: '/models/model_6.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 890,
    likesCount: 220,
    downloadsCount: 95,
    metadata: {
      objectType: 'Linear Flow Regulation Valve',
      industrialCategory: 'Piping & Flow Control',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Valve Body, Bonnet, Stem, Plug Disc, Seat Ring, Handwheel Actuator',
      modelCharacteristics: 'Standard Flange Drilling CAD Pattern, Clean Solid Surface Body'
    },
    features: [
      'Flow throttling orifice cutaway visualization',
      'Translucent bonnet revealing threaded stem travel path',
      'Wireframe topology overlay for wall thickness analysis',
      'AR experience ready with zero installation'
    ],
    tags: ['valve', 'globe-valve', 'piping', 'flow-control', 'flange'],
    source: {
      repository: 'Process Engineering Models Repository',
      author: 'Flow Control CAD Library',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-07',
    name: 'Shell and Tube Industrial Heat Exchanger',
    slug: 'heat-exchanger',
    category: 'Heat Exchanger',
    shortDescription: 'Industrial thermal exchanger showing outer shell vessel, tube bundle array, baffles, and channel heads.',
    longDescription: 'Two-pass shell and tube heat exchanger assembly. Displays the internal tube bundle array, transverse segment baffles, stationary tube sheet, and fluid inlet/outlet nozzles for process thermal transfer illustration.',
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
      objectType: 'Thermal Energy Transfer Apparatus',
      industrialCategory: 'Process Equipment & Thermal Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Outer Cylindrical Shell, Tube Bundle, Segmental Baffles, Tubesheet, Channel Bonnet',
      modelCharacteristics: 'Pattern Array Tube Geometry, Structural Vessel Supports'
    },
    features: [
      'Translucent shell revealing internal tube bundle layout',
      'Segmental baffle arrangement highlighted in blue accent',
      'Precise tube sheet layout in Wireframe inspection mode',
      'QR code scan to mobile AR floor scale projection'
    ],
    tags: ['heat-exchanger', 'shell-and-tube', 'thermal', 'process-equipment', 'vessel'],
    source: {
      repository: 'Process Engineering Models Repository',
      author: 'Thermal Design Open Consortium',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-08',
    name: 'ASME Horizontal Industrial Pressure Vessel',
    slug: 'pressure-vessel',
    category: 'Pressure Vessel',
    shortDescription: 'Horizontal cylindrical storage vessel with ellipsoidal heads, manway access port, and saddle supports.',
    longDescription: 'Heavy-wall pressure vessel designed for industrial gas or liquid storage under pressure. Includes dished head geometry, reinforced manhole neck, instrument nozzles, and heavy structural steel mounting saddles.',
    thumbnail: '/models/thumbnails/thumb_8.svg',
    modelUrl: '/models/model_8.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 760,
    likesCount: 195,
    downloadsCount: 85,
    metadata: {
      objectType: 'Pressurized Storage Vessel',
      industrialCategory: 'Storage & Containment Infrastructure',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cylindrical Shell, Ellipsoidal Heads, Saddle Supports, Manway Access, Nozzle Connections',
      modelCharacteristics: 'Seated Structural Frame, Thick Wall Surface CAD Mesh'
    },
    features: [
      'Internal volume inspection via X-Ray translucent shell',
      'Structural saddle mount beam geometry detail',
      'Wireframe edge loops showing nozzle reinforcement rings',
      'AR 1:1 true-to-scale plant layout preview'
    ],
    tags: ['pressure-vessel', 'asme', 'storage-tank', 'process-plant', 'containment'],
    source: {
      repository: 'Open Industrial CAD Vault',
      author: 'Vessel Engineering Association',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-09',
    name: 'Automated Industrial Roller Conveyor Section',
    slug: 'conveyor-assembly',
    category: 'Conveyor Assembly',
    shortDescription: 'Modular powered roller conveyor segment featuring steel rollers, drive chain, motor drive, and side frames.',
    longDescription: 'Factory automation roller conveyor section used in material handling and logistics lines. Features precision bearing steel rollers, chain-and-sprocket drive system, side guide rails, and integrated electric motor drive.',
    thumbnail: '/models/thumbnails/thumb_9.svg',
    modelUrl: '/models/model_9.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1050,
    likesCount: 280,
    downloadsCount: 140,
    metadata: {
      objectType: 'Material Handling Equipment',
      industrialCategory: 'Intralogistics & Conveyance Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Roller Axles, Steel Tubes, Sprocket Assembly, Frame Channels, Gearmotor Mount',
      modelCharacteristics: 'Linear Array Component Repeater Mesh, Clean Industrial Finish'
    },
    features: [
      'Modular roller drive mechanism visualization',
      'Drive chain enclosure translucent overlay in X-Ray',
      'Frame structural channel geometry in Wireframe',
      'AR floor line placement for warehouse planning'
    ],
    tags: ['conveyor', 'roller-conveyor', 'automation', 'material-handling', 'logistics'],
    source: {
      repository: 'Robotics & Logistics Models Repository',
      author: 'Factory Automation Open Group',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-10',
    name: '6-Axis Articulated Industrial Robot Arm',
    slug: 'robotic-arm',
    category: 'Robotic Arm',
    shortDescription: 'High-payload articulated robot arm showing base joint, upper arm, wrist assembly, and internal servo motors.',
    longDescription: 'Precision 6-DOF industrial robot arm used for automated welding, material handling, and assembly. Displays hollow arm castings, cycloidal gear drives, internal cabling routing, and tool mounting flange under X-Ray mode.',
    thumbnail: '/models/thumbnails/thumb_10.svg',
    modelUrl: '/models/model_10.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 2450,
    likesCount: 780,
    downloadsCount: 490,
    metadata: {
      objectType: 'Articulated Manipulator System',
      industrialCategory: 'Robotics & Automated Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Base Axis, Shoulder, Elbow, Wrist Axes J1-J6, Tool Flange, Servo Housing',
      modelCharacteristics: 'Multi-body Kinematic Joint Rigging Ready, Industrial High-Detail CAD'
    },
    features: [
      'Translucent outer arm castings revealing internal servo drives',
      'Joint axis rotation reference lines in Wireframe mode',
      'Standard ISO tool mounting flange detail',
      'Full AR work-cell reach envelope visualization'
    ],
    tags: ['robotics', 'robot-arm', 'automation', '6-axis', 'articulated-robot'],
    source: {
      repository: 'Robotics & Logistics Models Repository',
      author: 'Open Robotics Hardware Initiative',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-11',
    name: 'Heavy-Duty Centrifugal Draft Fan Assembly',
    slug: 'industrial-fan',
    category: 'Industrial Fan',
    shortDescription: 'Industrial backward-curved centrifugal blower fan with scroll housing, wheel impeller, and drive shaft.',
    longDescription: 'Large-scale industrial centrifugal fan designed for process air movement and ventilation. Demonstrates scroll housing geometry, backward-curved impeller blades, shaft bearings, and motor belt-drive guard.',
    thumbnail: '/models/thumbnails/thumb_11.svg',
    modelUrl: '/models/model_11.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 920,
    likesCount: 235,
    downloadsCount: 105,
    metadata: {
      objectType: 'Industrial Aerodynamic Air Handler',
      industrialCategory: 'HVAC & Process Air Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Scroll Volute Casing, Fan Wheel, Shaft Bearings, Pedestal Frame, Inlet Cone',
      modelCharacteristics: 'Curved Aerofoil Impeller Vanes, Sheet Metal Casing Topology'
    },
    features: [
      'Scroll casing translucent view highlighting impeller wheel position',
      'Curved aerofoil blade mesh pattern in Wireframe mode',
      'Heavy structural pedestal base frame detail',
      'WebAR facility layout positioning'
    ],
    tags: ['industrial-fan', 'centrifugal-blower', 'hvac', 'air-handling', 'ventilation'],
    source: {
      repository: 'HVAC CAD Models Vault',
      author: 'Air Movement CAD Community',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-12',
    name: 'Standby Diesel Industrial Power Generator Unit',
    slug: 'industrial-generator',
    category: 'Generator',
    shortDescription: 'Enclosed stationary power generator combining a diesel engine, alternator core, and soundproof canopy.',
    longDescription: 'Heavy-duty backup power generator set. Reveals internal multi-cylinder diesel engine block, brushless synchronous alternator, radiator cooling package, and control panel inside an acoustic enclosure.',
    thumbnail: '/models/thumbnails/thumb_12.svg',
    modelUrl: '/models/model_12.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1530,
    likesCount: 410,
    downloadsCount: 220,
    metadata: {
      objectType: 'Engine-Driven Electrical Generator Set',
      industrialCategory: 'Power Generation & Energy Storage',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Diesel Engine Block, Alternator Stator/Rotor, Radiator, Base Fuel Tank, Canopy',
      modelCharacteristics: 'Heavy Modular Enclosure CAD, Internal Engine Assembly Geometry'
    },
    features: [
      'Acoustic canopy translucency showing engine-alternator coupling',
      'Radiator core wireframe grid density visualization',
      'Base skid fuel tank structural cross-section',
      'AR spatial room fitting preview'
    ],
    tags: ['generator', 'diesel-generator', 'power-gen', 'alternator', 'backup-power'],
    source: {
      repository: 'Energy Equipment Open Repository',
      author: 'Power Genset CAD Library',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-13',
    name: 'Multi-Stage Industrial Steam Turbine',
    slug: 'steam-turbine',
    category: 'Turbine',
    shortDescription: 'High-pressure steam turbine featuring bladed rotor shaft, stationary nozzles, and split casing halves.',
    longDescription: 'Thermal power generation steam turbine assembly. Highlights multi-stage rotor disk blades, nozzle guide vanes, labyrinth shaft seals, and heavy bolted horizontal casing joint under X-Ray inspection mode.',
    thumbnail: '/models/thumbnails/thumb_13.svg',
    modelUrl: '/models/model_13.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1980,
    likesCount: 620,
    downloadsCount: 350,
    metadata: {
      objectType: 'Thermal Turbomachinery',
      industrialCategory: 'Power Generation & Turbomachinery',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Rotor Shaft, High/Low Pressure Turbine Blades, Casing Shell, Labyrinth Seals, Bearings',
      modelCharacteristics: 'High Density Aerofoil Blade Array Mesh, Complex Split-Casing CAD'
    },
    features: [
      'Translucent casing exposing multi-stage rotor blading',
      'Detailed aerofoil blade profiles in Wireframe mode',
      'Horizontal casing joint flange and bolting details',
      'Interactive WebAR turbine hall preview'
    ],
    tags: ['steam-turbine', 'turbine', 'power-plant', 'rotor-blades', 'turbomachinery'],
    source: {
      repository: 'Energy Equipment Open Repository',
      author: 'Turbomachinery Engineering Guild',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-14',
    name: 'Double-Acting Tie-Rod Hydraulic Cylinder',
    slug: 'hydraulic-cylinder',
    category: 'Hydraulic Cylinder',
    shortDescription: 'Industrial fluid power linear actuator displaying chrome piston rod, barrel cylinder, piston seals, and end caps.',
    longDescription: 'NFPA standard tie-rod hydraulic cylinder for heavy machinery actuation. Shows ground chrome piston rod, internal piston assembly, poly-urethane wiper seals, steel tie rods, and port connections in X-Ray cutaway mode.',
    thumbnail: '/models/thumbnails/thumb_14.svg',
    modelUrl: '/models/model_14.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 880,
    likesCount: 215,
    downloadsCount: 100,
    metadata: {
      objectType: 'Linear Fluid Power Actuator',
      industrialCategory: 'Hydraulics & Mechanical Actuators',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cylinder Barrel, Piston Rod, Piston Head, Tie Rods, Clevis Mount, Rod Bushing',
      modelCharacteristics: 'Precision Cylindrical Machined Geometry, Quad Surface Topology'
    },
    features: [
      'Translucent barrel cutaway showing piston seal package',
      'Chrome rod surface finish reflection and Wireframe mesh grid',
      'Tie-rod tension assembly geometric detail',
      'AR 1:1 scale stroke verification'
    ],
    tags: ['hydraulic-cylinder', 'actuator', 'hydraulics', 'piston', 'fluid-power'],
    source: {
      repository: 'Open Industrial CAD Vault',
      author: 'Fluid Power Mechanics Guild',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-15',
    name: 'Double-Row Tapered Roller Bearing Assembly Block',
    slug: 'bearing-assembly',
    category: 'Bearing Assembly',
    shortDescription: 'Heavy-duty industrial bearing block housing showing outer cup, inner cone, tapered rollers, and retaining cage.',
    longDescription: 'High load capacity tapered roller bearing assembly designed for heavy radial and axial shaft loads. Demonstrates precision roller element array, cage pocket alignment, inner ring raceway, and outer cup in X-Ray view.',
    thumbnail: '/models/thumbnails/thumb_15.svg',
    modelUrl: '/models/model_15.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1670,
    likesCount: 480,
    downloadsCount: 290,
    metadata: {
      objectType: 'Precision Rolling Element Bearing',
      industrialCategory: 'Mechanical Components & Bearings',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Outer Ring (Cup), Inner Ring (Cone), Tapered Rollers, Stamped Steel Cage',
      modelCharacteristics: 'Sub-micron Surface Tolerance Geometry, Radial Array Pattern Mesh'
    },
    features: [
      'X-Ray translucent outer cup revealing tapered roller array',
      'Raceway contact angle wireframe line geometry',
      'Detailed roller retainer cage structure',
      'AR tabletop component inspection'
    ],
    tags: ['bearing', 'tapered-roller', 'mechanical-component', 'tribology', 'powertrain'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Bearing Engineering Open CAD Project',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-16',
    name: 'Compound Helical Gear Train Assembly',
    slug: 'gear-train',
    category: 'Gear Train',
    shortDescription: 'Multi-shaft gear reduction assembly featuring precision helical spur gears, keyways, and support shafts.',
    longDescription: 'Compound gear train configuration showing progressive gear ratio stages. Features angled helical gear teeth for quiet high-torque operation, keyed shaft mountings, and shoulder retaining rings for mechanical transmission analysis.',
    thumbnail: '/models/thumbnails/thumb_16.svg',
    modelUrl: '/models/model_16.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1220,
    likesCount: 340,
    downloadsCount: 175,
    metadata: {
      objectType: 'Mechanical Gear Transmission Train',
      industrialCategory: 'Power Transmission & Drive Technology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Helical Pinion, Driven Gear, Intermediate Shafts, Keyway Slots, Shaft Collars',
      modelCharacteristics: 'Involute Tooth Profile Curve Mesh, Precision Mesh Alignment'
    },
    features: [
      'Helical tooth engagement mesh line visualization',
      'Involute tooth profile detail under Wireframe mode',
      'X-Ray shaft keyway alignment inspection',
      'AR spatial anchor desktop interactive preview'
    ],
    tags: ['gear-train', 'helical-gears', 'gears', 'powertrain', 'mechanical'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Precision Gears Open Library',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-17',
    name: 'Flexible Metallic Disc Shaft Coupling Assembly',
    slug: 'coupling-assembly',
    category: 'Coupling Assembly',
    shortDescription: 'Zero-backlash flexible disc coupling connecting two rotating shafts while accommodating angular misalignment.',
    longDescription: 'High-performance flexible disc coupling used between motor shafts and driven machinery. Features stainless steel disc packs, precision fitted shoulder bolts, drive hubs, and center spacer member under X-Ray inspection.',
    thumbnail: '/models/thumbnails/thumb_17.svg',
    modelUrl: '/models/model_17.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 810,
    likesCount: 205,
    downloadsCount: 90,
    metadata: {
      objectType: 'Flexible Shaft Coupling',
      industrialCategory: 'Power Transmission & Couplings',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Drive Hubs, Stainless Steel Disc Pack, Center Spacer, Precision Reamed Bolts',
      modelCharacteristics: 'Stacked Sheet Metal Disc Geometry, Symmetric Bolting Pattern'
    },
    features: [
      'Disc pack lamination stack X-Ray detail',
      'Torque bolt clamping pattern in Wireframe mode',
      'Shaft bore keyway geometry preview',
      'AR desktop model inspection'
    ],
    tags: ['coupling', 'shaft-coupling', 'flexible-disc', 'powertrain', 'mechanical'],
    source: {
      repository: 'Open Mechanical CAD Library',
      author: 'Coupling Technology Consortium',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-18',
    name: 'Pneumatic Actuated Butterfly Valve Spool Segment',
    slug: 'pipe-valve-assembly',
    category: 'Pipe Valve Assembly',
    shortDescription: 'Process piping spool segment incorporating a pneumatic rotary actuator and resilient-seated butterfly valve.',
    longDescription: 'Automated process piping segment with quarter-turn pneumatic actuator. Shows disc shaft alignment, elastomer seat seal, body liner, indicator position beacon, and pipe flange mounting gaskets in full X-Ray cutaway.',
    thumbnail: '/models/thumbnails/thumb_18.svg',
    modelUrl: '/models/model_18.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 940,
    likesCount: 240,
    downloadsCount: 115,
    metadata: {
      objectType: 'Automated Pipeline Isolation Assembly',
      industrialCategory: 'Piping & Automated Valves',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Pneumatic Rack-and-Pinion Actuator, Butterfly Valve Disc, Elastomer Seat, Pipe Spool',
      modelCharacteristics: 'Dual-Body CAD Assembly, Standard Process Piping Flange'
    },
    features: [
      'Pneumatic rack-and-pinion actuator internal X-Ray view',
      'Disc quarter-turn closure profile in Wireframe',
      'Flange bolt circle alignment reference points',
      'AR pipeline integration mockup'
    ],
    tags: ['butterfly-valve', 'pneumatic-actuator', 'piping', 'process-control', 'valve'],
    source: {
      repository: 'Process Engineering Models Repository',
      author: 'Piping Design Open Project',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-19',
    name: 'Vertical Multistage Submersible Water Booster Pump',
    slug: 'water-pump',
    category: 'Water Pump',
    shortDescription: 'Vertical inline multistage water pressure booster pump with stacked impeller bowls and shaft coupling.',
    longDescription: 'High-pressure vertical multistage centrifugal pump for municipal water treatment and booster stations. Displays stacked stainless steel impellers, diffuser bowls, outer sleeve, and NEMA motor adapter pedestal under X-Ray mode.',
    thumbnail: '/models/thumbnails/thumb_19.svg',
    modelUrl: '/models/model_19.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1100,
    likesCount: 295,
    downloadsCount: 150,
    metadata: {
      objectType: 'Multistage Vertical Hydrodynamic Pump',
      industrialCategory: 'Water Treatment & Fluid Supply',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Stacked Impeller Bowls, Diffusers, Stainless Sleeve, Pump Shaft, Motor Pedestal',
      modelCharacteristics: 'Vertical Array Stack Mesh, Precision Sheet-Metal Impeller Blades'
    },
    features: [
      'Translucent outer stainless sleeve exposing stacked impeller stages',
      'Diffuser vane curvature in Wireframe view',
      'Inline suction and discharge port geometry detail',
      'AR vertical skid installation planning'
    ],
    tags: ['water-pump', 'multistage-pump', 'vertical-pump', 'booster', 'water-treatment'],
    source: {
      repository: 'Open Industrial CAD Vault',
      author: 'Water Infrastructure CAD Initiative',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-20',
    name: 'Inverter Multi-Process Robotic Welding Power Unit',
    slug: 'welding-machine',
    category: 'Welding Machine',
    shortDescription: 'Industrial arc welding power source enclosure showing internal transformer inverter stack, cooling fan, and wire feeder drive.',
    longDescription: 'Heavy manufacturing MIG/TIG inverter welding power supply. Reveals internal solid-state IGBT inverter modules, heavy copper high-frequency transformer core, cooling ducting, and wire spool drive mechanism inside a heavy steel enclosure.',
    thumbnail: '/models/thumbnails/thumb_20.svg',
    modelUrl: '/models/model_20.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1030,
    likesCount: 265,
    downloadsCount: 130,
    metadata: {
      objectType: 'Industrial Power Conversion Equipment',
      industrialCategory: 'Welding & Fabrication Equipment',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Inverter PCB Module, HF Transformer Core, Wire Drive Assembly, Chassis Enclosure',
      modelCharacteristics: 'Sheet Metal Enclosure with Internal Electronic CAD Components'
    },
    features: [
      'Chassis translucency exposing IGBT module and transformer core',
      'Wire feeder rollers and drive mechanism internal detail',
      'Front panel interface geometry in Wireframe mode',
      'AR workshop floor layout visualization'
    ],
    tags: ['welding-machine', 'inverter', 'mig-welder', 'fabrication', 'power-source'],
    source: {
      repository: 'Manufacturing Tooling Models Vault',
      author: 'Fabrication Tech Open Group',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-21',
    name: '5-Axis Vertical CNC Machining Center',
    slug: 'cnc-milling-center',
    category: 'CNC Machine',
    shortDescription: 'Enclosed 5-axis CNC milling machine showing tilting rotary trunnion table, high-speed spindle, and tool changer carousel.',
    longDescription: 'High-precision 5-axis vertical machining center used for aerospace and complex component milling. Features trunnion rotary B/C axes, 24-tool automatic tool changer (ATC), direct-drive 20,000 RPM spindle, and full machine enclosure under X-Ray mode.',
    thumbnail: '/models/thumbnails/thumb_21.svg',
    modelUrl: '/models/model_21.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 3100,
    likesCount: 940,
    downloadsCount: 620,
    metadata: {
      objectType: 'Multi-Axis Subtractive Machine Tool',
      industrialCategory: 'CNC Machining & Subtractive Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Spindle Head, Trunnion Table (B/C Axes), Linear Guide Way, ATC Arm, Machine Frame',
      modelCharacteristics: 'Kinematic Machine Bed Assembly, Sub-millimeter Tolerance CAD'
    },
    features: [
      'Enclosure translucency revealing spindle and 5-axis trunnion table',
      'Automatic tool changer carousel internal arm mechanism',
      'Linear guideway rail and ball screw Wireframe mesh tracking',
      'Full-scale AR machine shop footprint simulation'
    ],
    tags: ['cnc', '5-axis', 'machining-center', 'milling', 'machine-tool', 'manufacturing'],
    source: {
      repository: 'Manufacturing Tooling Models Vault',
      author: 'Open CNC Machine Models Initiative',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-22',
    name: 'Heavy-Duty Column Industrial Drill Press Assembly',
    slug: 'industrial-drill-press',
    category: 'Industrial Drill',
    shortDescription: 'Precision geared-head column drilling machine featuring cast iron column, rack-and-pinion table, and spindle quill.',
    longDescription: 'Industrial column drill press engineered for heavy metal hole drilling. Displays belt/gear drive transmission box, precision spindle quill mechanism, T-slotted work table, and heavy cast base plate in clear X-Ray view.',
    thumbnail: '/models/thumbnails/thumb_22.svg',
    modelUrl: '/models/model_22.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 850,
    likesCount: 210,
    downloadsCount: 95,
    metadata: {
      objectType: 'Hole Manufacturing Machine Tool',
      industrialCategory: 'Workshop Machinery & Tooling',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cast Base, Ground Column, Geared Headstock, Spindle Quill, T-Slot Table, Depth Stop',
      modelCharacteristics: 'Cast Iron Solid Body Mesh, Threaded Elevation Screw'
    },
    features: [
      'Headstock translucency exposing spindle gear drive train',
      'Spindle quill extension splines in Wireframe mode',
      'T-slot table clamping surface geometry',
      'AR benchtop position evaluation'
    ],
    tags: ['drill-press', 'column-drill', 'machining', 'workshop', 'tooling'],
    source: {
      repository: 'Manufacturing Tooling Models Vault',
      author: 'Workshop Tooling Open Vault',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-23',
    name: 'High-Precision CNC Turning Lathe Machine',
    slug: 'cnc-lathe-machine',
    category: 'Lathe Machine',
    shortDescription: 'Industrial CNC turning lathe showing hydraulic 3-jaw chuck, 12-station servo turret, and slant-bed ways.',
    longDescription: 'Slant-bed CNC turning center for cylindrical component machining. Features 45-degree cast iron slant bed, high-torque main spindle chuck, 12-station VDI tool turret, and hydraulic tailstock assembly in full X-Ray cutaway.',
    thumbnail: '/models/thumbnails/thumb_23.svg',
    modelUrl: '/models/model_23.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1780,
    likesCount: 510,
    downloadsCount: 310,
    metadata: {
      objectType: 'Rotary Subtractive Machine Tool',
      industrialCategory: 'CNC Machining & Turning',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Slant Bed Frame, Main Spindle & Chuck, 12-Station Servo Turret, Carriage, Tailstock',
      modelCharacteristics: 'Rigid Slant-Bed Cast Frame Geometry, Multi-Component Turret Assembly'
    },
    features: [
      'Slant-bed casing translucency revealing turret index motor',
      'Hydraulic chuck internal master jaw wedges in Wireframe',
      'Linear carriage guideway alignment visualization',
      'AR factory cell layout planning'
    ],
    tags: ['cnc-lathe', 'turning-center', 'lathe', 'cnc', 'machining'],
    source: {
      repository: 'Manufacturing Tooling Models Vault',
      author: 'Open CNC Machine Models Initiative',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-24',
    name: 'Universal Horizontal/Vertical Milling Machine',
    slug: 'milling-machine',
    category: 'Milling Machine',
    shortDescription: 'Knee-and-column universal milling machine featuring swiveling vertical head, horizontal arbor, and feed gearbox.',
    longDescription: 'Toolroom universal milling machine equipped with dual vertical and horizontal spindles. Demonstrates knee elevation screw, saddle cross-feed mechanism, table longitudinal power feed, and spindle gear speed box in X-Ray mode.',
    thumbnail: '/models/thumbnails/thumb_24.svg',
    modelUrl: '/models/model_24.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1150,
    likesCount: 320,
    downloadsCount: 165,
    metadata: {
      objectType: 'Knee-and-Column Milling Machine',
      industrialCategory: 'Workshop Machinery & Tooling',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Column Casting, Knee Assembly, Saddle, Swivel Worktable, Vertical Head, Arbor Support',
      modelCharacteristics: 'Heavy Ribbed Cast Iron Geometry, Precision Lead Screw Threads'
    },
    features: [
      'Column translucency displaying internal speed selector gear train',
      'Knee elevation lead screw thread profile in Wireframe',
      'Dovetail slideway ground surface geometry detail',
      'AR shop floor positioning preview'
    ],
    tags: ['milling-machine', 'universal-mill', 'knee-mill', 'machining', 'toolroom'],
    source: {
      repository: 'Manufacturing Tooling Models Vault',
      author: 'Toolroom Machinery Open Group',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-25',
    name: 'Hydraulic Plastic Injection Molding System',
    slug: 'injection-molding-machine',
    category: 'Injection Molding Machine',
    shortDescription: 'Industrial plastic molding press showing hydraulic toggle clamp unit, reciprocating plasticizing screw, and barrel heaters.',
    longDescription: 'Heavy-tonnage plastic injection molding machine. Reveals double-toggle hydraulic clamping mechanism, heated injection barrel, reciprocating screw drive, hopper, and mold platen tie-bars under X-Ray mode.',
    thumbnail: '/models/thumbnails/thumb_25.svg',
    modelUrl: '/models/model_25.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 2100,
    likesCount: 590,
    downloadsCount: 370,
    metadata: {
      objectType: 'Polymer Processing Machinery',
      industrialCategory: 'Plastics Processing & Molding',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Toggle Clamp Unit, Mold Platens, Tie-Bars, Injection Barrel & Screw, Hydraulic Unit',
      modelCharacteristics: 'High Tonnage Frame Geometry, Internal Plasticizing Screw Flighting'
    },
    features: [
      'Barrel translucency revealing reciprocating plasticizing screw flights',
      'Double-toggle linkage kinematic joints in Wireframe mode',
      'Heavy tie-bar tension cylinder cross-section',
      'WebAR factory footprint 1:1 scale preview'
    ],
    tags: ['injection-molding', 'plastics', 'molding-machine', 'toggle-clamp', 'polymer'],
    source: {
      repository: 'Manufacturing Tooling Models Vault',
      author: 'Plastics Machinery CAD Consortium',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-26',
    name: 'PLC Automation Industrial Control Panel Enclosure',
    slug: 'industrial-control-panel',
    category: 'Industrial Control Panel',
    shortDescription: 'NEMA 12 industrial electrical control enclosure featuring DIN-rail Programmable Logic Controller (PLC), VFD drives, and relays.',
    longDescription: 'Automation electrical control cabinet used in industrial automation. Shows backplate layout with main circuit breaker, 24V DC power supplies, modular PLC rack, Variable Frequency Drives (VFD), terminal blocks, and wire ducting under X-Ray inspection mode.',
    thumbnail: '/models/thumbnails/thumb_26.svg',
    modelUrl: '/models/model_26.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1460,
    likesCount: 395,
    downloadsCount: 205,
    metadata: {
      objectType: 'Industrial Automation Switchgear Enclosure',
      industrialCategory: 'Industrial Automation & Electrical Controls',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'NEMA Cabinet, Backplate, PLC Controller Rack, VFD Inverters, Relays, DIN Rails',
      modelCharacteristics: 'Modular Electrical Component CAD Assemblies, Wire Duct Channels'
    },
    features: [
      'Outer door translucency revealing backplate PLC and VFD layout',
      'DIN-rail component clip geometry in Wireframe mode',
      'Door-mounted HMI screen and pilot light cutouts',
      'AR wall-mount height and clearance check'
    ],
    tags: ['control-panel', 'plc', 'automation', 'vfd', 'electrical-cabinet', 'nema'],
    source: {
      repository: 'Electrical Equipment Open Vault',
      author: 'Automation Control Systems Guild',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-27',
    name: 'Oil-Immersed Step-Down Distribution Transformer',
    slug: 'industrial-transformer',
    category: 'Transformer',
    shortDescription: 'Medium-voltage power transformer displaying corrugated cooling radiators, high-voltage porcelain bushings, and conservator tank.',
    longDescription: 'Substation distribution transformer for industrial facility power distribution. Features corrugated sheet cooling walls, laminated silicon steel core, high-voltage ceramic bushings, oil level sight glass, and off-load tap changer in X-Ray view.',
    thumbnail: '/models/thumbnails/thumb_27.svg',
    modelUrl: '/models/model_27.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 1620,
    likesCount: 440,
    downloadsCount: 235,
    metadata: {
      objectType: 'Electromagnetic Energy Conversion Apparatus',
      industrialCategory: 'High Voltage Power Distribution',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Transformer Tank, HV Bushings, Laminated Core & Coils, Radiator Fins, Conservator',
      modelCharacteristics: 'Corrugated Radiator Surface CAD, Ceramic Bushing Shed Geometry'
    },
    features: [
      'Tank translucency showing laminated steel core and copper windings',
      'Porcelain bushing shed rings highlighted in Wireframe mode',
      'Corrugated radiator fin thermal dissipation geometry',
      'AR substation pad mounting layout'
    ],
    tags: ['transformer', 'power-distribution', 'high-voltage', 'substation', 'electrical'],
    source: {
      repository: 'Electrical Equipment Open Vault',
      author: 'High Voltage Electrical Consortium',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-28',
    name: 'Heavy-Capacity Electric Counterbalance Forklift',
    slug: 'industrial-forklift',
    category: 'Forklift / Industrial Vehicle',
    shortDescription: 'Industrial electric warehouse forklift displaying 2-stage clear-view mast, hydraulic lift cylinder, forks, and battery pack.',
    longDescription: 'Industrial material handling forklift truck. Features heavy cast rear counterweight, 2-stage telescopic mast, carriage tilt cylinders, solid rubber tires, overhead guard, and low-slung traction battery compartment in X-Ray view.',
    thumbnail: '/models/thumbnails/thumb_28.svg',
    modelUrl: '/models/model_28.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 2850,
    likesCount: 820,
    downloadsCount: 510,
    metadata: {
      objectType: 'Powered Industrial Truck',
      industrialCategory: 'Intralogistics & Mobile Equipment',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Chassis Frame, Counterweight, 2-Stage Mast, Fork Carriage, Battery Tray, Drive Axle',
      modelCharacteristics: 'Full Vehicle Assembly Geometry, Structural Roll-Cage Frame'
    },
    features: [
      'Chassis translucency exposing battery cell tray and drive motor axle',
      'Mast roller channel guideway in Wireframe mode',
      'Telescopic mast chain pulley detail',
      'AR 1:1 aisle clearance and turning radius simulation'
    ],
    tags: ['forklift', 'material-handling', 'industrial-vehicle', 'warehouse', 'logistics'],
    source: {
      repository: 'Robotics & Logistics Models Repository',
      author: 'Intralogistics Open Equipment Project',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-29',
    name: 'Motorized Screw Jack Linear Actuator Assembly',
    slug: 'screw-jack-assembly',
    category: 'Mechanical Jack / Lifting Assembly',
    shortDescription: 'Worm gear screw jack lifting mechanism showing trapezoidal acme screw, worm wheel drive, and housing.',
    longDescription: 'Industrial motorized lifting screw jack for heavy load synchronization. Demonstrates ductile iron housing, precision bronze worm gear wheel, alloy steel worm shaft, and ground acme lifting screw under X-Ray inspection mode.',
    thumbnail: '/models/thumbnails/thumb_29.svg',
    modelUrl: '/models/model_29.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 970,
    likesCount: 250,
    downloadsCount: 120,
    metadata: {
      objectType: 'Worm-Gear Mechanical Linear Actuator',
      industrialCategory: 'Lifting & Positioning Equipment',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Gearbox Housing, Worm Shaft, Bronze Worm Gear Nut, Acme Lifting Screw, Top Plate',
      modelCharacteristics: 'Trapezoidal Acme Thread Surface Profile, Machined Casting Body'
    },
    features: [
      'Gearbox body translucency showing bronze worm wheel engagement',
      'Trapezoidal thread pitch curve in Wireframe mode',
      'Top clevis/plate mounting interface detail',
      'AR synchronized lift rig layout preview'
    ],
    tags: ['screw-jack', 'linear-actuator', 'worm-gear', 'lifting', 'mechanical'],
    source: {
      repository: 'Open Mechanical CAD Library',
      author: 'Lifting Systems CAD Group',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  },
  {
    id: 'hub-30',
    name: 'Internal Combustion V6 Engine Block Assembly',
    slug: 'v6-engine-assembly',
    category: 'Engine / Engine Assembly',
    shortDescription: '60-degree V6 internal combustion engine block featuring pistons, crankshaft, connecting rods, valves, and camshafts.',
    longDescription: 'High-performance V6 engine block assembly showcasing internal powertrain mechanics. Displays forged steel crankshaft, piston assembly with wrist pins, dual overhead camshafts (DOHC), intake/exhaust valve train, and oil sump in complete X-Ray cutaway clarity.',
    thumbnail: '/models/thumbnails/thumb_30.svg',
    modelUrl: '/models/model_30.gltf',
    arEnabled: true,
    wireframeEnabled: true,
    xrayEnabled: true,
    solidEnabled: true,
    status: 'Published',
    viewsCount: 3450,
    likesCount: 1120,
    downloadsCount: 780,
    metadata: {
      objectType: 'Internal Combustion Kinematic Powertrain',
      industrialCategory: 'Automotive & Engine Technology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cylinder Block, Crankshaft, Pistons & Rods, DOHC Cylinder Heads, Valves, Timing Chain',
      modelCharacteristics: 'Complex Multi-Body Kinematic Engine Assembly, Sub-millimeter Tolerance CAD'
    },
    features: [
      'Complete engine block translucency exposing V6 piston array and crankshaft',
      'DOHC valve spring and camshaft profile in Wireframe view',
      'Intake manifold and exhaust runner geometry detail',
      'WebAR true 1:1 scale engine bay placement'
    ],
    tags: ['engine', 'v6-engine', 'powertrain', 'pistons', 'crankshaft', 'combustion'],
    source: {
      repository: 'Khronos Group Open Sample Assets',
      author: 'Automotive Engineering Open CAD Project',
      license: 'CC-BY 4.0 International',
      attributionRequired: true,
      originalFormat: 'glTF 2.0',
      optimizedFormat: 'glTF 2.0 JSON'
    }
  }
];

export function getSpatialHubModelBySlugOrId(slugOrId: string): SpatialHubModel | undefined {
  return SPATIAL_HUB_MODELS.find(
    m => m.slug === slugOrId || m.id === slugOrId
  );
}

export function searchSpatialHubModels(
  query: string,
  categoryFilter?: string,
  modeFilter?: string
): SpatialHubModel[] {
  const q = query.trim().toLowerCase();
  
  return SPATIAL_HUB_MODELS.filter(model => {
    const matchesQuery = !q || (
      model.name.toLowerCase().includes(q) ||
      model.category.toLowerCase().includes(q) ||
      model.shortDescription.toLowerCase().includes(q) ||
      model.longDescription.toLowerCase().includes(q) ||
      model.tags.some(t => t.toLowerCase().includes(q))
    );

    const matchesCategory = !categoryFilter || categoryFilter === 'All' || model.category === categoryFilter;

    let matchesMode = true;
    if (modeFilter && modeFilter !== 'All') {
      if (modeFilter === 'AR') matchesMode = model.arEnabled;
      else if (modeFilter === 'Wireframe') matchesMode = model.wireframeEnabled;
      else if (modeFilter === 'X-Ray') matchesMode = model.xrayEnabled;
      else if (modeFilter === 'Solid') matchesMode = model.solidEnabled;
    }

    return matchesQuery && matchesCategory && matchesMode;
  });
}
