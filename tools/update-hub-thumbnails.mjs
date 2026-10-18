import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('tools/starter-library/manifest.json', 'utf8'));
let code = fs.readFileSync('frontend/src/data/spatialHubModels.ts', 'utf8');

for (const m of manifest.models) {
  const target = new RegExp(`("slug":\\s*"${m.slug}"[\\s\\S]*?"thumbnail":\\s*)"[^"]+"`);
  code = code.replace(target, `$1"/models/posters/${m.slug}.svg"`);
}

fs.writeFileSync('frontend/src/data/spatialHubModels.ts', code, 'utf8');
console.log('✅ Updated spatialHubModels.ts with posters.');
