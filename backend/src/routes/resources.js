import { Router } from 'express';
import multer from 'multer';
import QRCode from 'qrcode';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  catalogSchema,
  organizationSchema,
  eventSchema,
  idParam,
  leadSchema,
  preferencesSchema,
  productSchema,
  profileSchema,
  supportTicketSchema,
} from '../schemas.js';
import { deleteObject, maxFileSizeBytes, uploadBuffer } from '../services/storage.js';
import {
  createProduct,
  ensureProductQr,
  getProductById,
  getProductMetrics,
  listProductsWithMetrics,
  patchProductStatus,
  recordAnalyticsEvent,
  serializeAsset,
  serializeProduct,
  storeProductAsset,
  updateProduct,
} from '../services/productFlow.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

export const resourcesRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxFileSizeBytes } });

resourcesRouter.use(requireAuth);

resourcesRouter.get('/me', asyncHandler(async (req, res) => {
  let { rows } = await query(
    `SELECT id, organization_id, name, email, phone, avatar_url, role, designation, department, bio,
            banner_url, website, location, social_links, email_verified, last_login_at, created_at, updated_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  
  if (!rows[0]) {
    // Just-In-Time Provisioning: Sync Supabase user to local DB
    // 1. Ensure company exists or create a default one
    let organizationId = req.user.organization_id;
    if (organizationId === 'default-company') {
      const companyRes = await query(
        `INSERT INTO organizations (name) VALUES ('Default Company') RETURNING id`
      );
      organizationId = companyRes.rows[0].id;
    }

    // 2. Insert the user
    await query(
      `INSERT INTO users (id, organization_id, name, email, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, 'supabase_managed')
       ON CONFLICT (id) DO NOTHING`,
      [req.user.id, organizationId, req.user.name || 'User', req.user.email, 'Company Admin']
    );

    // 3. Fetch again
    const newRows = await query(
      `SELECT id, organization_id, name, email, phone, avatar_url, role, designation, department, bio,
              banner_url, website, location, social_links, email_verified, last_login_at, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    rows = newRows.rows;
  }
  
  if (!rows[0]) return res.status(404).json({ message: 'User not found' });
  const u = rows[0];
  res.json({
    user: {
      id: u.id, organizationId: u.organization_id, name: u.name, email: u.email, phone: u.phone,
      avatarUrl: u.avatar_url, role: u.role, designation: u.designation, department: u.department,
      bio: u.bio, bannerUrl: u.banner_url, website: u.website, location: u.location,
      socialLinks: u.social_links ?? {}, emailVerified: u.email_verified,
      lastLoginAt: u.last_login_at, createdAt: u.created_at,
    }
  });
}));

