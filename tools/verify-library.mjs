// License gate for CI: fails if any model has a non-commercial/no-derivatives/unknown license,
// or if a CC-BY model lacks attribution data, or if a preview file's checksum changed.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, 'starter-library/manifest.json');
const previewDir = path.resolve(__dirname, '../frontend/public/models/preview');

const m = JSON.parse(await readFile(manifestPath, 'utf8'));
const ALLOWED = new Set(['CC0-1.0', 'CC-BY-4.0', 'MIT']);
let bad = 0;
for (const x of m.models) {
  for (const s of x.spdx) {
    if (!ALLOWED.has(s)) {
      console.error(`${x.slug}: license ${s} not allowed`);
      bad++;
    }
  }
  if (x.attributionRequired && !x.licenses.some(l => l.artist)) {
    console.error(`${x.slug}: attribution data missing`);
    bad++;
  }
  const filename = path.basename(x.files.preview.path);
  const buf = await readFile(path.join(previewDir, filename));
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== x.files.preview.sha256) {
    console.error(`${x.slug}: preview checksum mismatch (expected ${x.files.preview.sha256}, got ${sha})`);
    bad++;
  }
}
if (bad) {
  console.error(`FAILED: ${bad} license gate violations found.`);
  process.exit(1);
}
console.log(`OK: All ${m.models.length} models pass the license gate.`);
