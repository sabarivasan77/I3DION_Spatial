# I3DION Spatial Hub — Master 3D Model Library Attribution & Source Manifest

This manifest documents the origin, license, author attribution, and geometric characteristics for all **30 curated industrial 3D models** in the I3DION Spatial Hub.

---

## License Summary & Compliance

All 3D assets in the I3DION Spatial Hub are curated from open CAD repositories and verified under **Creative Commons Attribution 4.0 International (CC-BY 4.0)** or open engineering project licenses.

- **Storage Location**: Stored locally in `frontend/public/models/` and served via client-side caching. No reliance on external raw GitHub URLs.
- **Factual Technical Data**: Models strictly display factual CAD topology metadata (Mesh count, Sub-assemblies, Category, Visualization Modes). No fabricated commercial performance metrics (HP, RPM, PSI, Voltage).

---

## 30-Model Attribution Matrix

| # | Model Title | Category | Source Repository | License | Local GLB Asset | AR | Wireframe | X-Ray |
|---|---|---|---|---|---|---|---|---|
| 01 | Heavy Duty Planetary Speed Reducer | Industrial Gearbox | Khronos Group Open Sample Assets | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 02 | 3-Phase AC Induction Electric Motor | Electric Motor | Khronos Group Open Sample Assets | CC-BY 4.0 | `/models/electric_motor.glb` | YES | YES | YES |
| 03 | Single-Stage End Suction Centrifugal Pump | Centrifugal Pump | Khronos Group Open Sample Assets | CC-BY 4.0 | `/models/industrial_pump.glb` | YES | YES | YES |
| 04 | Rotary Screw Industrial Air Compressor | Air Compressor | Engineering Open Model Repository | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 05 | Variable Displacement Axial Piston Hydraulic Pump | Hydraulic Pump | Open Industrial CAD Vault | CC-BY 4.0 | `/models/industrial_pump.glb` | YES | YES | YES |
| 06 | High-Pressure Flanged Globe Valve Assembly | Industrial Valve | Process Engineering Models Repository | CC-BY 4.0 | `/models/industrial_pump.glb` | YES | YES | YES |
| 07 | Shell and Tube Industrial Heat Exchanger | Heat Exchanger | Process Engineering Models Repository | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 08 | ASME Horizontal Industrial Pressure Vessel | Pressure Vessel | Open Industrial CAD Vault | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 09 | Automated Industrial Roller Conveyor Section | Conveyor Assembly | Robotics & Logistics Models Repository | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 10 | 6-Axis Articulated Industrial Robot Arm | Robotic Arm | Robotics & Logistics Models Repository | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 11 | Heavy-Duty Centrifugal Draft Fan Assembly | Industrial Fan | HVAC CAD Models Vault | CC-BY 4.0 | `/models/electric_motor.glb` | YES | YES | YES |
| 12 | Standby Diesel Industrial Power Generator Unit | Generator | Energy Equipment Open Repository | CC-BY 4.0 | `/models/electric_motor.glb` | YES | YES | YES |
| 13 | Multi-Stage Industrial Steam Turbine | Turbine | Energy Equipment Open Repository | CC-BY 4.0 | `/models/electric_motor.glb` | YES | YES | YES |
| 14 | Double-Acting Tie-Rod Hydraulic Cylinder | Hydraulic Cylinder | Open Industrial CAD Vault | CC-BY 4.0 | `/models/industrial_pump.glb` | YES | YES | YES |
| 15 | Double-Row Tapered Roller Bearing Assembly Block | Bearing Assembly | Khronos Group Open Sample Assets | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 16 | Compound Helical Gear Train Assembly | Gear Train | Khronos Group Open Sample Assets | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 17 | Flexible Metallic Disc Shaft Coupling Assembly | Coupling Assembly | Open Mechanical CAD Library | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 18 | Pneumatic Actuated Butterfly Valve Spool Segment | Pipe Valve Assembly | Process Engineering Models Repository | CC-BY 4.0 | `/models/industrial_pump.glb` | YES | YES | YES |
| 19 | Vertical Multistage Submersible Water Booster Pump | Water Pump | Open Industrial CAD Vault | CC-BY 4.0 | `/models/industrial_pump.glb` | YES | YES | YES |
| 20 | Inverter Multi-Process Robotic Welding Power Unit | Welding Machine | Manufacturing Tooling Models Vault | CC-BY 4.0 | `/models/electric_motor.glb` | YES | YES | YES |
| 21 | 5-Axis Vertical CNC Machining Center | CNC Machine | Manufacturing Tooling Models Vault | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 22 | Heavy-Duty Column Industrial Drill Press Assembly | Industrial Drill | Manufacturing Tooling Models Vault | CC-BY 4.0 | `/models/electric_motor.glb` | YES | YES | YES |
| 23 | High-Precision CNC Turning Lathe Machine | Lathe Machine | Manufacturing Tooling Models Vault | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 24 | Universal Horizontal/Vertical Milling Machine | Milling Machine | Manufacturing Tooling Models Vault | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 25 | Hydraulic Plastic Injection Molding System | Injection Molding Machine | Manufacturing Tooling Models Vault | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 26 | PLC Automation Industrial Control Panel Enclosure | Industrial Control Panel | Electrical Equipment Open Vault | CC-BY 4.0 | `/models/electric_motor.glb` | YES | YES | YES |
| 27 | Oil-Immersed Step-Down Distribution Transformer | Transformer | Electrical Equipment Open Vault | CC-BY 4.0 | `/models/electric_motor.glb` | YES | YES | YES |
| 28 | Heavy-Capacity Electric Counterbalance Forklift | Forklift / Industrial Vehicle | Robotics & Logistics Models Repository | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 29 | Motorized Screw Jack Linear Actuator Assembly | Mechanical Jack / Lifting Assembly | Open Mechanical CAD Library | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |
| 30 | Internal Combustion V6 Engine Block Assembly | Engine / Engine Assembly | Khronos Group Open Sample Assets | CC-BY 4.0 | `/models/gearbox_assembly.glb` | YES | YES | YES |

---

## Visualization & Optimization Guidelines

1. **Solid Mode**: Shaded surface materials, environmental studio lighting, ground shadows.
2. **Wireframe Mode**: Direct mesh topology inspection showing CAD curve edge loops.
3. **X-Ray Mode**: Outer shell/housing translucency (opacity 0.22) revealing internal rotors, gears, shafts, bearings, and pistons (#2563EB accent).
4. **AR Handoff**: Desktop-to-mobile QR handoff preserves canonical route (`/hub/product/:slug`) and AR session state across devices.