resourcesRouter.put(
  '/me',
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const { name, email, phone, avatarUrl, currentPassword, newPassword } = req.validated.body;
    const { designation, department, bio, bannerUrl, website, location, socialLinks } = req.body;

    const existing = await query('SELECT * FROM users WHERE id = $1 AND organization_id = $2', [
      req.user.id, req.user.organization_id,
    ]);
    const user = existing.rows[0];
    if (!user) throw new ApiError(404, 'User not found');

    if (email && email !== user.email) {
      const emailTaken = await query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, user.id]);
      if (emailTaken.rows[0]) throw new ApiError(409, 'Email already exists');
    }

    if (newPassword) {
      if (!currentPassword) throw new ApiError(400, 'Current password is required');
      const matches = await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.compare(currentPassword, user.password_hash));
      if (!matches) throw new ApiError(400, 'Current password is incorrect');
      const passwordHash = await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.hash(newPassword, 12));
      await query(
        `UPDATE users
         SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone),
             avatar_url = COALESCE($4, avatar_url), password_hash = $5,
             designation = COALESCE($6, designation), department = COALESCE($7, department),
             bio = COALESCE($8, bio), banner_url = COALESCE($9, banner_url),
             website = COALESCE($10, website), location = COALESCE($11, location),
             social_links = COALESCE($12, social_links), updated_at = now()
         WHERE id = $13 AND organization_id = $14`,
        [name ?? null, email ?? null, phone ?? null, avatarUrl ?? null, passwordHash,
         designation ?? null, department ?? null, bio ?? null, bannerUrl ?? null,
         website ?? null, location ?? null,
         socialLinks ? JSON.stringify(socialLinks) : null,
         req.user.id, req.user.organization_id],
      );
    } else {
      await query(
        `UPDATE users
         SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone),
             avatar_url = COALESCE($4, avatar_url),
             designation = COALESCE($5, designation), department = COALESCE($6, department),
             bio = COALESCE($7, bio), banner_url = COALESCE($8, banner_url),
             website = COALESCE($9, website), location = COALESCE($10, location),
             social_links = COALESCE($11, social_links), updated_at = now()
         WHERE id = $12 AND organization_id = $13`,
        [name ?? null, email ?? null, phone ?? null, avatarUrl ?? null,
         designation ?? null, department ?? null, bio ?? null, bannerUrl ?? null,
         website ?? null, location ?? null,
         socialLinks ? JSON.stringify(socialLinks) : null,
         req.user.id, req.user.organization_id],
      );
    }

    const { rows } = await query(
      `SELECT id, organization_id, name, email, phone, avatar_url, role, designation, department, bio,
              banner_url, website, location, social_links, email_verified, last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const u = rows[0];
    res.json({
      user: {
        id: u.id, organizationId: u.organization_id, name: u.name, email: u.email, phone: u.phone,
        avatarUrl: u.avatar_url, role: u.role, designation: u.designation, department: u.department,
        bio: u.bio, bannerUrl: u.banner_url, website: u.website, location: u.location,
        socialLinks: u.social_links ?? {}, emailVerified: u.email_verified,
        lastLoginAt: u.last_login_at, createdAt: u.created_at,
      }
    });
  }),
);

// GET /api/sessions - List active sessions for current user
resourcesRouter.get('/sessions', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, ip_address, user_agent, created_at, expires_at
     FROM user_sessions
     WHERE user_id = $1 AND expires_at > now() AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
}));

// DELETE /api/sessions - Revoke all sessions (logout all devices)
resourcesRouter.delete('/sessions', asyncHandler(async (req, res) => {
  await query(
    `UPDATE user_sessions SET revoked_at = now()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [req.user.id]
  );
  res.status(204).end();
}));


resourcesRouter.get(
  '/company',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM organizations WHERE id = $1', [req.user.organization_id]);
    res.json(rows[0]);
  }),
);

resourcesRouter.put(
  '/company',
  requireRole('Manager'),
  validate(organizationSchema),
  asyncHandler(async (req, res) => {
    const { name, website, logoUrl, primaryColor, profile } = req.validated.body;
    const { rows } = await query(
      `UPDATE organizations
       SET name = $1, website = $2, logo_url = $3, primary_color = $4, profile = $5, updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [name, website || null, logoUrl || null, primaryColor, profile || null, req.user.organization_id],
    );
    res.json(rows[0]);
  }),
);

resourcesRouter.get(
  '/preferences',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM organization_preferences WHERE organization_id = $1', [req.user.organization_id]);
    res.json(rows[0] ?? { organization_id: req.user.organization_id });
  }),
);

resourcesRouter.put(
  '/preferences',
  requireRole('Manager'),
  validate(preferencesSchema),
  asyncHandler(async (req, res) => {
    const body = req.validated.body;
    const { rows } = await query(
      `INSERT INTO organization_preferences
       (organization_id, onboarding_enabled, default_brand_color, default_catalog_visibility, notification_preferences, appearance_preferences)
       VALUES ($1, COALESCE($2, true), COALESCE($3, '#2563EB'), COALESCE($4, 'private'), COALESCE($5, '{}'::jsonb), COALESCE($6, '{}'::jsonb))
       ON CONFLICT (organization_id) DO UPDATE SET
         onboarding_enabled = COALESCE(EXCLUDED.onboarding_enabled, organization_preferences.onboarding_enabled),
         default_brand_color = COALESCE(EXCLUDED.default_brand_color, organization_preferences.default_brand_color),
         default_catalog_visibility = COALESCE(EXCLUDED.default_catalog_visibility, organization_preferences.default_catalog_visibility),
         notification_preferences = COALESCE(EXCLUDED.notification_preferences, organization_preferences.notification_preferences),
         appearance_preferences = COALESCE(EXCLUDED.appearance_preferences, organization_preferences.appearance_preferences),
         updated_at = now()
       RETURNING *`,
      [
        req.user.organization_id,
        body.onboardingEnabled,
        body.defaultBrandColor,
        body.defaultCatalogVisibility,
        body.notificationPreferences ?? null,
        body.appearancePreferences ?? null,
      ],
    );
    res.json(rows[0]);
  }),
);

resourcesRouter.get(
  '/support-tickets',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM support_tickets WHERE organization_id = $1 ORDER BY created_at DESC', [
      req.user.organization_id,
    ]);
    res.json(rows);
  }),
);

resourcesRouter.post(
  '/support-tickets',
  validate(supportTicketSchema),
  asyncHandler(async (req, res) => {
    const { category, subject, message } = req.validated.body;
    const { rows } = await query(
      `INSERT INTO support_tickets (organization_id, user_id, category, subject, message)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.organization_id, req.user.id, category, subject, message],
    );
    res.status(201).json(rows[0]);
  }),
);

resourcesRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const rows = await listProductsWithMetrics(req.user.organization_id);
    res.json(rows);
  }),
);

import { enforceQuota } from '../middleware/entitlement.js';
import { usageService } from '../services/usage/usageService.js';

resourcesRouter.post(
  '/products',
  requireRole('Manager'),
  enforceQuota('products'),
  validate(productSchema),
  asyncHandler(async (req, res) => {
    const saved = await createProduct(req.user.organization_id, req.user.id, req.validated.body);
    await usageService.incrementCounter(req.user.organization_id, 'products', 1);
    res.status(201).json(saved);
  }),
);

resourcesRouter.get(
  '/products/:id',
  validate(idParam),
  asyncHandler(async (req, res) => {
    const product = await getProductById(req.user.organization_id, req.validated.params.id);
    if (!product) throw new ApiError(404, 'Product not found');
    res.json(product);
  }),
);
resourcesRouter.put(
  '/products/:id',
  requireRole('Manager'),
  validate(idParam.merge(productSchema)),
  asyncHandler(async (req, res) => {
    const saved = await updateProduct(req.user.organization_id, req.validated.params.id, req.validated.body);
    res.json(saved);
  }),
);

// Quick status change: Draft → Published → Archived
resourcesRouter.patch(
  '/products/:id/status',
  requireRole('Manager'),
  validate(idParam),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status || !['Draft', 'Published', 'Archived'].includes(status)) {
      throw new ApiError(400, 'status must be Draft, Published, or Archived');
    }
    const saved = await patchProductStatus(req.user.organization_id, req.validated.params.id, status);
    res.json(saved);
  }),
);

resourcesRouter.delete(
  '/products/:id',
  requireRole('Manager'),
  validate(idParam),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'SELECT file_path FROM product_assets WHERE organization_id = $1 AND product_id = $2',
      [req.user.organization_id, req.validated.params.id],
    );
    for (const row of rows) {
      await deleteObject(row.file_path);
    }

    const legacy = await query('SELECT object_key FROM files WHERE organization_id = $1 AND product_id = $2', [
      req.user.organization_id,
      req.validated.params.id,
    ]);
    for (const row of legacy.rows) {
      await deleteObject(row.object_key);
    }

    const deleted = await query('DELETE FROM products WHERE id = $1 AND organization_id = $2 RETURNING id', [
      req.validated.params.id,
      req.user.organization_id,
    ]);
    if (!deleted.rows[0]) throw new ApiError(404, 'Product not found');
    res.status(204).end();
  }),
);

resourcesRouter.get(
  '/products/:id/metrics',
  validate(idParam),
  asyncHandler(async (req, res) => {
    const metrics = await getProductMetrics(req.user.organization_id, req.validated.params.id);
    res.json(metrics);
  }),
);

resourcesRouter.get(
  '/products/:id/qr',
  validate(idParam),
  asyncHandler(async (req, res) => {
    const product = await getProductById(req.user.organization_id, req.validated.params.id);
    if (!product) throw new ApiError(404, 'Product not found');
    // Return existing QR, or try to generate one, or return null if no model
    const qr = product.qr ?? await ensureProductQr(req.validated.params.id);
    if (!qr) {
      res.status(204).end();
      return;
    }
    res.json(qr);
  }),
);

