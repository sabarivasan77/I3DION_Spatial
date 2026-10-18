import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');
const manifestPath = path.join(rootDir, 'tools/starter-library/manifest.json');

const SHOWCASE_ORG_ID = 'e0000000-0000-0000-0000-000000000001';

// Generate stable deterministic UUID from string key
function deterministicUuid(str) {
  const hash = crypto.createHash('md5').update(`i3dion:${str}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function seedHubStarterModels() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Ensure Showcase Organization exists
    await client.query(`
      INSERT INTO organizations (id, name, slug, profile, website, is_verified, created_at, updated_at)
      VALUES (
        $1,
        'I3DION Showcase',
        'i3dion-showcase',
        'Official demonstration and reference models for the I3DION Spatial Hub ecosystem. All models carry verifiable CC0 or CC-BY open source licenses.',
        'https://i3dion.com',
        true,
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        profile = EXCLUDED.profile,
        is_verified = true,
        updated_at = now()
    `, [SHOWCASE_ORG_ID]);

    // 2. Fetch or create Admin user for audit attribution
    let adminRes = await client.query(`SELECT id FROM users WHERE email = 'admin@i3dion.com'`);
    let adminUserId;
    if (adminRes.rows.length === 0) {
      const hash = '$argon2id$v=19$m=65536,p=1,t=3$eHBwgOu/0852ugPjAZPhDQ$Chdl75wqTKSvYucq6FFL+paLhqpYQ0ucPIOFjj90eGc';
      const created = await client.query(`
        INSERT INTO users (organization_id, name, email, password_hash, role)
        VALUES ($1, 'I3DION System Admin', 'admin@i3dion.com', $2, 'Admin')
        RETURNING id
      `, [SHOWCASE_ORG_ID, hash]);
      adminUserId = created.rows[0].id;
    } else {
      adminUserId = adminRes.rows[0].id;
    }

    console.log(`[Seed] Ingesting ${manifest.models.length} verified starter models into Vault and Spatial Hub...`);

    // Sort models by preview size ascending for initial feed optimization (lightest models first)
    const sortedModels = [...manifest.models].sort((a, b) => a.files.preview.bytes - b.files.preview.bytes);

    let offsetSeconds = sortedModels.length * 10;
    for (const model of sortedModels) {
      offsetSeconds -= 10;
      const modelCreatedAt = new Date(Date.now() + offsetSeconds * 1000);
      const previewFileName = path.basename(model.files.preview.path);
      const previewUrl = `/models/preview/${previewFileName}`;
      const posterUrl = `/models/posters/${model.slug}.svg`;
      const originalUrl = model.source.rawUrl;

      const assetId = deterministicUuid(`vault:${model.slug}`);
      const productId = deterministicUuid(`product:${model.slug}`);

      const artist = model.licenses[0]?.artist || null;
      const owner = model.licenses[0]?.owner || null;

      const specs = {
        objectType: '3D Spatial Demonstration Model',
        category: model.category,
        triangles: model.stats.triangles,
        meshes: model.stats.meshes,
        materials: model.stats.materials,
        extensionsUsed: model.stats.extensionsUsed,
        license: model.spdx.join(', '),
        artist: artist || owner || 'Khronos glTF Sample Assets',
        provenance: {
          repo: model.source.repo,
          commit: model.source.commit,
          path: model.source.path,
          licenseFile: model.source.licenseFile
        }
      };

      // Ingest into vault_assets
      await client.query(`
        INSERT INTO vault_assets (
          id, organization_id, created_by, name, original_name, storage_key,
          mime_type, category, type, public_url, preview_url, poster_url,
          size_bytes, checksum_sha256, status, visibility, approval_status,
          license_spdx, license_artist, license_owner, license_source_url,
          attribution_required, commercial_use, is_demo_model, tags, metadata,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, 'Ready', 'Public', 'Approved',
          $15, $16, $17, $18,
          $19, $20, true, $21, $22,
          now(), now()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          preview_url = EXCLUDED.preview_url,
          poster_url = EXCLUDED.poster_url,
          size_bytes = EXCLUDED.size_bytes,
          checksum_sha256 = EXCLUDED.checksum_sha256,
          license_spdx = EXCLUDED.license_spdx,
          license_artist = EXCLUDED.license_artist,
          license_owner = EXCLUDED.license_owner,
          license_source_url = EXCLUDED.license_source_url,
          attribution_required = EXCLUDED.attribution_required,
          commercial_use = EXCLUDED.commercial_use,
          tags = EXCLUDED.tags,
          metadata = EXCLUDED.metadata,
          updated_at = now()
      `, [
        assetId, SHOWCASE_ORG_ID, adminUserId, model.name, previewFileName, `preview/${previewFileName}`,
        'model/gltf-binary', 'Demonstration 3D Model', '3D Model', previewUrl, previewUrl, posterUrl,
        model.files.preview.bytes, model.files.preview.sha256,
        model.spdx, artist, owner, originalUrl,
        model.attributionRequired, model.commercialUse, JSON.stringify(model.tags), JSON.stringify(specs)
      ]);

      // Publish into products
      await client.query(`
        INSERT INTO products (
          id, organization_id, created_by, name, slug, category, description,
          model_url, image_url, preview_model_url, poster_url, full_model_url, original_model_url,
          status, is_public, visibility, approval_status,
          specs, tags, license_spdx, license_artist, license_owner, license_source_url,
          attribution_required, commercial_use, is_demo_model,
          views_count, likes_count, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          'Published', true, 'Public', 'Approved',
          $14, $15, $16, $17, $18, $19,
          $20, $21, true,
          0, 0, $22, now()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          model_url = EXCLUDED.model_url,
          image_url = EXCLUDED.image_url,
          preview_model_url = EXCLUDED.preview_model_url,
          poster_url = EXCLUDED.poster_url,
          full_model_url = EXCLUDED.full_model_url,
          original_model_url = EXCLUDED.original_model_url,
          status = 'Published',
          is_public = true,
          specs = EXCLUDED.specs,
          tags = EXCLUDED.tags,
          license_spdx = EXCLUDED.license_spdx,
          license_artist = EXCLUDED.license_artist,
          license_owner = EXCLUDED.license_owner,
          license_source_url = EXCLUDED.license_source_url,
          attribution_required = EXCLUDED.attribution_required,
          commercial_use = EXCLUDED.commercial_use,
          created_at = EXCLUDED.created_at,
          updated_at = now()
      `, [
        productId, SHOWCASE_ORG_ID, adminUserId, model.name, model.slug, model.category, model.summary,
        previewUrl, posterUrl, previewUrl, posterUrl, previewUrl, originalUrl,
        JSON.stringify(specs), model.tags, model.spdx, artist, owner, originalUrl,
        model.attributionRequired, model.commercialUse, modelCreatedAt
      ]);
    }

    await client.query('COMMIT');
    console.log(`[Seed] ✅ Successfully seeded ${manifest.models.length} truthful starter models into Vault and Hub!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed Error] Failed seeding starter models:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed-hub-starter-models.js')) {
  seedHubStarterModels()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
