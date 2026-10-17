import { pool } from '../../db/pool.js';
import QRCode from 'qrcode';
import { trackEvent } from '../trackingEngine.js';

export const catalogService = {
  /**
   * List catalogs for an organization with item counts
   */
  async listCatalogs(organizationId, { status, search } = {}) {
    let sql = `
      SELECT c.*,
        COALESCE((SELECT COUNT(*)::int FROM catalog_products cp WHERE cp.catalog_id = c.id), 0) as product_count
      FROM catalogs c
      WHERE c.organization_id = $1
    `;
    const params = [organizationId];

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    } else {
      sql += ` AND c.status != 'Archived'`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length} OR c.slug ILIKE $${params.length})`;
    }

    sql += ` ORDER BY c.updated_at DESC`;

    const res = await pool.query(sql, params);
    return res.rows;
  },

  /**
   * Fetch single catalog detail with pinned products and Vault asset data
   */
  async getCatalog(catalogId, organizationId) {
    const catRes = await pool.query(
      `SELECT * FROM catalogs WHERE id = $1 AND organization_id = $2`,
      [catalogId, organizationId]
    );
    if (catRes.rows.length === 0) return null;
    const catalog = catRes.rows[0];

    // Fetch pinned products with Vault asset join
    const prodRes = await pool.query(
      `SELECT 
        cp.product_id,
        cp.sort_order,
        cp.pinned_version_number,
        cp.pinned_asset_id,
        cp.custom_spec_overrides,
        p.name as product_name,
        p.slug as product_slug,
        p.category as product_category,
        p.description as product_description,
        p.specs,
        p.dimensions,
        p.model_url,
        va.name as vault_asset_name,
        va.storage_key as vault_storage_key,
        va.public_url as vault_public_url,
        va.mime_type as vault_mime_type,
        va.size_bytes as vault_size_bytes,
        (SELECT MAX(version_number)::int FROM vault_asset_versions WHERE asset_id = va.id) as latest_vault_version
       FROM catalog_products cp
       JOIN products p ON cp.product_id = p.id
       LEFT JOIN vault_assets va ON cp.pinned_asset_id = va.id OR p.model_asset_id = va.id
       WHERE cp.catalog_id = $1
       ORDER BY cp.sort_order ASC`,
      [catalogId]
    );

    catalog.products = prodRes.rows.map(row => ({
      productId: row.product_id,
      productName: row.product_name,
      productSlug: row.product_slug,
      category: row.product_category,
      description: row.product_description,
      specs: { ...row.specs, ...row.custom_spec_overrides },
      dimensions: row.dimensions,
      pinnedVersionNumber: row.pinned_version_number || 1,
      pinnedAssetId: row.pinned_asset_id,
      vaultAssetName: row.vault_asset_name,
      vaultPublicUrl: row.vault_public_url,
      vaultStorageKey: row.vault_storage_key,
      latestVaultVersion: row.latest_vault_version || 1,
      isOutdated: (row.latest_vault_version || 1) > (row.pinned_version_number || 1),
      sortOrder: row.sort_order
    }));

    return catalog;
  },

  /**
   * Create new catalog in Omni Studio
   */
  async createCatalog(organizationId, userId, data) {
    const { name, description, slug, layout_config, branding } = data;
    if (!name) throw new Error('Catalog name is required');

    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Math.floor(Math.random() * 10000);

    const defaultLayout = layout_config || {
      sections: [
        {
          id: 'sec-hero',
          type: 'hero',
          title: name,
          subtitle: description || 'Industrial Equipment Catalog',
          layoutMode: 'split_3d',
          sortOrder: 0
        },
        {
          id: 'sec-grid',
          type: 'product_grid',
          title: 'Featured Equipment',
          layoutMode: 'grid_spacious',
          visibleFields: {
            showSpecs: true,
            showDimensions: true,
            show3DViewer: true,
            showPricing: false,
            showQuoteCta: true
          },
          sortOrder: 1
        },
        {
          id: 'sec-specs',
          type: 'spec_table',
          title: 'Technical Specifications & Tolerances',
          layoutMode: 'list',
          sortOrder: 2
        },
        {
          id: 'sec-lead',
          type: 'lead_capture',
          title: 'Request Engineering Consultation or Quote',
          layoutMode: 'split_3d',
          sortOrder: 3
        }
      ]
    };

    const defaultBranding = branding || {
      companyName: 'I3DION Partner Dynamics',
      primaryColor: '#2563EB',
      accentColor: '#0F172A',
      fontFamily: 'Inter'
    };

    const res = await pool.query(
      `INSERT INTO catalogs (
        organization_id, name, description, status, slug, layout_config, branding, created_by
      ) VALUES ($1, $2, $3, 'Draft', $4, $5, $6, $7)
      RETURNING *`,
      [
        organizationId,
        name,
        description || '',
        cleanSlug,
        JSON.stringify(defaultLayout),
        JSON.stringify(defaultBranding),
        userId
      ]
    );

    const { usageService } = await import('../usage/usageService.js');
    await usageService.syncOrganizationUsage(organizationId).catch(() => {});

    return res.rows[0];
  },

  /**
   * Update catalog details, layout, branding or status
   */
  async updateCatalog(catalogId, organizationId, updates) {
    const fields = [];
    const values = [];
    let count = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${count++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${count++}`);
      values.push(updates.description);
    }
    if (updates.slug !== undefined) {
      fields.push(`slug = $${count++}`);
      values.push(updates.slug);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${count++}`);
      values.push(updates.status);
    }
    if (updates.layout_config !== undefined) {
      fields.push(`layout_config = $${count++}`);
      values.push(JSON.stringify(updates.layout_config));
    }
    if (updates.branding !== undefined) {
      fields.push(`branding = $${count++}`);
      values.push(JSON.stringify(updates.branding));
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(catalogId, organizationId);

    const res = await pool.query(
      `UPDATE catalogs SET ${fields.join(', ')} WHERE id = $${count++} AND organization_id = $${count++} RETURNING *`,
      values
    );

    return res.rows[0];
  },

  /**
   * Pin or update a product in the catalog with explicit version pinning
   */
  async pinProduct(catalogId, organizationId, { productId, pinnedVersionNumber = 1, pinnedAssetId = null, customSpecOverrides = {}, sortOrder = 0 }) {
    // Verify catalog ownership
    const catCheck = await pool.query(
      `SELECT id FROM catalogs WHERE id = $1 AND organization_id = $2`,
      [catalogId, organizationId]
    );
    if (catCheck.rows.length === 0) throw new Error('Catalog not found');

    // If pinnedAssetId not explicitly provided, find associated vault asset from product
    let assetId = pinnedAssetId;
    if (!assetId) {
      const pRes = await pool.query(
        `SELECT model_asset_id, model_url FROM products WHERE id = $1 AND organization_id = $2`,
        [productId, organizationId]
      );
      if (pRes.rows[0]?.model_asset_id) {
        assetId = pRes.rows[0].model_asset_id;
      } else if (pRes.rows[0]?.model_url) {
        const vRes = await pool.query(
          `SELECT id FROM vault_assets WHERE storage_key = $1 OR public_url = $1 AND organization_id = $2`,
          [pRes.rows[0].model_url, organizationId]
        );
        assetId = vRes.rows[0]?.id || null;
      }
    }

    await pool.query(
      `INSERT INTO catalog_products (
        catalog_id, product_id, sort_order, pinned_version_number, pinned_asset_id, custom_spec_overrides
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (catalog_id, product_id) DO UPDATE SET
        sort_order = EXCLUDED.sort_order,
        pinned_version_number = EXCLUDED.pinned_version_number,
        pinned_asset_id = EXCLUDED.pinned_asset_id,
        custom_spec_overrides = EXCLUDED.custom_spec_overrides`,
      [catalogId, productId, sortOrder, pinnedVersionNumber, assetId, JSON.stringify(customSpecOverrides)]
    );

    return { success: true, catalogId, productId, pinnedVersionNumber };
  },

  /**
   * Remove a product from the catalog
   */
  async unpinProduct(catalogId, productId, organizationId) {
    const res = await pool.query(
      `DELETE FROM catalog_products 
       WHERE catalog_id = $1 AND product_id = $2
       AND catalog_id IN (SELECT id FROM catalogs WHERE organization_id = $3)
       RETURNING *`,
      [catalogId, productId, organizationId]
    );
    return { success: res.rows.length > 0 };
  },

  /**
   * Duplicate existing catalog with full sections, branding, and pinned items
   */
  async duplicateCatalog(catalogId, organizationId, userId) {
    const original = await this.getCatalog(catalogId, organizationId);
    if (!original) throw new Error('Catalog not found');

    const newName = `${original.name} (Copy)`;
    const newSlug = `${original.slug}-copy-${Math.floor(Math.random() * 10000)}`;

    const res = await pool.query(
      `INSERT INTO catalogs (
        organization_id, name, description, status, slug, layout_config, branding, created_by
      ) VALUES ($1, $2, $3, 'Draft', $4, $5, $6, $7)
      RETURNING *`,
      [
        organizationId,
        newName,
        original.description,
        newSlug,
        JSON.stringify(original.layout_config || {}),
        JSON.stringify(original.branding || {}),
        userId
      ]
    );
    const newCatalog = res.rows[0];

    // Clone product associations with exact pinned version numbers
    if (original.products && original.products.length > 0) {
      for (const p of original.products) {
        await pool.query(
          `INSERT INTO catalog_products (
            catalog_id, product_id, sort_order, pinned_version_number, pinned_asset_id, custom_spec_overrides
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newCatalog.id,
            p.productId,
            p.sortOrder,
            p.pinnedVersionNumber || 1,
            p.pinnedAssetId || null,
            JSON.stringify(p.specs || {})
          ]
        );
      }
    }

    return this.getCatalog(newCatalog.id, organizationId);
  },

  /**
   * Check sync status between pinned catalog items and Spatial Vault
   * Detects "Asset updated in Vault — Re-publish?" requirement
   */
  async getSyncStatus(catalogId, organizationId) {
    const catalog = await this.getCatalog(catalogId, organizationId);
    if (!catalog) throw new Error('Catalog not found');

    const outdatedItems = catalog.products.filter(p => p.isOutdated).map(p => ({
      productId: p.productId,
      productName: p.productName,
      vaultAssetName: p.vaultAssetName,
      pinnedVersion: p.pinnedVersionNumber,
      latestVaultVersion: p.latestVaultVersion
    }));

    return {
      catalogId,
      hasOutdatedAssets: outdatedItems.length > 0,
      outdatedCount: outdatedItems.length,
      outdatedItems,
      totalProducts: catalog.products.length
    };
  },

  /**
   * Explicitly sync catalog products to latest Vault versions upon user confirmation
   */
  async syncAssets(catalogId, organizationId, productIds = null) {
    const catalog = await this.getCatalog(catalogId, organizationId);
    if (!catalog) throw new Error('Catalog not found');

    const toUpdate = catalog.products.filter(p => 
      p.isOutdated && (!productIds || productIds.includes(p.productId))
    );

    for (const p of toUpdate) {
      await pool.query(
        `UPDATE catalog_products
         SET pinned_version_number = $1
         WHERE catalog_id = $2 AND product_id = $3`,
        [p.latestVaultVersion, catalogId, p.productId]
      );
    }

    return {
      success: true,
      updatedCount: toUpdate.length,
      updatedProducts: toUpdate.map(p => ({
        productId: p.productId,
        productName: p.productName,
        fromVersion: p.pinnedVersionNumber,
        toVersion: p.latestVaultVersion
      }))
    };
  },

  /**
   * Universal Publishing Ceremony: Freezes an immutable snapshot (Decision D-05)
   */
  async publishCatalog(catalogId, organizationId, userId, { baseUrl = 'https://hub.i3dion.com' } = {}) {
    const catalog = await this.getCatalog(catalogId, organizationId);
    if (!catalog) throw new Error('Catalog not found');
    if (!catalog.products || catalog.products.length === 0) {
      throw new Error('Cannot publish catalog with 0 products. Add at least one product before publishing.');
    }

    // Freeze snapshot
    const immutableSnapshot = {
      snapshotVersion: '1.0',
      publishedAt: new Date().toISOString(),
      publisherUserId: userId,
      catalog: {
        id: catalog.id,
        name: catalog.name,
        slug: catalog.slug,
        description: catalog.description,
        branding: catalog.branding,
        layout_config: catalog.layout_config
      },
      products: catalog.products.map(p => ({
        productId: p.productId,
        productName: p.productName,
        productSlug: p.productSlug,
        category: p.category,
        description: p.description,
        specs: p.specs,
        dimensions: p.dimensions,
        pinnedVersionNumber: p.pinnedVersionNumber,
        pinnedAssetId: p.pinnedAssetId,
        vaultStorageKey: p.vaultStorageKey,
        vaultPublicUrl: p.vaultPublicUrl
      }))
    };

    const targetUrl = `${baseUrl}/catalog/${catalog.slug}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 1024, margin: 1 });

    const res = await pool.query(
      `UPDATE catalogs
       SET status = 'Published',
           published_at = NOW(),
           published_snapshot = $1,
           pdf_url = COALESCE(pdf_url, $2),
           updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [JSON.stringify(immutableSnapshot), `/api/studio/catalogs/${catalogId}/export/pdf`, catalogId, organizationId]
    );

    // Track event in Lens
    await trackEvent({
      organizationId,
      eventType: 'catalog.published',
      sourceProduct: 'omni_studio',
      entityId: catalogId,
      entityType: 'catalog',
      metadata: {
        slug: catalog.slug,
        productCount: catalog.products.length
      }
    }).catch(() => {});

    return {
      ...res.rows[0],
      qrDataUrl,
      publicUrl: targetUrl
    };
  },

  /**
   * Generates QR Code vector/image representation for catalog
   */
  async generateQr(catalogId, organizationId, { format = 'svg', baseUrl = 'https://hub.i3dion.com' } = {}) {
    const catRes = await pool.query(
      `SELECT slug FROM catalogs WHERE id = $1 AND organization_id = $2`,
      [catalogId, organizationId]
    );
    if (catRes.rows.length === 0) throw new Error('Catalog not found');
    const slug = catRes.rows[0].slug;
    const targetUrl = `${baseUrl}/catalog/${slug}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(targetUrl, { type: 'svg', width: 512, margin: 1 });
      return { format: 'svg', contentType: 'image/svg+xml', content: svg, url: targetUrl };
    } else {
      const buffer = await QRCode.toBuffer(targetUrl, { width: 512, margin: 1 });
      return { format: 'png', contentType: 'image/png', content: buffer, url: targetUrl };
    }
  },

  /**
   * Generates branded PDF specification sheet payload (Decision D-07)
   */
  async generatePdfSpecSheet(catalogId, organizationId, { baseUrl = 'https://hub.i3dion.com' } = {}) {
    const catalog = await this.getCatalog(catalogId, organizationId);
    if (!catalog) throw new Error('Catalog not found');

    const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/catalog/${catalog.slug}`, { width: 256, margin: 1 });
    const branding = catalog.branding || {};
    const primaryColor = branding.primaryColor || '#2563EB';

    // Structured printable HTML specification document representation
    const specSheetHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${catalog.name} — Technical Specification Catalog</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; margin: 40px; color: #0F172A; }
          .header { border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .company-name { font-size: 24px; font-weight: 800; color: ${primaryColor}; }
          .catalog-title { font-size: 20px; margin-top: 8px; font-weight: 600; }
          .qr-box { text-align: center; font-size: 11px; color: #64748B; }
          .qr-box img { width: 100px; height: 100px; display: block; margin: 0 auto 4px auto; }
          .product-card { border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin-top: 24px; page-break-inside: avoid; }
          .product-name { font-size: 18px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
          .product-meta { font-size: 13px; color: #64748B; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #E2E8F0; padding: 8px 12px; text-align: left; }
          th { background: #F8FAFC; color: #475569; }
          .footer { margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 12px; font-size: 11px; color: #94A3B8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${branding.companyName || 'I3DION Partner Dynamics'}</div>
            <div class="catalog-title">${catalog.name}</div>
            <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Published: ${catalog.published_at || new Date().toISOString()}</div>
          </div>
          <div class="qr-box">
            <img src="${qrDataUrl}" alt="Scan for 3D/AR" />
            Scan for 3D & AR
          </div>
        </div>

        <div style="margin-top: 20px; font-size: 14px; color: #334155;">
          ${catalog.description || 'Official equipment specification catalog.'}
        </div>

        ${catalog.products.map(p => `
          <div class="product-card">
            <div class="product-name">${p.productName}</div>
            <div class="product-meta">Category: ${p.category || 'Industrial Equipment'} | Pinned Model Version: v${p.pinnedVersionNumber}</div>
            <div>${p.description || ''}</div>
            <table>
              <thead>
                <tr><th>Specification</th><th>Engineered Value</th></tr>
              </thead>
              <tbody>
                ${Object.entries(p.specs || {}).map(([k, v]) => `
                  <tr><td><strong>${k}</strong></td><td>${v}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="footer">
          Generated by I3DION Omni Studio • Authoritative Pinned Snapshot • ${catalog.slug}
        </div>
      </body>
      </html>
    `;

    return {
      contentType: 'text/html; charset=utf-8',
      html: specSheetHtml,
      filename: `${catalog.slug}-specification-sheet.html`
    };
  }
};