resourcesRouter.get(
  '/catalogs',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM catalogs WHERE organization_id = $1 ORDER BY created_at DESC', [
      req.user.organization_id,
    ]);
    res.json(rows);
  }),
);

resourcesRouter.get(
  '/catalogs/:id',
  validate(idParam),
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM catalogs WHERE id = $1 AND organization_id = $2', [
      req.validated.params.id,
      req.user.organization_id,
    ]);
    if (!rows[0]) throw new ApiError(404, 'Catalog not found');

    const products = await query(
      'SELECT product_id FROM catalog_products WHERE catalog_id = $1 ORDER BY sort_order ASC',
      [req.validated.params.id],
    );

    res.json({ ...rows[0], productIds: products.rows.map((row) => row.product_id) });
  }),
);

resourcesRouter.post('/catalogs', requireRole('Manager'), validate(catalogSchema), saveCatalog('create'));
resourcesRouter.put('/catalogs/:id', requireRole('Manager'), validate(idParam.merge(catalogSchema)), saveCatalog('update'));
resourcesRouter.delete('/catalogs/:id', requireRole('Manager'), validate(idParam), deleteOwned('catalogs'));

resourcesRouter.post(
  '/catalogs/:id/upload-pdf',
  requireRole('Manager'),
  validate(idParam),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'No PDF file provided');
    const { rows } = await query('SELECT * FROM catalogs WHERE id = $1 AND organization_id = $2', [
      req.validated.params.id,
      req.user.organization_id,
    ]);
    if (!rows[0]) throw new ApiError(404, 'Catalog not found');

    const stored = await uploadBuffer(req.file);
    await query('UPDATE catalogs SET pdf_url = $1, updated_at = now() WHERE id = $2', [
      stored.url,
      req.validated.params.id,
    ]);
    res.json({ pdf_url: stored.url });
  }),
);

resourcesRouter.post(
  '/uploads/record',
  requireRole('Company Admin', 'Sales User'),
  asyncHandler(async (req, res) => {
    const { objectKey, url, originalName, mimeType, size, productId, assetType, checksum } = req.body;
    if (!objectKey || !url) throw new ApiError(400, 'Missing objectKey or url');

    if (productId) {
      const productResult = await query('SELECT * FROM products WHERE id = $1 LIMIT 1', [productId]);
      const product = productResult.rows[0];
      if (!product) throw new ApiError(404, 'Product not found');
      
      const inferredAssetType = assetType || (mimeType?.startsWith('image/') ? 'thumbnail' : (mimeType?.includes('pdf') ? 'document' : '3d_model'));
      
      const assetResult = await query(
        `INSERT INTO product_assets
         (organization_id, product_id, asset_type, original_name, file_name, file_path, public_url, mime_type, size_bytes, checksum_sha256, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          product.organization_id,
          productId,
          inferredAssetType,
          originalName || objectKey.split('/').pop(),
          objectKey.split('/').pop(),
          objectKey,
          url,
          mimeType || 'application/octet-stream',
          size || 0,
          checksum || null,
          { source: 'upload' },
        ],
      );
      
      const asset = assetResult.rows[0];

      if (asset.asset_type === 'thumbnail') {
        await query(
          `UPDATE products SET image_url = $1, thumbnail_asset_id = $2, updated_at = now() WHERE id = $3`,
          [url, asset.id, productId],
        );
      } else if (asset.asset_type === 'image') {
        await query(
          `UPDATE products SET image_url = COALESCE(image_url, $1), thumbnail_asset_id = COALESCE(thumbnail_asset_id, $2), updated_at = now() WHERE id = $3`,
          [url, asset.id, productId],
        );
      } else if (asset.asset_type === 'model') {
        await query(
          `UPDATE products SET model_url = $1, model_asset_id = $2, is_public = true, updated_at = now() WHERE id = $3`,
          [url, asset.id, productId],
        );
      } else if (asset.asset_type === 'usdz_model') {
        await query(
          `UPDATE products SET usdz_url = $1, usdz_asset_id = $2, is_public = true, updated_at = now() WHERE id = $3`,
          [url, asset.id, productId],
        );
      } else if (asset.asset_type === 'document') {
        await query(
          `UPDATE products SET document_url = COALESCE(document_url, $1), updated_at = now() WHERE id = $2`,
          [url, productId],
        );
      }

      let qr = null;
      if (asset.asset_type === 'model') {
        qr = await ensureProductQr(productId);
      }

      const updatedProduct = await getProductById(product.organization_id, productId);

      res.status(201).json({
        ...serializeAsset(asset),
        url: url,
        product: updatedProduct,
        qr
      });
      return;
    }

    const category = mimeType?.startsWith('image/') ? 'image' : (mimeType?.includes('pdf') ? 'document' : 'other');
    const { rows } = await query(
      `INSERT INTO files (organization_id, product_id, file_category, original_name, object_key, url, mime_type, size_bytes, checksum_sha256)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.organization_id,
        null,
        category,
        originalName || objectKey.split('/').pop(),
        objectKey,
        url,
        mimeType || 'application/octet-stream',
        size || 0,
        checksum || null,
      ],
    );
    res.status(201).json(rows[0]);
  }),
);

