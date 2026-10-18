# Provenance & license report — the 30 models currently in `frontend/public/models` (commit 20040a3)

**Finding:** the Hub dataset (`spatialHubModels.ts`) presents the 30 models as industrial CAD products from invented-sounding sources ("Open Safety CAD Vault", "Vehicle CAD Library", "Metrology CAD Vault", …) and labels 25 of them "CC-BY 4.0 International". Reading the files themselves (glTF headers and node names) shows most are well-known **sample/test models**, renamed. The files are also **binary GLB saved with a `.gltf` extension**.

| File | What the file actually is (from node names / headers) | Claimed in Hub | Real license status |
|---|---|---|---|
| model_4 | **DamagedHelmet** (node `damagedHelmet`) | "Industrial Safety Protective Helmet", CC-BY | Khronos metadata lists **CC-BY-NC-4.0** for the original model → **not safe for a commercial product** |
| model_7 | **Lantern** (`LanternPole_Body`) | "Hazardous Lighting" | CC0-1.0 |
| model_8 | **BoomBox** | "Acoustic Signal Processing Workstation" | CC0-1.0 |
| model_9 | **AntiqueCamera** (`camera`, `tripod`) | "Optical Inspection …" | CC0-1.0 (+ UX3D logo mark) |
| model_10 | **WaterBottle** | "Pressurized Liquid Process Reservoir" | CC0-1.0 |
| model_19 | **SheenChair** | "Control Room Operator Chair" | CC0-1.0 per current Khronos metadata |
| model_20 | **MaterialsVariantsShoe** | "Advanced Polymer Composite Specimen" | CC-BY-4.0 (credit required) |
| model_21 | **DragonAttenuation** (Stanford Dragon) | "High-Temperature Ceramic Heat Shield" | Stanford Graphics license (restricted) + CC0 parts → **review before commercial use** |
| model_22 | **GlamVelvetSofa** | "Control Room Modular Seating" | CC-BY-4.0 (credit required) |
| model_24 | **BarramundiFish** | "Industrial Marine Hydrodynamic …" | CC0-1.0 |
| model_29 | **Fox** | "Bio-Mechanical Quadruped Actuator" | CC0-1.0 + CC-BY-4.0 (rigging/animation credit) |
| model_13 | **Astronaut** (NASA/Google model-viewer sample) | "Extravehicular Mobility …", "CC0" | Check source terms; not an industrial product |
| model_14 | **RobotExpressive** (three.js example) | "Multi-Axis Articulated Automation …", MIT | Check three.js example license; a cartoon robot, not industrial |
| model_15, model_16 | **Mixamo characters** (`vanguard_Mesh`, `mixamorig:*`) | "Field Operations Rigging …", MIT | **Mixamo terms restrict redistributing characters as standalone assets** → review/remove |
| model_1, model_2, model_3 | Appear to be Khronos **GearboxAssy / ReciprocatingSaw / Buggy** (CAD-style, COLLADA2GLTF, large node counts) [identity not proven by names] | CC-BY 4.0 | The source README gives **no explicit license** (only a conversion credit) → **unknown; do not label CC-BY without proof** |
| model_11, 12, 23, 26, 28 | Khronos/Cesium **test models** (copyright "Analytical Graphics, Inc."; names like `ArrowX1`, `VertexColorTest`, `DecalBlend`, `Orange Object`) | "Calibration/measurement test pieces" | Test files, not products; confirm each license |
| model_5, 6, 17, 18, 25, 27, 30 | Identity not verified (some from Sketchfab/other exporters) | various | **Unknown** |

Other problems in the data: `viewsCount`, `likesCount`, `downloadsCount` are **hard-coded numbers** (e.g. 1,420 views) shown as if real; `author` values such as "Open Safety CAD Vault" could not be traced to real sources; per-model files are up to **20 MB** (142 MB total) with no compression.

**Recommended action:** stop shipping this dataset as "industrial CAD". Replace it with the manifest in this package (truthful names, SPDX licenses, credit lines, hashes); keep only models whose license is proven; show a visible "Demonstration model" label until real customer or properly licensed industrial models are added. Show real view/like counts from the database (start at zero).
