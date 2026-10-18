import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '..', 'frontend', 'public', 'models');
const thumbsDir = path.join(modelsDir, 'thumbnails');

const modelHashes = new Set();
const thumbHashes = new Set();
const results = [];

let modelDupes = false;
let thumbDupes = false;

for (let i = 1; i <= 30; i++) {
  const modelFile = `model_${i}.gltf`;
  const thumbFile = `thumb_${i}.svg`;
  
  const modelPath = path.join(modelsDir, modelFile);
  const thumbPath = path.join(thumbsDir, thumbFile);
  
  const modelContent = fs.readFileSync(modelPath);
  const thumbContent = fs.readFileSync(thumbPath);
  
  const modelHash = crypto.createHash('sha256').update(modelContent).digest('hex').substring(0, 12);
  const thumbHash = crypto.createHash('sha256').update(thumbContent).digest('hex').substring(0, 12);
  
  if (modelHashes.has(modelHash)) modelDupes = true;
  if (thumbHashes.has(thumbHash)) thumbDupes = true;
  
  modelHashes.add(modelHash);
  thumbHashes.add(thumbHash);

  const isGlb = modelContent.toString('utf8', 0, 4) === 'glTF';
  
  results.push({
    id: i,
    modelFile,
    format: isGlb ? 'Binary GLB (glTF 2.0)' : 'JSON glTF 2.0',
    modelSize: `${(modelContent.length / 1024).toFixed(1)} KB`,
    modelHash,
    thumbFile,
    thumbSize: `${thumbContent.length} B`,
    thumbHash
  });
}

console.table(results);
console.log(`\n--- DUAL ASSET INTEGRITY VERIFICATION ---`);
console.log(`Unique 3D Model Hashes : ${modelHashes.size} / 30 (Duplicates: ${modelDupes ? 'FAIL' : 'NONE - PASSED'})`);
console.log(`Unique Thumbnail Hashes: ${thumbHashes.size} / 30 (Duplicates: ${thumbDupes ? 'FAIL' : 'NONE - PASSED'})`);