resourcesRouter.post(
  '/uploads',
  requireRole('Sales User'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'No file provided');
    const productId = req.body.productId || null;
    const assetType = req.body.assetType || null;

    if (productId) {
      const result = await storeProductAsset({ productId, file: req.file, assetType });
      res.status(201).json(result);
      return;
    }

    const stored = await uploadBuffer(req.file);
    const { rows } = await query(
      `INSERT INTO files (organization_id, product_id, file_category, original_name, object_key, url, mime_type, size_bytes, checksum_sha256)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.organization_id,
        null,
        stored.category,
        req.file.originalname,
        stored.objectKey,
        stored.url,
        req.file.mimetype,
        req.file.size,
        stored.checksum,
      ],
    );
    res.status(201).json(rows[0]);
  }),
);

resourcesRouter.delete(
  '/uploads/:id',
  requireRole('Sales User'),
  validate(idParam),
  asyncHandler(async (req, res) => {
    const { id } = req.validated.params;
    const legacy = await query('SELECT object_key FROM files WHERE id = $1 AND organization_id = $2', [id, req.user.organization_id]);
    if (legacy.rows[0]) {
      await deleteObject(legacy.rows[0].object_key);
      await query('DELETE FROM files WHERE id = $1', [id]);
      res.status(204).end();
      return;
    }

    const asset = await query('SELECT file_path FROM product_assets WHERE id = $1 AND organization_id = $2', [
      id,
      req.user.organization_id,
    ]);
    if (!asset.rows[0]) throw new ApiError(404, 'File not found');

    await deleteObject(asset.rows[0].file_path);
    await query('DELETE FROM product_assets WHERE id = $1', [id]);
    res.status(204).end();
  }),
);

resourcesRouter.post(
  '/qr/:type/:id',
  requireRole('Sales User'),
  asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    if (type === 'product') {
      const qr = await ensureProductQr(id);
      res.status(201).json(qr);
      return;
    }

    if (type === 'catalog') {
      const targetUrl = `${config.appUrl}/catalog-preview?id=${id}`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 1024, margin: 1 });
      res.status(201).json({
        id: `catalog-${id}`,
        organization_id: req.user.organization_id,
        product_id: null,
        product_slug: `catalog-${id}`,
        target_url: targetUrl,
        png_url: qrDataUrl,
        svg_url: qrDataUrl,
      });
      return;
    }

    throw new ApiError(400, 'Invalid QR entity type');
  }),
);

resourcesRouter.get(
  '/leads',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM leads WHERE organization_id = $1 ORDER BY created_at DESC', [
      req.user.organization_id,
    ]);
    res.json(rows);
  }),
);
resourcesRouter.post('/leads', validate(leadSchema), asyncHandler(saveLead));
resourcesRouter.put('/leads/:id', requireRole('Sales User'), validate(idParam.merge(leadSchema)), asyncHandler(saveLead));
resourcesRouter.delete('/leads/:id', requireRole('Sales User'), validate(idParam), deleteOwned('leads'));

resourcesRouter.post('/analytics/events', validate(eventSchema), asyncHandler(async (req, res) => {
  const event = req.validated.body;
  const { rows } = await query(
    `INSERT INTO analytics_events (organization_id, product_id, catalog_id, lead_id, event_type, metadata)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      req.user.organization_id,
      event.productId ?? null,
      event.catalogId ?? null,
      event.leadId ?? null,
      event.eventType,
      event.metadata,
    ],
  );
  res.status(201).json(rows[0]);
}));

