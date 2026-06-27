import crypto from 'node:crypto';
import path from 'node:path';
import QRCode from 'qrcode';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { ApiError } from '../utils/errors.js';
import { storeBuffer, writeTextFile } from './storage.js';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function slugExists(companyId, slug, excludeId) {
  const { rows } = await query(
    'SELECT id FROM products WHERE company_id = $1 AND slug = $2 LIMIT 1',
    [companyId, slug],
  );
  return Boolean(rows[0] && rows[0].id !== excludeId);
}

export async function makeUniqueSlug(companyId, name, excludeId) {
  const base = slugify(name) || `product-${crypto.randomUUID().slice(0, 8)}`;
  let candidate = base;
  let suffix = 2;

  while (await slugExists(companyId, candidate, excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function productPublicUrl(slug) {
  return `${config.appUrl}/product/${slug}`;
}

export function productQrTargetUrl(slug) {
  return `${config.appUrl}/product/${slug}?source=qr`;
}

function serializeAsset(row) {
  return {
    id: row.id,
    company_id: row.company_id,
    product_id: row.product_id,
    asset_type: row.asset_type,
    original_name: row.original_name,
    file_name: row.file_name,
    file_path: row.file_path,
    public_url: row.public_url,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    checksum_sha256: row.checksum_sha256,
    metadata: row.metadata ?? {},
    created_at: row.created_at,
  };
}

function serializeQr(row) {
  if (!row) return null;
  return {
    id: row.id,
    company_id: row.company_id,
    product_id: row.product_id,
    product_slug: row.product_slug,
    target_url: row.target_url,
    png_asset_id: row.png_asset_id,
    svg_asset_id: row.svg_asset_id,
    png_url: row.png_url,
    svg_url: row.svg_url,
    generated_at: row.generated_at,
    updated_at: row.updated_at,
  };
}

export function serializeProduct(row, extra = {}) {
  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    category: row.category,
    description: row.description,
    status: row.status,
    specs: row.specs ?? {},
    image_url: row.image_url,
    model_url: row.model_url,
    usdz_url: row.usdz_url,
    document_url: row.document_url,
    video_url: row.video_url,
    dimensions: row.dimensions,
    is_public: row.is_public,
    slug: row.slug,
    public_url: row.public_url ?? (row.slug ? productPublicUrl(row.slug) : null),
    thumbnail_asset_id: row.thumbnail_asset_id,
    model_asset_id: row.model_asset_id,
    usdz_asset_id: row.usdz_asset_id,
    qr_code_id: row.qr_code_id,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...extra,
  };
}

export async function createProduct(companyId, userId, body) {
  const slug = await makeUniqueSlug(companyId, body.name);
  const publicUrl = productPublicUrl(slug);
  const { rows } = await query(
    `INSERT INTO products
     (company_id, name, category, description, status, specs, image_url, model_url, usdz_url, document_url, video_url,
      dimensions, is_public, slug, public_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      companyId,
      body.name,
      body.category,
      body.description ?? null,
      body.status ?? 'Draft',
      body.specs ?? {},
      body.imageUrl || null,
      body.modelUrl || null,
      body.usdzUrl || null,
      body.documentUrl || null,
      body.videoUrl || null,
      body.dimensions ?? null,
      body.isPublic ?? false,
      slug,
      publicUrl,
      userId,
    ],
  );

  const product = rows[0];
  if (!product) throw new ApiError(500, 'Failed to create product');

  // Only auto-generate QR if a model URL was provided at creation time
  if (product.model_url) {
    await ensureProductQr(product.id).catch(() => null);
  }

  return getProductById(companyId, product.id);
}

export async function updateProduct(companyId, id, body) {
  const existing = await getProductById(companyId, id);
  if (!existing) throw new ApiError(404, 'Product not found');

  const { rows } = await query(
    `UPDATE products
     SET name = $1,
         category = $2,
         description = $3,
         status = $4::product_status,
         specs = $5,
         image_url = $6,
         model_url = $7,
         usdz_url = $8,
         document_url = $9,
         video_url = $10,
         dimensions = $11,
         is_public = $14,
         updated_at = now()
     WHERE id = $12 AND company_id = $13
     RETURNING *`,
    [
      body.name,
      body.category,
      body.description ?? null,
      body.status ?? 'Draft',
      body.specs ?? {},
      body.imageUrl || null,
      body.modelUrl || null,
      body.usdzUrl || null,
      body.documentUrl || null,
      body.videoUrl || null,
      body.dimensions ?? null,
      id,
      companyId,
      body.isPublic ?? false,
    ],
  );

  const product = rows[0];
  if (!product) throw new ApiError(404, 'Product not found');

  // Auto-generate QR if model is now available
  if (product.model_url) {
    await ensureProductQr(product.id).catch(() => null);
  }

  return getProductById(companyId, product.id);
}

/**
 * Update only the status field of a product.
 */
export async function patchProductStatus(companyId, id, status) {
  const validStatuses = ['Draft', 'Published', 'Archived'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const { rows } = await query(
    `UPDATE products
     SET status = $1::product_status,
         is_public = CASE
           WHEN $1 = 'Published' THEN true
           WHEN $1 = 'Archived' THEN false
           ELSE is_public
         END,
         updated_at = now()
     WHERE id = $2 AND company_id = $3
     RETURNING *`,
    [status, id, companyId],
  );

  const product = rows[0];
  if (!product) throw new ApiError(404, 'Product not found');
  return getProductById(companyId, product.id);
}

export async function listProductsWithMetrics(companyId) {
  const [{ rows: products }, { rows: qrRows }, { rows: analyticsRows }] = await Promise.all([
    query('SELECT * FROM products WHERE company_id = $1 ORDER BY created_at DESC', [companyId]),
    query('SELECT * FROM qr_codes WHERE company_id = $1', [companyId]),
    query(
      `SELECT product_id,
              count(*) FILTER (WHERE event_type = 'qr_scan')::int AS total_scans,
              count(*) FILTER (WHERE event_type = 'product_view')::int AS product_views,
              count(*) FILTER (WHERE event_type = 'ar_launch')::int AS ar_launch_count,
              count(*) FILTER (WHERE event_type = 'qr_download')::int AS qr_downloads,
              count(*) FILTER (WHERE event_type = 'session_duration')::int AS session_duration_events
       FROM analytics_events
       WHERE company_id = $1
       GROUP BY product_id`,
      [companyId],
    ),
  ]);

  const qrByProductId = new Map(qrRows.map((row) => [row.product_id, serializeQr(row)]));
  const metricsByProductId = new Map(analyticsRows.map((row) => [row.product_id, row]));

  return products.map((product) => {
    const metrics = metricsByProductId.get(product.id) ?? {};
    const qr = qrByProductId.get(product.id) ?? null;
    return serializeProduct(product, {
      qr,
      qr_generated_at: qr?.generated_at ?? null,
      qr_png_url: qr?.png_url ?? null,
      qr_svg_url: qr?.svg_url ?? null,
      total_scans: Number(metrics.total_scans ?? 0),
      product_views: Number(metrics.product_views ?? 0),
      ar_launch_count: Number(metrics.ar_launch_count ?? 0),
      qr_downloads: Number(metrics.qr_downloads ?? 0),
      session_duration_events: Number(metrics.session_duration_events ?? 0),
      public_url: product.public_url ?? productPublicUrl(product.slug),
    });
  });
}

export async function getProductById(companyId, productId) {
  const productResult = await query('SELECT * FROM products WHERE company_id = $1 AND id = $2 LIMIT 1', [
    companyId,
    productId,
  ]);
  const product = productResult.rows[0];
  if (!product) return null;

  const [assetsResult, qrResult, metricsResult] = await Promise.all([
    query('SELECT * FROM product_assets WHERE company_id = $1 AND product_id = $2 ORDER BY created_at ASC', [
      companyId,
      productId,
    ]),
    query('SELECT * FROM qr_codes WHERE company_id = $1 AND product_id = $2 LIMIT 1', [companyId, productId]),
    query(
      `SELECT
         count(*) FILTER (WHERE event_type = 'qr_scan')::int AS total_scans,
         count(*) FILTER (WHERE event_type = 'product_view')::int AS product_views,
         count(*) FILTER (WHERE event_type = 'ar_launch')::int AS ar_launch_count,
         count(*) FILTER (WHERE event_type = 'qr_download')::int AS qr_downloads
       FROM analytics_events
       WHERE company_id = $1 AND product_id = $2`,
      [companyId, productId],
    ),
  ]);

  const assets = assetsResult.rows.map(serializeAsset);
  const qr = serializeQr(qrResult.rows[0]);
  const metrics = metricsResult.rows[0] ?? {};

  return serializeProduct(product, {
    assets,
    qr,
    qr_generated_at: qr?.generated_at ?? null,
    qr_png_url: qr?.png_url ?? null,
    qr_svg_url: qr?.svg_url ?? null,
    total_scans: Number(metrics.total_scans ?? 0),
    product_views: Number(metrics.product_views ?? 0),
    ar_launch_count: Number(metrics.ar_launch_count ?? 0),
    qr_downloads: Number(metrics.qr_downloads ?? 0),
  });
}

export async function getProductBySlug(slug) {
  const productResult = await query('SELECT * FROM products WHERE slug = $1 LIMIT 1', [slug]);
  const product = productResult.rows[0];
  if (!product) return null;
  return getProductById(product.company_id, product.id);
}

/**
 * Generate (or return existing) QR code for a product.
 * Returns null instead of throwing if the product has no model yet.
 */
export async function ensureProductQr(productId) {
  const { rows } = await query('SELECT * FROM products WHERE id = $1 LIMIT 1', [productId]);
  const product = rows[0];
  if (!product) throw new ApiError(404, 'Product not found');
  if (!product.slug) throw new ApiError(400, 'Product slug is missing');

  // If product has no model, return null gracefully instead of throwing
  if (!product.model_url && !product.model_asset_id) {
    return null;
  }

  // Return existing QR if already generated
  const existing = await query('SELECT * FROM qr_codes WHERE product_id = $1 LIMIT 1', [productId]);
  if (existing.rows[0]) {
    return serializeQr(existing.rows[0]);
  }

  const targetUrl = productQrTargetUrl(product.slug);
  const publicUrl = productPublicUrl(product.slug);
  const pngBuffer = await QRCode.toBuffer(targetUrl, { width: 1024, margin: 1 });
  const svg = await QRCode.toString(targetUrl, { type: 'svg', width: 1024, margin: 1 });

  const pngFile = {
    originalname: `${product.slug}.png`,
    mimetype: 'image/png',
    size: pngBuffer.length,
    buffer: pngBuffer,
  };
  const pngStored = await storeBuffer(pngFile, 'qr');
  const svgStored = await writeTextFile({
    contents: svg,
    filename: `${product.slug}.svg`,
    folder: 'qr',
    mimeType: 'image/svg+xml',
  });

  const pngAsset = await query(
    `INSERT INTO product_assets
     (company_id, product_id, asset_type, original_name, file_name, file_path, public_url, mime_type, size_bytes, checksum_sha256, metadata)
     VALUES ($1,$2,'qr_png',$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      product.company_id,
      productId,
      `${product.slug}.png`,
      `${product.slug}.png`,
      pngStored.objectKey,
      pngStored.url,
      'image/png',
      pngBuffer.length,
      pngStored.checksum,
      { source: 'generated-qr' },
    ],
  );

  const svgAsset = await query(
    `INSERT INTO product_assets
     (company_id, product_id, asset_type, original_name, file_name, file_path, public_url, mime_type, size_bytes, checksum_sha256, metadata)
     VALUES ($1,$2,'qr_svg',$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      product.company_id,
      productId,
      `${product.slug}.svg`,
      `${product.slug}.svg`,
      svgStored.objectKey,
      svgStored.url,
      'image/svg+xml',
      Buffer.byteLength(svg, 'utf8'),
      crypto.createHash('sha256').update(svg).digest('hex'),
      { source: 'generated-qr' },
    ],
  );

  const qrRow = await query(
    `INSERT INTO qr_codes
     (company_id, product_id, product_slug, target_url, png_asset_id, svg_asset_id, png_url, svg_url, generated_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())
     ON CONFLICT (product_id) DO UPDATE SET
       product_slug = EXCLUDED.product_slug,
       target_url = EXCLUDED.target_url,
       png_asset_id = EXCLUDED.png_asset_id,
       svg_asset_id = EXCLUDED.svg_asset_id,
       png_url = EXCLUDED.png_url,
       svg_url = EXCLUDED.svg_url,
       updated_at = now()
     RETURNING *`,
    [
      product.company_id,
      productId,
      product.slug,
      targetUrl,
      pngAsset.rows[0].id,
      svgAsset.rows[0].id,
      pngStored.url,
      svgStored.url,
    ],
  );

  await query(
    `UPDATE products
     SET qr_code_id = $1,
         public_url = $2,
         is_public = true,
         updated_at = now()
     WHERE id = $3`,
    [qrRow.rows[0].id, publicUrl, productId],
  );

  return serializeQr(qrRow.rows[0]);
}

export async function storeProductAsset({ productId, file, assetType }) {
  const productResult = await query('SELECT * FROM products WHERE id = $1 LIMIT 1', [productId]);
  const product = productResult.rows[0];
  if (!product) throw new ApiError(404, 'Product not found');

  const storage = await storeBuffer(file, assetType === 'thumbnail' ? 'thumbnail' : undefined);
  const inferredAssetType = assetType || storage.category;

  const assetResult = await query(
    `INSERT INTO product_assets
     (company_id, product_id, asset_type, original_name, file_name, file_path, public_url, mime_type, size_bytes, checksum_sha256, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      product.company_id,
      productId,
      inferredAssetType,
      file.originalname,
      path.basename(storage.objectKey),
      storage.objectKey,
      storage.url,
      file.mimetype,
      file.size,
      storage.checksum,
      { source: 'upload' },
    ],
  );

  const asset = assetResult.rows[0];
  if (!asset) throw new ApiError(500, 'Failed to store asset');

  if (asset.asset_type === 'thumbnail') {
    await query(
      `UPDATE products
       SET image_url = $1,
           thumbnail_asset_id = $2,
           updated_at = now()
       WHERE id = $3`,
      [storage.url, asset.id, productId],
    );
  } else if (asset.asset_type === 'image') {
    await query(
      `UPDATE products
       SET image_url = COALESCE(image_url, $1),
           thumbnail_asset_id = COALESCE(thumbnail_asset_id, $2),
           updated_at = now()
       WHERE id = $3`,
      [storage.url, asset.id, productId],
    );
  } else if (asset.asset_type === 'model') {
    await query(
      `UPDATE products
       SET model_url = $1,
           model_asset_id = $2,
           is_public = true,
           updated_at = now()
       WHERE id = $3`,
      [storage.url, asset.id, productId],
    );
  } else if (asset.asset_type === 'usdz_model') {
    await query(
      `UPDATE products
       SET usdz_url = $1,
           usdz_asset_id = $2,
           is_public = true,
           updated_at = now()
       WHERE id = $3`,
      [storage.url, asset.id, productId],
    );
  } else if (asset.asset_type === 'document') {
    await query(
      `UPDATE products
       SET document_url = COALESCE(document_url, $1),
           updated_at = now()
       WHERE id = $2`,
      [storage.url, productId],
    );
  }

  // Always attempt QR generation after model upload
  let qr = null;
  if (asset.asset_type === 'model') {
    qr = await ensureProductQr(productId);
  }

  const updatedProduct = await getProductById(product.company_id, productId);

  return {
    ...serializeAsset(asset),
    url: storage.url,
    product: updatedProduct,
    qr,
  };
}

export async function recordAnalyticsEvent({ companyId, productId, eventType, metadata = {} }) {
  const { rows } = await query(
    `INSERT INTO analytics_events (company_id, product_id, event_type, metadata)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [companyId, productId, eventType, metadata],
  );
  return rows[0];
}

export async function getProductMetrics(companyId, productId) {
  const { rows } = await query(
    `SELECT
       count(*) FILTER (WHERE event_type = 'qr_scan')::int AS total_scans,
       count(*) FILTER (WHERE event_type = 'product_view')::int AS product_views,
       count(*) FILTER (WHERE event_type = 'ar_launch')::int AS ar_launch_count,
       count(*) FILTER (WHERE event_type = 'qr_download')::int AS qr_downloads,
       count(*) FILTER (WHERE event_type = 'session_duration')::int AS session_duration_events
     FROM analytics_events
     WHERE company_id = $1 AND product_id = $2`,
    [companyId, productId],
  );

  return rows[0] ?? {
    total_scans: 0,
    product_views: 0,
    ar_launch_count: 0,
    qr_downloads: 0,
    session_duration_events: 0,
  };
}
