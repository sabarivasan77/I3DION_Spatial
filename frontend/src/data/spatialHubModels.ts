// Master Curated Dataset for I3DION Spatial Hub
// 15 Verified Starter Models with Authenticated Licenses (CC0-1.0 / CC-BY-4.0)
// Generated from tools/starter-library/manifest.json (Khronos Group Commit edc7c9e)
// All models are explicitly labeled "Demonstration model (not industrial equipment)".
// All initial counters start at 0 (no hard-coded synthetic metrics).

export interface SpatialHubModel {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  thumbnail: string;
  modelUrl: string;
  previewUrl?: string;
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
    "id": "std-anisotropybarnlamp",
    "name": "Anisotropy Barn Lamp",
    "slug": "anisotropybarnlamp",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Wayfair AnisotropyBarnLamp model using anisotropy, clearcoat, emissive_strength, transmission, volume, and basisu extensions.",
    "longDescription": "Wayfair AnisotropyBarnLamp model using anisotropy, clearcoat, emissive_strength, transmission, volume, and basisu extensions. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC-BY-4.0.",
    "thumbnail": "/models/thumbnails/thumb_1.svg",
    "modelUrl": "/models/preview/AnisotropyBarnLamp.glb",
    "previewUrl": "/models/preview/AnisotropyBarnLamp.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Anisotropy Barn Lamp",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "3 mesh parts, 3 materials, 10,203 triangles",
      "modelCharacteristics": "KHR_materials_anisotropy, KHR_materials_clearcoat, KHR_materials_emissive_strength, KHR_materials_transmission, KHR_materials_volume"
    },
    "features": [
      "Real-time WebGL inspection (10,203 polygons)",
      "Verified open license: CC-BY-4.0",
      "Optimized meshopt + WebP preview (243.6 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "showcase",
      "extension",
      "demonstration",
      "gltf-sample",
      "cc-by-4-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Eric Chadwick",
      "license": "CC-BY-4.0",
      "attributionRequired": true,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-antiquecamera",
    "name": "Antique Camera",
    "slug": "antiquecamera",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Static model of old camera on a tripod. [Issues: non-Khronos mark]",
    "longDescription": "Static model of old camera on a tripod. [Issues: non-Khronos mark] Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_2.svg",
    "modelUrl": "/models/preview/AntiqueCamera.glb",
    "previewUrl": "/models/preview/AntiqueCamera.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Antique Camera",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "2 mesh parts, 2 materials, 20,066 triangles",
      "modelCharacteristics": "Standard PBR glTF"
    },
    "features": [
      "Real-time WebGL inspection (20,066 polygons)",
      "Verified open license: CC0-1.0",
      "Optimized meshopt + WebP preview (669.5 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "core",
      "testing",
      "issues",
      "demonstration",
      "gltf-sample",
      "cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Maximillan Kamps",
      "license": "CC0-1.0",
      "attributionRequired": false,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-avocado",
    "name": "Avocado",
    "slug": "avocado",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "A natural object created with Core glTF 2.0",
    "longDescription": "A natural object created with Core glTF 2.0 Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_3.svg",
    "modelUrl": "/models/preview/Avocado.glb",
    "previewUrl": "/models/preview/Avocado.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Avocado",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "1 mesh parts, 1 materials, 682 triangles",
      "modelCharacteristics": "Standard PBR glTF"
    },
    "features": [
      "Real-time WebGL inspection (682 polygons)",
      "Verified open license: CC0-1.0",
      "Optimized meshopt + WebP preview (58.1 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "core",
      "testing",
      "demonstration",
      "gltf-sample",
      "cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Microsoft",
      "license": "CC0-1.0",
      "attributionRequired": false,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-barramundifish",
    "name": "Barramundi Fish",
    "slug": "barramundifish",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "A fish created with Core glTF 2.0",
    "longDescription": "A fish created with Core glTF 2.0 Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_4.svg",
    "modelUrl": "/models/preview/BarramundiFish.glb",
    "previewUrl": "/models/preview/BarramundiFish.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Barramundi Fish",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "1 mesh parts, 1 materials, 3,864 triangles",
      "modelCharacteristics": "Standard PBR glTF"
    },
    "features": [
      "Real-time WebGL inspection (3,864 polygons)",
      "Verified open license: CC0-1.0",
      "Optimized meshopt + WebP preview (302.6 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "core",
      "testing",
      "demonstration",
      "gltf-sample",
      "cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Microsoft",
      "license": "CC0-1.0",
      "attributionRequired": false,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-boombox",
    "name": "Boom Box",
    "slug": "boombox",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "A common object with glowing front panel created with Core glTF 2.0.",
    "longDescription": "A common object with glowing front panel created with Core glTF 2.0. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_5.svg",
    "modelUrl": "/models/preview/BoomBox.glb",
    "previewUrl": "/models/preview/BoomBox.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Boom Box",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "1 mesh parts, 1 materials, 6,036 triangles",
      "modelCharacteristics": "Standard PBR glTF"
    },
    "features": [
      "Real-time WebGL inspection (6,036 polygons)",
      "Verified open license: CC0-1.0",
      "Optimized meshopt + WebP preview (184.3 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "core",
      "testing",
      "demonstration",
      "gltf-sample",
      "cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Microsoft",
      "license": "CC0-1.0",
      "attributionRequired": false,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-carconcept",
    "name": "Car Concept",
    "slug": "carconcept",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Concept car with Khronos logos and material variants",
    "longDescription": "Concept car with Khronos logos and material variants Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC-BY-4.0.",
    "thumbnail": "/models/thumbnails/thumb_6.svg",
    "modelUrl": "/models/preview/CarConcept.glb",
    "previewUrl": "/models/preview/CarConcept.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Car Concept",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "97 mesh parts, 29 materials, 2,13,347 triangles",
      "modelCharacteristics": "KHR_materials_clearcoat, KHR_materials_emissive_strength, KHR_materials_iridescence, KHR_materials_transmission, KHR_materials_variants, KHR_texture_transform"
    },
    "features": [
      "Real-time WebGL inspection (2,13,347 polygons)",
      "Verified open license: CC-BY-4.0",
      "Optimized meshopt + WebP preview (1715.3 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "showcase",
      "extension",
      "demonstration",
      "gltf-sample",
      "cc-by-4-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Eric Chadwick",
      "license": "CC-BY-4.0",
      "attributionRequired": true,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-cesiummilktruck",
    "name": "Cesium Milk Truck",
    "slug": "cesiummilktruck",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Textured. Multiple nodes/meshes. Animations. [Issues: non-Khronos mark]",
    "longDescription": "Textured. Multiple nodes/meshes. Animations. [Issues: non-Khronos mark] Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC-BY-4.0.",
    "thumbnail": "/models/thumbnails/thumb_7.svg",
    "modelUrl": "/models/preview/CesiumMilkTruck.glb",
    "previewUrl": "/models/preview/CesiumMilkTruck.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Cesium Milk Truck",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "2 mesh parts, 4 materials, 2,856 triangles",
      "modelCharacteristics": "Standard PBR glTF"
    },
    "features": [
      "Real-time WebGL inspection (2,856 polygons)",
      "Verified open license: CC-BY-4.0",
      "Optimized meshopt + WebP preview (68.1 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "core",
      "issues",
      "testing",
      "demonstration",
      "gltf-sample",
      "cc-by-4-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Cesium",
      "license": "CC-BY-4.0",
      "attributionRequired": true,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-fox",
    "name": "Fox",
    "slug": "fox",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Multiple animations cycles: Survey, Walk, Run.",
    "longDescription": "Multiple animations cycles: Survey, Walk, Run. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC-BY-4.0 / CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_8.svg",
    "modelUrl": "/models/preview/Fox.glb",
    "previewUrl": "/models/preview/Fox.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Fox",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "1 mesh parts, 1 materials, 576 triangles",
      "modelCharacteristics": "Standard PBR glTF"
    },
    "features": [
      "Real-time WebGL inspection (576 polygons)",
      "Verified open license: CC-BY-4.0 / CC0-1.0",
      "Optimized meshopt + WebP preview (71.6 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "core",
      "testing",
      "demonstration",
      "gltf-sample",
      "cc-by-4-0-cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "PixelMannen, tomkranis, @AsoboStudio and @scurest",
      "license": "CC-BY-4.0 / CC0-1.0",
      "attributionRequired": true,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-glamvelvetsofa",
    "name": "Glam Velvet Sofa",
    "slug": "glamvelvetsofa",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Sofa using material variants, sheen, and specular.",
    "longDescription": "Sofa using material variants, sheen, and specular. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC-BY-4.0.",
    "thumbnail": "/models/thumbnails/thumb_9.svg",
    "modelUrl": "/models/preview/GlamVelvetSofa.glb",
    "previewUrl": "/models/preview/GlamVelvetSofa.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Glam Velvet Sofa",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "3 mesh parts, 7 materials, 4,196 triangles",
      "modelCharacteristics": "KHR_texture_transform, KHR_materials_sheen, KHR_materials_specular, KHR_materials_variants, KHR_lights_punctual"
    },
    "features": [
      "Real-time WebGL inspection (4,196 polygons)",
      "Verified open license: CC-BY-4.0",
      "Optimized meshopt + WebP preview (415.1 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "video",
      "extension",
      "demonstration",
      "gltf-sample",
      "cc-by-4-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Eric Chadwick",
      "license": "CC-BY-4.0",
      "attributionRequired": true,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-iridescencelamp",
    "name": "Iridescence Lamp",
    "slug": "iridescencelamp",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Wayfair Lamp model using transmission, volume, and KHR_materials_iridescence.",
    "longDescription": "Wayfair Lamp model using transmission, volume, and KHR_materials_iridescence. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC-BY-4.0.",
    "thumbnail": "/models/thumbnails/thumb_10.svg",
    "modelUrl": "/models/preview/IridescenceLamp.glb",
    "previewUrl": "/models/preview/IridescenceLamp.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Iridescence Lamp",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "3 mesh parts, 3 materials, 18,866 triangles",
      "modelCharacteristics": "KHR_materials_transmission, KHR_materials_volume, KHR_materials_iridescence, KHR_materials_ior"
    },
    "features": [
      "Real-time WebGL inspection (18,866 polygons)",
      "Verified open license: CC-BY-4.0",
      "Optimized meshopt + WebP preview (196.6 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "showcase",
      "extension",
      "demonstration",
      "gltf-sample",
      "cc-by-4-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Eric Chadwick",
      "license": "CC-BY-4.0",
      "attributionRequired": true,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-lantern",
    "name": "Lantern",
    "slug": "lantern",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Old wooden street light.",
    "longDescription": "Old wooden street light. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_1.svg",
    "modelUrl": "/models/preview/Lantern.glb",
    "previewUrl": "/models/preview/Lantern.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Lantern",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "3 mesh parts, 1 materials, 5,394 triangles",
      "modelCharacteristics": "Standard PBR glTF"
    },
    "features": [
      "Real-time WebGL inspection (5,394 polygons)",
      "Verified open license: CC0-1.0",
      "Optimized meshopt + WebP preview (275.1 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "core",
      "testing",
      "demonstration",
      "gltf-sample",
      "cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "sbtron, Frank Galligan",
      "license": "CC0-1.0",
      "attributionRequired": false,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-materialsvariantsshoe",
    "name": "Materials Variants Shoe",
    "slug": "materialsvariantsshoe",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "A model of a shoe that illustrates use of the KHR_materials_variants extension with three materials included in the asset.",
    "longDescription": "A model of a shoe that illustrates use of the KHR_materials_variants extension with three materials included in the asset. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC-BY-4.0.",
    "thumbnail": "/models/thumbnails/thumb_2.svg",
    "modelUrl": "/models/preview/MaterialsVariantsShoe.glb",
    "previewUrl": "/models/preview/MaterialsVariantsShoe.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Materials Variants Shoe",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "1 mesh parts, 3 materials, 22,700 triangles",
      "modelCharacteristics": "KHR_materials_variants"
    },
    "features": [
      "Real-time WebGL inspection (22,700 polygons)",
      "Verified open license: CC-BY-4.0",
      "Optimized meshopt + WebP preview (533.1 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "extension",
      "showcase",
      "written",
      "demonstration",
      "gltf-sample",
      "cc-by-4-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Shopify",
      "license": "CC-BY-4.0",
      "attributionRequired": true,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-sheenchair",
    "name": "Sheen Chair",
    "slug": "sheenchair",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Chair using material variants and sheen.",
    "longDescription": "Chair using material variants and sheen. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_3.svg",
    "modelUrl": "/models/preview/SheenChair.glb",
    "previewUrl": "/models/preview/SheenChair.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Sheen Chair",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "4 mesh parts, 6 materials, 39,936 triangles",
      "modelCharacteristics": "KHR_texture_transform, KHR_materials_sheen, KHR_materials_variants"
    },
    "features": [
      "Real-time WebGL inspection (39,936 polygons)",
      "Verified open license: CC0-1.0",
      "Optimized meshopt + WebP preview (725.3 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "showcase",
      "video",
      "extension",
      "demonstration",
      "gltf-sample",
      "cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Eric Chadwick",
      "license": "CC0-1.0",
      "attributionRequired": false,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-toycar",
    "name": "Toy Car",
    "slug": "toycar",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Toy car example using transmission, clearcoat, and sheen.",
    "longDescription": "Toy car example using transmission, clearcoat, and sheen. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_4.svg",
    "modelUrl": "/models/preview/ToyCar.glb",
    "previewUrl": "/models/preview/ToyCar.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Toy Car",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "3 mesh parts, 3 materials, 1,08,936 triangles",
      "modelCharacteristics": "KHR_texture_transform, KHR_materials_clearcoat, KHR_materials_transmission, KHR_materials_sheen"
    },
    "features": [
      "Real-time WebGL inspection (1,08,936 polygons)",
      "Verified open license: CC0-1.0",
      "Optimized meshopt + WebP preview (840.9 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "showcase",
      "video",
      "extension",
      "demonstration",
      "gltf-sample",
      "cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Guido Odendahl, Eric Chadwick",
      "license": "CC0-1.0",
      "attributionRequired": false,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  },
  {
    "id": "std-waterbottle",
    "name": "Water Bottle",
    "slug": "waterbottle",
    "category": "Demonstration model (not industrial equipment)",
    "shortDescription": "Basic metal/roughness water bottle.",
    "longDescription": "Basic metal/roughness water bottle. Real-time 3D inspection demonstration asset sourced from the official Khronos Group sample library under CC0-1.0.",
    "thumbnail": "/models/thumbnails/thumb_5.svg",
    "modelUrl": "/models/preview/WaterBottle.glb",
    "previewUrl": "/models/preview/WaterBottle.glb",
    "arEnabled": true,
    "wireframeEnabled": true,
    "xrayEnabled": true,
    "solidEnabled": true,
    "status": "Published",
    "viewsCount": 0,
    "likesCount": 0,
    "downloadsCount": 0,
    "metadata": {
      "objectType": "Water Bottle",
      "industrialCategory": "Demonstration Asset",
      "visualizationType": "Solid / Wireframe / X-Ray",
      "componentStructure": "1 mesh parts, 1 materials, 4,510 triangles",
      "modelCharacteristics": "Standard PBR glTF"
    },
    "features": [
      "Real-time WebGL inspection (4,510 polygons)",
      "Verified open license: CC0-1.0",
      "Optimized meshopt + WebP preview (89.0 KB)",
      "AR-ready digital twin preview"
    ],
    "tags": [
      "core",
      "testing",
      "written",
      "demonstration",
      "gltf-sample",
      "cc0-1-0"
    ],
    "source": {
      "repository": "https://github.com/KhronosGroup/glTF-Sample-Assets",
      "author": "Microsoft",
      "license": "CC0-1.0",
      "attributionRequired": false,
      "originalFormat": "glTF Binary (GLB)",
      "optimizedFormat": "meshopt + WebP GLB"
    }
  }
];

export function getSpatialHubModelBySlug(slug: string): SpatialHubModel | undefined {
  return SPATIAL_HUB_MODELS.find(
    (m) => m.slug.toLowerCase() === slug.toLowerCase() || m.id.toLowerCase() === slug.toLowerCase()
  );
}

export function searchSpatialHubModels(queryStr: string): SpatialHubModel[] {
  const q = queryStr.toLowerCase().trim();
  if (!q) return SPATIAL_HUB_MODELS;
  return SPATIAL_HUB_MODELS.filter((m) => {
    return (
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.shortDescription.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}
