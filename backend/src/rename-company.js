import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function walk(dir, callback) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    const stat = await fs.stat(p);
    if (stat.isDirectory()) {
      await walk(p, callback);
    } else if (p.endsWith('.js')) {
      await callback(p);
    }
  }
}

async function run() {
  const srcDir = path.join(__dirname);
  
  await walk(srcDir, async (filePath) => {
    let content = await fs.readFile(filePath, 'utf8');
    let original = content;
    
    // Replacements
    content = content.replace(/\bcompanies\b/g, 'organizations');
    content = content.replace(/\bcompany_id\b/g, 'organization_id');
    content = content.replace(/\bcompanyId\b/g, 'organizationId');
    content = content.replace(/\bcompany_preferences\b/g, 'organization_preferences');
    
    // company schema import
    content = content.replace(/organizationSchema/g, 'organizationSchema');
    
    if (content !== original) {
      await fs.writeFile(filePath, content);
      console.log(`Updated: ${path.relative(srcDir, filePath)}`);
    }
  });
  console.log('Global rename complete.');
}

run();
