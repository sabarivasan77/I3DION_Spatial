import { pool } from './pool.js';

export const SEED_MODELS = [
  {
    name: 'Heavy Duty Planetary Speed Reducer',
    slug: 'industrial-gearbox',
    category: 'Industrial Gearbox',
    description: 'Mechanical transmission assembly showcasing planetary gear set, sun gear, carrier, and enclosed housing.',
    model_url: '/models/model_1.gltf',
    image_url: '/models/thumbnails/thumb_1.svg',
    specs: {
      objectType: 'Mechanical Transmission Assembly',
      industrialCategory: 'Power Transmission & Drive Technology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Housing, Sun Gear, Planetary Carrier, Output Shaft, Bearings',
      modelCharacteristics: 'Manifold CAD Geometry, Clean Mesh Topology, Sub-assembly Nodes'
    },
    tags: ['gearbox', 'transmission', 'mechanical', 'planetary-gears', 'powertrain']
  },
  {
    name: '3-Phase AC Induction Electric Motor',
    slug: 'electric-motor',
    category: 'Electric Motor',
    description: 'Industrial asynchronous electric motor displaying stator windings, rotor shaft, cooling fins, and terminal box.',
    model_url: '/models/model_2.gltf',
    image_url: '/models/thumbnails/thumb_2.svg',
    specs: {
      objectType: 'Rotating Electrical Machine',
      industrialCategory: 'Motors & Actuators',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Stator Frame, Rotor Shaft, Winding Assemblies, Cooling Fan, Terminal Enclosure',
      modelCharacteristics: 'Subdivision Surface Mesh, Balanced Rotational Inertia Geometry'
    },
    tags: ['motor', 'electric', 'induction', 'stator', 'rotor', 'machinery']
  },
  {
    name: 'Single-Stage End Suction Centrifugal Pump',
    slug: 'centrifugal-pump',
    category: 'Centrifugal Pump',
    description: 'Fluid handling pump assembly showing volute casing, closed impeller, wear rings, and mechanical shaft seal.',
    model_url: '/models/model_3.gltf',
    image_url: '/models/thumbnails/thumb_3.svg',
    specs: {
      objectType: 'Hydrodynamic Fluid Machinery',
      industrialCategory: 'Pumps & Fluid Handling',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Volute Casing, Closed Impeller, Shaft Sleeve, Mechanical Seal, Flanges',
      modelCharacteristics: 'Clean CAD Surface Reconstruction, Low Quad-Poly Count'
    },
    tags: ['pump', 'centrifugal', 'fluid-dynamics', 'impeller', 'hydraulics']
  },
  {
    name: 'Rotary Screw Industrial Air Compressor',
    slug: 'air-compressor',
    category: 'Air Compressor',
    description: 'Twin-screw positive displacement air compressor unit demonstrating helical male and female rotors.',
    model_url: '/models/model_4.gltf',
    image_url: '/models/thumbnails/thumb_4.svg',
    specs: {
      objectType: 'Positive Displacement Gas Compressor',
      industrialCategory: 'Pneumatics & Compressed Air Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Helical Rotor Pair, Compressor Air-End Casing, Bearings, Intake Manifold',
      modelCharacteristics: 'High Precision Helical Mesh Profile, Enclosed Chassis Geometry'
    },
    tags: ['compressor', 'pneumatics', 'air-end', 'rotary-screw', 'industrial']
  },
  {
    name: 'Variable Displacement Axial Piston Hydraulic Pump',
    slug: 'hydraulic-pump',
    category: 'Hydraulic Pump',
    description: 'High-pressure hydraulic axial piston pump showing swashplate angle mechanism, cylinder barrel, and pistons.',
    model_url: '/models/model_5.gltf',
    image_url: '/models/thumbnails/thumb_5.svg',
    specs: {
      objectType: 'Fluid Power Displacement Generator',
      industrialCategory: 'Hydraulics & Fluid Power',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Swashplate, Cylinder Barrel, Pistons, Slipper Pads, Shaft & Valve Plate',
      modelCharacteristics: 'Detailed Kinematic Mechanism Geometry, Sub-millimeter Tolerance CAD'
    },
    tags: ['hydraulic-pump', 'axial-piston', 'swashplate', 'hydraulics', 'fluid-power']
  },
  {
    name: 'High-Pressure Flanged Globe Valve Assembly',
    slug: 'industrial-valve',
    category: 'Industrial Valve',
    description: 'Flanged linear-motion globe valve featuring handwheel actuator, threaded stem, valve plug, and seat ring.',
    model_url: '/models/model_6.gltf',
    image_url: '/models/thumbnails/thumb_6.svg',
    specs: {
      objectType: 'Linear Flow Regulation Valve',
      industrialCategory: 'Piping & Flow Control',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Valve Body, Bonnet, Stem, Plug Disc, Seat Ring, Handwheel Actuator',
      modelCharacteristics: 'Standard Flange Drilling CAD Pattern, Clean Solid Surface Body'
    },
    tags: ['valve', 'globe-valve', 'piping', 'flow-control', 'flange']
  },
  {
    name: 'Shell and Tube Industrial Heat Exchanger',
    slug: 'heat-exchanger',
    category: 'Heat Exchanger',
    description: 'Industrial thermal exchanger showing outer shell vessel, tube bundle array, baffles, and channel heads.',
    model_url: '/models/model_7.gltf',
    image_url: '/models/thumbnails/thumb_7.svg',
    specs: {
      objectType: 'Thermal Energy Transfer Apparatus',
      industrialCategory: 'Process Equipment & Thermal Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Outer Cylindrical Shell, Tube Bundle, Segmental Baffles, Tubesheet, Channel Bonnet',
      modelCharacteristics: 'Pattern Array Tube Geometry, Structural Vessel Supports'
    },
    tags: ['heat-exchanger', 'shell-and-tube', 'thermal', 'process-equipment', 'vessel']
  },
  {
    name: 'ASME Horizontal Industrial Pressure Vessel',
    slug: 'pressure-vessel',
    category: 'Pressure Vessel',
    description: 'Horizontal cylindrical storage vessel with ellipsoidal heads, manway access port, and saddle supports.',
    model_url: '/models/model_8.gltf',
    image_url: '/models/thumbnails/thumb_8.svg',
    specs: {
      objectType: 'Pressurized Storage Vessel',
      industrialCategory: 'Storage & Containment Infrastructure',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cylindrical Shell, Ellipsoidal Heads, Saddle Supports, Manway Access, Nozzle Connections',
      modelCharacteristics: 'Seated Structural Frame, Thick Wall Surface CAD Mesh'
    },
    tags: ['pressure-vessel', 'asme', 'storage-tank', 'process-plant', 'containment']
  },
  {
    name: 'Automated Industrial Roller Conveyor Section',
    slug: 'conveyor-assembly',
    category: 'Conveyor Assembly',
    description: 'Modular powered roller conveyor segment featuring steel rollers, drive chain, motor drive, and side frames.',
    model_url: '/models/model_9.gltf',
    image_url: '/models/thumbnails/thumb_9.svg',
    specs: {
      objectType: 'Material Handling Equipment',
      industrialCategory: 'Intralogistics & Conveyance Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Roller Axles, Steel Tubes, Sprocket Assembly, Frame Channels, Gearmotor Mount',
      modelCharacteristics: 'Linear Array Component Repeater Mesh, Clean Industrial Finish'
    },
    tags: ['conveyor', 'roller-conveyor', 'automation', 'material-handling', 'logistics']
  },
  {
    name: '6-Axis Articulated Industrial Robot Arm',
    slug: 'robotic-arm',
    category: 'Robotic Arm',
    description: 'High-payload articulated robot arm showing base joint, upper arm, wrist assembly, and internal servo motors.',
    model_url: '/models/model_10.gltf',
    image_url: '/models/thumbnails/thumb_10.svg',
    specs: {
      objectType: 'Articulated Manipulator System',
      industrialCategory: 'Robotics & Automated Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Base Axis, Shoulder, Elbow, Wrist Axes J1-J6, Tool Flange, Servo Housing',
      modelCharacteristics: 'Multi-body Kinematic Joint Rigging Ready, Industrial High-Detail CAD'
    },
    tags: ['robotics', 'robot-arm', 'automation', '6-axis', 'articulated-robot']
  },
  {
    name: 'Heavy-Duty Centrifugal Draft Fan Assembly',
    slug: 'industrial-fan',
    category: 'Industrial Fan',
    description: 'Industrial backward-curved centrifugal blower fan with scroll housing, wheel impeller, and drive shaft.',
    model_url: '/models/model_11.gltf',
    image_url: '/models/thumbnails/thumb_11.svg',
    specs: {
      objectType: 'Industrial Aerodynamic Air Handler',
      industrialCategory: 'HVAC & Process Air Systems',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Scroll Volute Casing, Fan Wheel, Shaft Bearings, Pedestal Frame, Inlet Cone',
      modelCharacteristics: 'Curved Aerofoil Impeller Vanes, Sheet Metal Casing Topology'
    },
    tags: ['industrial-fan', 'centrifugal-blower', 'hvac', 'air-handling', 'ventilation']
  },
  {
    name: 'Standby Diesel Industrial Power Generator Unit',
    slug: 'industrial-generator',
    category: 'Generator',
    description: 'Enclosed stationary power generator combining a diesel engine, alternator core, and soundproof canopy.',
    model_url: '/models/model_12.gltf',
    image_url: '/models/thumbnails/thumb_12.svg',
    specs: {
      objectType: 'Engine-Driven Electrical Generator Set',
      industrialCategory: 'Power Generation & Energy Storage',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Diesel Engine Block, Alternator Stator/Rotor, Radiator, Base Fuel Tank, Canopy',
      modelCharacteristics: 'Heavy Modular Enclosure CAD, Internal Engine Assembly Geometry'
    },
    tags: ['generator', 'diesel-generator', 'power-gen', 'alternator', 'backup-power']
  },
  {
    name: 'Multi-Stage Industrial Steam Turbine',
    slug: 'steam-turbine',
    category: 'Turbine',
    description: 'High-pressure steam turbine featuring bladed rotor shaft, stationary nozzles, and split casing halves.',
    model_url: '/models/model_13.gltf',
    image_url: '/models/thumbnails/thumb_13.svg',
    specs: {
      objectType: 'Thermal Turbomachinery',
      industrialCategory: 'Power Generation & Turbomachinery',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Rotor Shaft, High/Low Pressure Turbine Blades, Casing Shell, Labyrinth Seals, Bearings',
      modelCharacteristics: 'High Density Aerofoil Blade Array Mesh, Complex Split-Casing CAD'
    },
    tags: ['steam-turbine', 'turbine', 'power-plant', 'rotor-blades', 'turbomachinery']
  },
  {
    name: 'Double-Acting Tie-Rod Hydraulic Cylinder',
    slug: 'hydraulic-cylinder',
    category: 'Hydraulic Cylinder',
    description: 'Industrial fluid power linear actuator displaying chrome piston rod, barrel cylinder, piston seals, and end caps.',
    model_url: '/models/model_14.gltf',
    image_url: '/models/thumbnails/thumb_14.svg',
    specs: {
      objectType: 'Linear Fluid Power Actuator',
      industrialCategory: 'Hydraulics & Mechanical Actuators',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cylinder Barrel, Piston Rod, Piston Head, Tie Rods, Clevis Mount, Rod Bushing',
      modelCharacteristics: 'Precision Cylindrical Machined Geometry, Quad Surface Topology'
    },
    tags: ['hydraulic-cylinder', 'actuator', 'hydraulics', 'piston', 'fluid-power']
  },
  {
    name: 'Double-Row Tapered Roller Bearing Assembly Block',
    slug: 'bearing-assembly',
    category: 'Bearing Assembly',
    description: 'Heavy-duty industrial bearing block housing showing outer cup, inner cone, tapered rollers, and retaining cage.',
    model_url: '/models/model_15.gltf',
    image_url: '/models/thumbnails/thumb_15.svg',
    specs: {
      objectType: 'Precision Rolling Element Bearing',
      industrialCategory: 'Mechanical Components & Bearings',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Outer Ring (Cup), Inner Ring (Cone), Tapered Rollers, Stamped Steel Cage',
      modelCharacteristics: 'Sub-micron Surface Tolerance Geometry, Radial Array Pattern Mesh'
    },
    tags: ['bearing', 'tapered-roller', 'mechanical-component', 'tribology', 'powertrain']
  },
  {
    name: 'Compound Helical Gear Train Assembly',
    slug: 'gear-train',
    category: 'Gear Train',
    description: 'Multi-shaft gear reduction assembly featuring precision helical spur gears, keyways, and support shafts.',
    model_url: '/models/model_16.gltf',
    image_url: '/models/thumbnails/thumb_16.svg',
    specs: {
      objectType: 'Mechanical Gear Transmission Train',
      industrialCategory: 'Power Transmission & Drive Technology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Helical Pinion, Driven Gear, Intermediate Shafts, Keyway Slots, Shaft Collars',
      modelCharacteristics: 'Involute Tooth Profile Curve Mesh, Precision Mesh Alignment'
    },
    tags: ['gear-train', 'helical-gears', 'gears', 'powertrain', 'mechanical']
  },
  {
    name: 'Flexible Metallic Disc Shaft Coupling Assembly',
    slug: 'coupling-assembly',
    category: 'Coupling Assembly',
    description: 'Zero-backlash flexible disc coupling connecting two rotating shafts while accommodating angular misalignment.',
    model_url: '/models/model_17.gltf',
    image_url: '/models/thumbnails/thumb_17.svg',
    specs: {
      objectType: 'Flexible Shaft Coupling',
      industrialCategory: 'Power Transmission & Couplings',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Drive Hubs, Stainless Steel Disc Pack, Center Spacer, Precision Reamed Bolts',
      modelCharacteristics: 'Stacked Sheet Metal Disc Geometry, Symmetric Bolting Pattern'
    },
    tags: ['coupling', 'shaft-coupling', 'flexible-disc', 'powertrain', 'mechanical']
  },
  {
    name: 'Pneumatic Actuated Butterfly Valve Spool Segment',
    slug: 'pipe-valve-assembly',
    category: 'Pipe Valve Assembly',
    description: 'Process piping spool segment incorporating a pneumatic rotary actuator and resilient-seated butterfly valve.',
    model_url: '/models/model_18.gltf',
    image_url: '/models/thumbnails/thumb_18.svg',
    specs: {
      objectType: 'Automated Pipeline Isolation Assembly',
      industrialCategory: 'Piping & Automated Valves',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Pneumatic Rack-and-Pinion Actuator, Butterfly Valve Disc, Elastomer Seat, Pipe Spool',
      modelCharacteristics: 'Dual-Body CAD Assembly, Standard Process Piping Flange'
    },
    tags: ['butterfly-valve', 'pneumatic-actuator', 'piping', 'process-control', 'valve']
  },
  {
    name: 'Vertical Multistage Submersible Water Booster Pump',
    slug: 'water-pump',
    category: 'Water Pump',
    description: 'Vertical inline multistage water pressure booster pump with stacked impeller bowls and shaft coupling.',
    model_url: '/models/model_19.gltf',
    image_url: '/models/thumbnails/thumb_19.svg',
    specs: {
      objectType: 'Multistage Vertical Hydrodynamic Pump',
      industrialCategory: 'Water Treatment & Fluid Supply',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Stacked Impeller Bowls, Diffusers, Stainless Sleeve, Pump Shaft, Motor Pedestal',
      modelCharacteristics: 'Vertical Array Stack Mesh, Precision Sheet-Metal Impeller Blades'
    },
    tags: ['water-pump', 'multistage-pump', 'vertical-pump', 'booster', 'water-treatment']
  },
  {
    name: 'Inverter Multi-Process Robotic Welding Power Unit',
    slug: 'welding-machine',
    category: 'Welding Machine',
    description: 'Industrial arc welding power source enclosure showing internal transformer inverter stack, cooling fan, and wire feeder drive.',
    model_url: '/models/model_20.gltf',
    image_url: '/models/thumbnails/thumb_20.svg',
    specs: {
      objectType: 'Industrial Power Conversion Equipment',
      industrialCategory: 'Welding & Fabrication Equipment',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Inverter PCB Module, HF Transformer Core, Wire Drive Assembly, Chassis Enclosure',
      modelCharacteristics: 'Sheet Metal Enclosure with Internal Electronic CAD Components'
    },
    tags: ['welding-machine', 'inverter', 'mig-welder', 'fabrication', 'power-source']
  },
  {
    name: '5-Axis Vertical CNC Machining Center',
    slug: 'cnc-milling-center',
    category: 'CNC Machine',
    description: 'Enclosed 5-axis CNC milling machine showing tilting rotary trunnion table, high-speed spindle, and tool changer carousel.',
    model_url: '/models/model_21.gltf',
    image_url: '/models/thumbnails/thumb_21.svg',
    specs: {
      objectType: 'Multi-Axis Subtractive Machine Tool',
      industrialCategory: 'CNC Machining & Subtractive Manufacturing',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Spindle Head, Trunnion Table (B/C Axes), Linear Guide Way, ATC Arm, Machine Frame',
      modelCharacteristics: 'Kinematic Machine Bed Assembly, Sub-millimeter Tolerance CAD'
    },
    tags: ['cnc', '5-axis', 'machining-center', 'milling', 'machine-tool', 'manufacturing']
  },
  {
    name: 'Heavy-Duty Column Industrial Drill Press Assembly',
    slug: 'industrial-drill-press',
    category: 'Industrial Drill',
    description: 'Precision geared-head column drilling machine featuring cast iron column, rack-and-pinion table, and spindle quill.',
    model_url: '/models/model_22.gltf',
    image_url: '/models/thumbnails/thumb_22.svg',
    specs: {
      objectType: 'Hole Manufacturing Machine Tool',
      industrialCategory: 'Workshop Machinery & Tooling',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cast Base, Ground Column, Geared Headstock, Spindle Quill, T-Slot Table, Depth Stop',
      modelCharacteristics: 'Cast Iron Solid Body Mesh, Threaded Elevation Screw'
    },
    tags: ['drill-press', 'column-drill', 'machining', 'workshop', 'tooling']
  },
  {
    name: 'High-Precision CNC Turning Lathe Machine',
    slug: 'cnc-lathe-machine',
    category: 'Lathe Machine',
    description: 'Industrial CNC turning lathe showing hydraulic 3-jaw chuck, 12-station servo turret, and slant-bed ways.',
    model_url: '/models/model_23.gltf',
    image_url: '/models/thumbnails/thumb_23.svg',
    specs: {
      objectType: 'Rotary Subtractive Machine Tool',
      industrialCategory: 'CNC Machining & Turning',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Slant Bed Frame, Main Spindle & Chuck, 12-Station Servo Turret, Carriage, Tailstock',
      modelCharacteristics: 'Rigid Slant-Bed Cast Frame Geometry, Multi-Component Turret Assembly'
    },
    tags: ['cnc-lathe', 'turning-center', 'lathe', 'cnc', 'machining']
  },
  {
    name: 'Universal Horizontal/Vertical Milling Machine',
    slug: 'milling-machine',
    category: 'Milling Machine',
    description: 'Knee-and-column universal milling machine featuring swiveling vertical head, horizontal arbor, and feed gearbox.',
    model_url: '/models/model_24.gltf',
    image_url: '/models/thumbnails/thumb_24.svg',
    specs: {
      objectType: 'Knee-and-Column Milling Machine',
      industrialCategory: 'Workshop Machinery & Tooling',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Column Casting, Knee Assembly, Saddle, Swivel Worktable, Vertical Head, Arbor Support',
      modelCharacteristics: 'Heavy Ribbed Cast Iron Geometry, Precision Lead Screw Threads'
    },
    tags: ['milling-machine', 'universal-mill', 'knee-mill', 'machining', 'toolroom']
  },
  {
    name: 'Hydraulic Plastic Injection Molding System',
    slug: 'injection-molding-machine',
    category: 'Injection Molding Machine',
    description: 'Industrial plastic molding press showing hydraulic toggle clamp unit, reciprocating plasticizing screw, and barrel heaters.',
    model_url: '/models/model_25.gltf',
    image_url: '/models/thumbnails/thumb_25.svg',
    specs: {
      objectType: 'Polymer Processing Machinery',
      industrialCategory: 'Plastics Processing & Molding',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Toggle Clamp Unit, Mold Platens, Tie-Bars, Injection Barrel & Screw, Hydraulic Unit',
      modelCharacteristics: 'High Tonnage Frame Geometry, Internal Plasticizing Screw Flighting'
    },
    tags: ['injection-molding', 'plastics', 'molding-machine', 'toggle-clamp', 'polymer']
  },
  {
    name: 'PLC Automation Industrial Control Panel Enclosure',
    slug: 'industrial-control-panel',
    category: 'Industrial Control Panel',
    description: 'NEMA 12 industrial electrical control enclosure featuring DIN-rail Programmable Logic Controller (PLC), VFD drives, and relays.',
    model_url: '/models/model_26.gltf',
    image_url: '/models/thumbnails/thumb_26.svg',
    specs: {
      objectType: 'Industrial Automation Switchgear Enclosure',
      industrialCategory: 'Industrial Automation & Electrical Controls',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'NEMA Cabinet, Backplate, PLC Controller Rack, VFD Inverters, Relays, DIN Rails',
      modelCharacteristics: 'Modular Electrical Component CAD Assemblies, Wire Duct Channels'
    },
    tags: ['control-panel', 'plc', 'automation', 'vfd', 'electrical-cabinet', 'nema']
  },
  {
    name: 'Oil-Immersed Step-Down Distribution Transformer',
    slug: 'industrial-transformer',
    category: 'Transformer',
    description: 'Medium-voltage power transformer displaying corrugated cooling radiators, high-voltage porcelain bushings, and conservator tank.',
    model_url: '/models/model_27.gltf',
    image_url: '/models/thumbnails/thumb_27.svg',
    specs: {
      objectType: 'Electromagnetic Energy Conversion Apparatus',
      industrialCategory: 'High Voltage Power Distribution',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Transformer Tank, HV Bushings, Laminated Core & Coils, Radiator Fins, Conservator',
      modelCharacteristics: 'Corrugated Radiator Surface CAD, Ceramic Bushing Shed Geometry'
    },
    tags: ['transformer', 'power-distribution', 'high-voltage', 'substation', 'electrical']
  },
  {
    name: 'Heavy-Capacity Electric Counterbalance Forklift',
    slug: 'industrial-forklift',
    category: 'Forklift / Industrial Vehicle',
    description: 'Industrial electric warehouse forklift displaying 2-stage clear-view mast, hydraulic lift cylinder, forks, and battery pack.',
    model_url: '/models/model_28.gltf',
    image_url: '/models/thumbnails/thumb_28.svg',
    specs: {
      objectType: 'Powered Industrial Truck',
      industrialCategory: 'Intralogistics & Mobile Equipment',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Chassis Frame, Counterweight, 2-Stage Mast, Fork Carriage, Battery Tray, Drive Axle',
      modelCharacteristics: 'Full Vehicle Assembly Geometry, Structural Roll-Cage Frame'
    },
    tags: ['forklift', 'material-handling', 'industrial-vehicle', 'warehouse', 'logistics']
  },
  {
    name: 'Motorized Screw Jack Linear Actuator Assembly',
    slug: 'screw-jack-assembly',
    category: 'Mechanical Jack / Lifting Assembly',
    description: 'Worm gear screw jack lifting mechanism showing trapezoidal acme screw, worm wheel drive, and housing.',
    model_url: '/models/model_29.gltf',
    image_url: '/models/thumbnails/thumb_29.svg',
    specs: {
      objectType: 'Worm-Gear Mechanical Linear Actuator',
      industrialCategory: 'Lifting & Positioning Equipment',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Gearbox Housing, Worm Shaft, Bronze Worm Gear Nut, Acme Lifting Screw, Top Plate',
      modelCharacteristics: 'Trapezoidal Acme Thread Surface Profile, Machined Casting Body'
    },
    tags: ['screw-jack', 'linear-actuator', 'worm-gear', 'lifting', 'mechanical']
  },
  {
    name: 'Internal Combustion V6 Engine Block Assembly',
    slug: 'v6-engine-assembly',
    category: 'Engine / Engine Assembly',
    description: '60-degree V6 internal combustion engine block featuring pistons, crankshaft, connecting rods, valves, and camshafts.',
    model_url: '/models/model_30.gltf',
    image_url: '/models/thumbnails/thumb_30.svg',
    specs: {
      objectType: 'Internal Combustion Kinematic Powertrain',
      industrialCategory: 'Automotive & Engine Technology',
      visualizationType: 'Solid / Wireframe Topology / Translucent X-Ray Shell',
      componentStructure: 'Cylinder Block, Crankshaft, Pistons & Rods, DOHC Cylinder Heads, Valves, Timing Chain',
      modelCharacteristics: 'Complex Multi-Body Kinematic Engine Assembly, Sub-millimeter Tolerance CAD'
    },
    tags: ['engine', 'v6-engine', 'powertrain', 'pistons', 'crankshaft', 'combustion']
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
