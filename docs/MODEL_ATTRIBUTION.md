# i3D Spatial — Homepage 3D Asset Source & Attribution Record

This document records the origin, license, author, and optimization details for the three industrial CAD reference 3D models hosted locally within the i3D Spatial application.

---

## 1. Model 01 — Industrial Gearbox Reference Model

- **Local Path**: `/models/gearbox_assembly.glb`
- **Asset Name**: Gearbox Assembly (`GearboxAssy.glb`)
- **Source Repository**: [KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/GearboxAssy)
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Author / Provider**: Khronos Group glTF Sample Model Collection
- **Original Format**: glTF 2.0 Binary (`.glb`)
- **Key Geometric Components**:
  - Cast outer transmission housing & mounting flanges
  - Helical spur gears & pinion shafts
  - Countershaft bearings & retaining rings
- **Visualization Performance**: High-detail mechanical transmission topology; excellent clarity across Solid, CAD Wireframe, and X-Ray structural modes.

---

## 2. Model 02 — Twin-Cylinder Mechanical Assembly Reference Model

- **Local Path**: `/models/industrial_pump.glb`
- **Asset Name**: 2-Cylinder Engine Assembly (`2CylinderEngine.glb`)
- **Source Repository**: [KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/2CylinderEngine)
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Author / Provider**: Khronos Group glTF Sample Model Collection
- **Original Format**: glTF 2.0 Binary (`.glb`)
- **Key Geometric Components**:
  - Dual cylinder bores & pressure manifold
  - Reciprocating pistons & gudgeon pins
  - Connecting rods & balanced flywheel shaft
- **Visualization Performance**: Lightweight (1.8 MB); ideal for fluid/piston kinematic structure inspection in X-Ray and Wireframe modes.

---

## 3. Model 03 — Reciprocating Actuator & Motor Reference Model

- **Local Path**: `/models/electric_motor.glb`
- **Asset Name**: Reciprocating Saw Assembly (`ReciprocatingSaw.glb`)
- **Source Repository**: [KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/ReciprocatingSaw)
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Author / Provider**: Khronos Group glTF Sample Model Collection
- **Original Format**: glTF 2.0 Binary (`.glb`)
- **Key Geometric Components**:
  - Electric motor stator & armature housing
  - Bevel gear reduction assembly
  - Reciprocating guide shaft & outer protective casing
- **Visualization Performance**: Multi-part rotating power mechanism (3.5 MB); clear internal component hierarchy in X-Ray mode.

---

## Maintenance Notes

- All 3D assets are served locally from `frontend/public/models/` to ensure offline availability, zero CORS latency, and 100% production uptime without external CDN dependencies.
- No commercial trademarks or fabricated third-party manufacturer specifications are attached to these reference models.