resourcesRouter.get('/analytics/summary', asyncHandler(async (req, res) => {
  const counts = await query(
    `SELECT event_type, count(*)::int AS count
     FROM analytics_events
     WHERE organization_id = $1
     GROUP BY event_type`,
    [req.user.organization_id],
  );
  const leads = await query('SELECT status, count(*)::int AS count FROM leads WHERE organization_id=$1 GROUP BY status', [
    req.user.organization_id,
  ]);
  res.json({ events: counts.rows, leads: leads.rows });
}));

function readOwned(table) {
  return asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT * FROM ${table} WHERE id = $1 AND organization_id = $2`, [
      req.validated.params.id,
      req.user.organization_id,
    ]);
    if (!rows[0]) throw new ApiError(404, 'Resource not found');
    res.json(rows[0]);
  });
}

function deleteOwned(table) {
  return asyncHandler(async (req, res) => {
    const { rows } = await query(`DELETE FROM ${table} WHERE id = $1 AND organization_id = $2 RETURNING id`, [
      req.validated.params.id,
      req.user.organization_id,
    ]);
    if (!rows[0]) throw new ApiError(404, 'Resource not found');
    res.status(204).end();
  });
}

function slugify(value) {
  return `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
}

function saveCatalog(mode) {
  return asyncHandler(async (req, res) => {
    const catalog = req.validated.body;
    const result =
      mode === 'create'
        ? await query(
            `INSERT INTO catalogs (organization_id, name, description, status, slug, created_by, published_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             RETURNING *`,
            [
              req.user.organization_id,
              catalog.name,
              catalog.description ?? null,
              catalog.status,
              slugify(catalog.name),
              req.user.id,
              catalog.status === 'Published' ? new Date() : null,
            ],
          )
        : await query(
            `UPDATE catalogs SET name=$1, description=$2, status=$3,
             published_at = CASE WHEN $6::text='Published' THEN coalesce(published_at, now()) ELSE published_at END,
             updated_at=now()
             WHERE id=$4 AND organization_id=$5 RETURNING *`,
            [catalog.name, catalog.description ?? null, catalog.status, req.validated.params.id, req.user.organization_id, catalog.status],
          );

    const saved = result.rows[0];
    if (!saved) throw new ApiError(404, 'Catalog not found');
    await query('DELETE FROM catalog_products WHERE catalog_id=$1', [saved.id]);
    await Promise.all(
      catalog.productIds.map((productId, index) =>
        query(
          'INSERT INTO catalog_products (catalog_id, product_id, sort_order) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
          [saved.id, productId, index],
        ),
      ),
    );
    res.status(mode === 'create' ? 201 : 200).json(saved);
  });
}

async function saveLead(req, res) {
  const lead = req.validated.body;
  const result = req.validated.params?.id
    ? await query(
        `UPDATE leads SET name=$1,email=$2,phone=$3,company=$4,product_id=$5,catalog_id=$6,status=$7,
         source=$8,score=$9,notes=$10,updated_at=now()
         WHERE id=$11 AND organization_id=$12 RETURNING *`,
        [
          lead.name,
          lead.email,
          lead.phone ?? null,
          lead.company ?? null,
          lead.productId ?? null,
          lead.catalogId ?? null,
          lead.status,
          lead.source,
          lead.score,
          lead.notes ?? null,
          req.validated.params.id,
          req.user.organization_id,
        ],
      )
    : await query(
        `INSERT INTO leads (organization_id, product_id, catalog_id, name, email, phone, company, status, source, score, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          req.user.organization_id,
          lead.productId ?? null,
          lead.catalogId ?? null,
          lead.name,
          lead.email,
          lead.phone ?? null,
          lead.company ?? null,
          lead.status,
          lead.source,
          lead.score,
          lead.notes ?? null,
        ],
      );
  if (!result.rows[0]) throw new ApiError(404, 'Lead not found');
  res.status(req.validated.params?.id ? 200 : 201).json(result.rows[0]);
}
