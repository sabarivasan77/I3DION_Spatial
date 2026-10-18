import { pool } from '../../db/pool.js';
import QRCode from 'qrcode';
import { trackEvent } from '../trackingEngine.js';

export const experienceService = {
  /**
   * List experiences for an organization
   */
  async listExperiences(organizationId, { status, search } = {}) {
    let sql = `
      SELECT e.*,
        va.name as vault_asset_name,
        va.public_url as vault_public_url,
        va.storage_key as vault_storage_key
      FROM spatial_experiences e
      LEFT JOIN vault_assets va ON e.vault_asset_id = va.id
      WHERE e.organization_id = $1
    `;
    const params = [organizationId];

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND e.status = $${params.length}`;
    } else {
      sql += ` AND e.status != 'Archived'`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (e.name ILIKE $${params.length} OR e.description ILIKE $${params.length} OR e.slug ILIKE $${params.length})`;
    }

    sql += ` ORDER BY e.updated_at DESC`;

    const res = await pool.query(sql, params);
    return res.rows;
  },

  /**
   * Fetch single experience detail with resolved Vault asset
   */
  async getExperience(experienceId, organizationId) {
    const res = await pool.query(
      `SELECT e.*,
        va.name as vault_asset_name,
        va.public_url as vault_public_url,
        va.storage_key as vault_storage_key,
        va.mime_type as vault_mime_type,
        va.size_bytes as vault_size_bytes,
        (SELECT MAX(version_number)::int FROM vault_asset_versions WHERE asset_id = va.id) as latest_vault_version
       FROM spatial_experiences e
       LEFT JOIN vault_assets va ON e.vault_asset_id = va.id
       WHERE e.id = $1 AND e.organization_id = $2`,
      [experienceId, organizationId]
    );

    if (res.rows.length === 0) return null;
    const exp = res.rows[0];
    exp.isOutdated = (exp.latest_vault_version || 1) > (exp.pinned_version_number || 1);
    return exp;
  },

  /**
   * Create new spatial experience project
   */
  async createExperience(organizationId, userId, data) {
    const {
      name,
      slug,
      description,
      vault_asset_id,
      pinned_version_number = 1,
      scene_config,
      hotspots = [],
      animation_config,
      blueprint_config,
      ar_config
    } = data;

    if (!name) throw new Error('Experience name is required');
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Math.floor(Math.random() * 10000);

    const defaultScene = scene_config || {
      camera: { fov: 45, position: [0, 1.5, 3], target: [0, 0, 0] },
      environment: { preset: 'studio', exposure: 1.0, contactShadow: true, reflection: 0.2 },
      ground: { showGrid: true, shadowOpacity: 0.4 }
    };

    const defaultAnimation = animation_config || {
      activeClip: null,
      playbackSpeed: 1.0,
      explodedViewFactor: 0.0,
      parts: []
    };

    const defaultBlueprint = blueprint_config || {
      enabled: false,
      dimensions: { length: 1420, width: 850, height: 920, unit: 'mm' },
      callouts: []
    };

    const defaultAr = ar_config || {
      scale: 1.0,
      placement: 'floor',
      allowSnapshot: true,
      ctaText: 'Request Quote'
    };

    const res = await pool.query(
      `INSERT INTO spatial_experiences (
        organization_id, name, slug, description, status, vault_asset_id, pinned_version_number,
        scene_config, hotspots, animation_config, blueprint_config, ar_config, created_by
      ) VALUES ($1, $2, $3, $4, 'Draft', $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        organizationId,
        name,
        cleanSlug,
        description || '',
        vault_asset_id || null,
        pinned_version_number,
        JSON.stringify(defaultScene),
        JSON.stringify(hotspots),
        JSON.stringify(defaultAnimation),
        JSON.stringify(defaultBlueprint),
        JSON.stringify(defaultAr),
        userId
      ]
    );

    return res.rows[0];
  },

  /**
   * Update experience properties
   */
  async updateExperience(experienceId, organizationId, updates) {
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
    if (updates.status !== undefined) {
      fields.push(`status = $${count++}`);
      values.push(updates.status);
    }
    if (updates.vault_asset_id !== undefined) {
      fields.push(`vault_asset_id = $${count++}`);
      values.push(updates.vault_asset_id);
    }
    if (updates.pinned_version_number !== undefined) {
      fields.push(`pinned_version_number = $${count++}`);
      values.push(updates.pinned_version_number);
    }
    if (updates.scene_config !== undefined) {
      fields.push(`scene_config = $${count++}`);
      values.push(JSON.stringify(updates.scene_config));
    }
    if (updates.hotspots !== undefined) {
      fields.push(`hotspots = $${count++}`);
      values.push(JSON.stringify(updates.hotspots));
    }
    if (updates.animation_config !== undefined) {
      fields.push(`animation_config = $${count++}`);
      values.push(JSON.stringify(updates.animation_config));
    }
    if (updates.blueprint_config !== undefined) {
      fields.push(`blueprint_config = $${count++}`);
      values.push(JSON.stringify(updates.blueprint_config));
    }
    if (updates.ar_config !== undefined) {
      fields.push(`ar_config = $${count++}`);
      values.push(JSON.stringify(updates.ar_config));
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(experienceId, organizationId);

    const res = await pool.query(
      `UPDATE spatial_experiences SET ${fields.join(', ')} WHERE id = $${count++} AND organization_id = $${count++} RETURNING *`,
      values
    );

    return res.rows[0];
  },

  /**
   * Add or update spatial 3D hotspot pin
   */
  async addOrUpdateHotspot(experienceId, organizationId, hotspotData) {
    const exp = await this.getExperience(experienceId, organizationId);
    if (!exp) throw new Error('Experience not found');

    const hotspots = exp.hotspots || [];
    const index = hotspots.findIndex(h => h.id === hotspotData.id);

    const normalizedHotspot = {
      id: hotspotData.id || `hs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: hotspotData.title || 'Component Inspection Pin',
      description: hotspotData.description || '',
      position: hotspotData.position || { x: 0, y: 1.0, z: 0 },
      surfaceNormal: hotspotData.surfaceNormal || { x: 0, y: 1, z: 0 },
      badgeNumber: hotspotData.badgeNumber || hotspots.length + 1,
      metricUnits: hotspotData.metricUnits || {},
      ctaText: hotspotData.ctaText || 'Request Quote',
      ctaAction: hotspotData.ctaAction || 'quote_request',
      ctaTarget: hotspotData.ctaTarget || null
    };

    if (index >= 0) {
      hotspots[index] = { ...hotspots[index], ...normalizedHotspot };
    } else {
      hotspots.push(normalizedHotspot);
    }

    await pool.query(
      `UPDATE spatial_experiences SET hotspots = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
      [JSON.stringify(hotspots), experienceId, organizationId]
    );

    return normalizedHotspot;
  },

  /**
   * Remove a spatial 3D hotspot pin
   */
  async removeHotspot(experienceId, organizationId, hotspotId) {
    const exp = await this.getExperience(experienceId, organizationId);
    if (!exp) throw new Error('Experience not found');

    const updatedHotspots = (exp.hotspots || []).filter(h => h.id !== hotspotId);
    await pool.query(
      `UPDATE spatial_experiences SET hotspots = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
      [JSON.stringify(updatedHotspots), experienceId, organizationId]
    );

    return { success: true, removedId: hotspotId, remainingCount: updatedHotspots.length };
  },

  /**
   * Resolve AR device capability matrix (Section 9 Phase 6)
   */
  async resolveArLaunch(experienceId, organizationId, userAgent = '') {
    const exp = await this.getExperience(experienceId, organizationId);
    if (!exp) throw new Error('Experience not found');

    const ua = (userAgent || '').toLowerCase();
    const modelUrl = exp.vault_public_url || '/models/industrial_pump.glb';
    const arConfig = exp.ar_config || {};

    let launchTier = 'orbit_qr_fallback';
    let launchUrl = null;
    let instructions = 'Use mouse or touch to rotate, pan, and zoom the interactive 3D model.';

    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      launchTier = 'quick_look';
      launchUrl = arConfig.usdzStorageKey || modelUrl.replace(/\.glb$/, '.usdz');
      instructions = 'Tap to place the 1:1 scale model in your space using iOS AR Quick Look.';
    } else if (ua.includes('android')) {
      if (ua.includes('chrome')) {
        launchTier = 'webxr';
        launchUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_only&resizable=false#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
        instructions = 'Tap to view 1:1 scale engineering digital twin in Augmented Reality.';
      } else {
        launchTier = 'scene_viewer';
        launchUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
        instructions = 'Launching Google Scene Viewer AR.';
      }
    }

    const qrDataUrl = await QRCode.toDataURL(`https://hub.i3dion.com/experience/${exp.slug}`, { width: 512, margin: 1 });

    return {
      experienceId: exp.id,
      slug: exp.slug,
      name: exp.name,
      scale: arConfig.scale || 1.0,
      placement: arConfig.placement || 'floor',
      resolvedTier: launchTier,
      launchUrl,
      instructions,
      modelUrl,
      qrDataUrl,
      supportSnapshot: Boolean(arConfig.allowSnapshot)
    };
  },

  /**
   * Universal Publishing Ceremony: Freezes an immutable snapshot
   */
  async publishExperience(experienceId, organizationId, userId, { baseUrl = 'https://hub.i3dion.com' } = {}) {
    const exp = await this.getExperience(experienceId, organizationId);
    if (!exp) throw new Error('Experience not found');

    const immutableSnapshot = {
      snapshotVersion: '1.0',
      publishedAt: new Date().toISOString(),
      publisherUserId: userId,
      experience: {
        id: exp.id,
        name: exp.name,
        slug: exp.slug,
        description: exp.description,
        vaultAssetId: exp.vault_asset_id,
        pinnedVersionNumber: exp.pinned_version_number,
        modelUrl: exp.vault_public_url || '/models/industrial_pump.glb'
      },
      sceneConfig: exp.scene_config,
      hotspots: exp.hotspots,
      animationConfig: exp.animation_config,
      blueprintConfig: exp.blueprint_config,
      arConfig: exp.ar_config,
      sceneDocument: exp.scene_document || null,
      circuitsGraph: exp.circuits_graph || null,
      circuitsIR: exp.circuits_ir || null
    };

    const targetUrl = `${baseUrl}/experience/${exp.slug}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 1024, margin: 1 });

    const res = await pool.query(
      `UPDATE spatial_experiences
       SET status = 'Published',
           published_at = NOW(),
           published_snapshot = $1,
           updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [JSON.stringify(immutableSnapshot), experienceId, organizationId]
    );

    // Track event in Lens
    await trackEvent({
      organizationId,
      eventType: 'experience.published',
      sourceProduct: 'spatial_engine',
      entityId: experienceId,
      entityType: 'experience',
      metadata: {
        slug: exp.slug,
        hotspotCount: (exp.hotspots || []).length
      }
    }).catch(() => {});

    return {
      ...res.rows[0],
      qrDataUrl,
      publicUrl: targetUrl
    };
  },

  /**
   * Generates QR Code for experience
   */
  async generateQr(experienceId, organizationId, { format = 'svg', baseUrl = 'https://hub.i3dion.com' } = {}) {
    const res = await pool.query(
      `SELECT slug FROM spatial_experiences WHERE id = $1 AND organization_id = $2`,
      [experienceId, organizationId]
    );
    if (res.rows.length === 0) throw new Error('Experience not found');
    const slug = res.rows[0].slug;
    const targetUrl = `${baseUrl}/experience/${slug}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(targetUrl, { type: 'svg', width: 512, margin: 1 });
      return { format: 'svg', contentType: 'image/svg+xml', content: svg, url: targetUrl };
    } else {
      const buffer = await QRCode.toBuffer(targetUrl, { width: 512, margin: 1 });
      return { format: 'png', contentType: 'image/png', content: buffer, url: targetUrl };
    }
  },

  /**
   * Fetch public published experience by slug
   */
  async getPublishedBySlug(slug) {
    const res = await pool.query(
      `SELECT * FROM spatial_experiences WHERE slug = $1 AND status = 'Published'`,
      [slug]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0].published_snapshot;
  }
};
