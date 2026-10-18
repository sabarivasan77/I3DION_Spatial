// License gate for CI: fails if any model has a non-commercial/no-derivatives/unknown license,
// or if a CC-BY model lacks attribution data, or if a preview file's checksum changed.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const m = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url)));
const ALLOWED = new Set(['CC0-1.0', 'CC-BY-4.0', 'MIT']);
let bad = 0;
for (const x of m.models) {
  for (const s of x.spdx) if (!ALLOWED.has(s)) { console.error(`${x.slug}: license ${s} not allowed`); bad++; }
  if (x.attributionRequired && !x.licenses.some(l => l.artist)) { console.error(`${x.slug}: attribution data missing`); bad++; }
  const buf = await readFile(new URL('../' + x.files.preview.path, import.meta.url));
  if (createHash('sha256').update(buf).digest('hex') !== x.files.preview.sha256) { console.error(`${x.slug}: preview checksum mismatch`); bad++; }
}
if (bad) process.exit(1); console.log(`OK: ${m.models.length} models pass the license gate`);
