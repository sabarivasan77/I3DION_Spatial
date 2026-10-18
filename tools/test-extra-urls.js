import fs from 'fs';

const extraCandidates = [
  { name: 'Duck', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb' },
  { name: 'Avocado', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb' },
  { name: 'Fox', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb' },
  { name: 'CesiumMan', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb' },
  { name: 'BarramundiFish', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb' },
  { name: 'StainedGlassLamp', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/StainedGlassLamp/glTF-Binary/StainedGlassLamp.glb' },
  { name: 'Horse', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Horse.glb' },
  { name: 'Flamingo', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo.glb' },
  { name: 'Parrot', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Parrot.glb' },
  { name: 'Stork', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Stork.glb' },
  { name: 'LeePerrySmith', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb' },
  { name: 'Nefertiti', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Nefertiti/Nefertiti.glb' }
];

async function run() {
  for (const c of extraCandidates) {
    try {
      const res = await fetch(c.url, { method: 'HEAD' });
      console.log(`[${res.status}] ${c.name} => ${c.url}`);
    } catch (e) {
      console.error(`[ERR] ${c.name}`);
    }
  }
}

run();
