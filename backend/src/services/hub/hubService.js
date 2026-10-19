import { query } from '../../db/pool.js';
import { ApiError } from '../../utils/errors.js';
import { executeFlowRules } from '../flow/flowEngine.js';
import { trackEvent } from '../trackingEngine.js';

/**
 * Spatial Hub Service - Public Discovery & Delivery Layer
 */
export async function getOrganizationShowcase(identifier) {
  // Check whether identifier is UUID or text slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  let orgResult;
  if (isUuid) {
    orgResult = await query(
      `SELECT id, name, slug, profile, logo_url, website, primary_color, is_verified, created_at 
       FROM organizations WHERE id = $1`,
      [identifier]
    );
  } else {
    orgResult = await query(
      `SELECT id, name, slug, profile, logo_url, website, primary_color, is_verified, created_at 
       FROM organizations WHERE slug = $1 OR LOWER(name) = LOWER($1)`,
      [identifier]
    );
  }

  if (orgResult.rows.length === 0) {
    throw new ApiError(404, 'Organization not found or not published on Spatial Hub');
  }

  const org = orgResult.rows[0];

  // Fetch published catalogs for this org
  const { rows: catalogs } = await query(
    `SELECT id, name, slug, description, layout_config, branding, published_snapshot, published_at, updated_at
     FROM catalogs
     WHERE organization_id = $1 AND status = 'Published'
     ORDER BY published_at DESC NULLS LAST, created_at DESC`,
    [org.id]
  );

  // Fetch published spatial experiences for this org
  const { rows: experiences } = await query(
    `SELECT id, name, slug, description, scene_config, hotspots, animation_config, blueprint_config, ar_config, published_snapshot, published_at, updated_at
     FROM spatial_experiences
     WHERE organization_id = $1 AND status = 'Published'
     ORDER BY published_at DESC NULLS LAST, created_at DESC`,
    [org.id]
  );

  // Fetch curated collections for this org
  const { rows: collections } = await query(
    `SELECT id, name, description, created_at
     FROM vault_collections
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
    [org.id]
  );

  // Fetch public showcase products
  const { rows: products } = await query(
    `SELECT id, name, slug, category, description, specs, image_url, model_url, preview_model_url, poster_url,
            views_count, likes_count, license_spdx, license_artist, attribution_required, is_demo_model, updated_at
     FROM products
     WHERE organization_id = $1 AND is_public = true AND status = 'Published'
     ORDER BY views_count DESC, created_at DESC
     LIMIT 24`,
    [org.id]
  );

  return {
    organization: org,
    catalogs,
    experiences,
    collections,
    products,
    meta: {
      totalCatalogs: catalogs.length,
      totalExperiences: experiences.length,
      totalCollections: collections.length,
      totalProducts: products.length,
    }
  };
}

export async function getPublishedCatalog(slug) {
  const { rows } = await query(
    `SELECT c.*, o.name as org_name, o.logo_url as org_logo, o.primary_color as org_color
     FROM catalogs c
     JOIN organizations o ON c.organization_id = o.id
     WHERE c.slug = $1 AND c.status = 'Published'`,
    [slug]
  );

  if (rows.length === 0) {
    throw new ApiError(404, 'Published catalog not found or unpublished');
  }

  const catalog = rows[0];

  // Use immutable snapshot if present, otherwise build fallback from pinned relations
  let displaySnapshot = catalog.published_snapshot;
  if (!displaySnapshot) {
    const { rows: products } = await query(
      `SELECT p.id, p.name, p.category, p.description, p.specs, p.image_url, p.model_url,
              cp.pinned_version_number, cp.custom_spec_overrides
       FROM catalog_products cp
       JOIN products p ON cp.product_id = p.id
       WHERE cp.catalog_id = $1
       ORDER BY cp.sort_order ASC`,
      [catalog.id]
    );
    displaySnapshot = {
      catalogId: catalog.id,
      name: catalog.name,
      description: catalog.description,
      branding: catalog.branding,
      layout: catalog.layout_config,
      products
    };
  }

  return {
    id: catalog.id,
    organizationId: catalog.organization_id,
    name: catalog.name,
    slug: catalog.slug,
    description: catalog.description,
    branding: catalog.branding,
    layoutConfig: catalog.layout_config,
    publishedSnapshot: displaySnapshot,
    pdfUrl: catalog.pdf_url,
    publishedAt: catalog.published_at,
    organization: {
      name: catalog.org_name,
      logoUrl: catalog.org_logo,
      primaryColor: catalog.org_color,
    }
  };
}

export async function getPublishedExperience(slug) {
  const { rows } = await query(
    `SELECT e.*, o.name as org_name, o.logo_url as org_logo, o.primary_color as org_color
     FROM spatial_experiences e
     JOIN organizations o ON e.organization_id = o.id
     WHERE e.slug = $1 AND e.status = 'Published'`,
    [slug]
  );

  if (rows.length === 0) {
    throw new ApiError(404, 'Published 3D/AR experience not found or unpublished');
  }

  const exp = rows[0];

  return {
    id: exp.id,
    organizationId: exp.organization_id,
    name: exp.name,
    slug: exp.slug,
    description: exp.description,
    vaultAssetId: exp.vault_asset_id,
    pinnedVersionNumber: exp.pinned_version_number,
    sceneConfig: exp.scene_config,
    hotspots: exp.hotspots,
    animationConfig: exp.animation_config,
    blueprintConfig: exp.blueprint_config,
    arConfig: exp.arConfig || exp.ar_config,
    publishedSnapshot: exp.published_snapshot,
    publishedAt: exp.published_at,
    organization: {
      name: exp.org_name,
      logoUrl: exp.org_logo,
      primaryColor: exp.org_color,
    }
  };
}

export async function capturePublicLead(data, clientIp = '127.0.0.1') {
  const {
    name,
    email,
    phone,
    company,
    intent = 'quote',
    message,
    source = 'Spatial Hub',
    qrAttributed = false,
    slug,
    catalogId,
    productId,
    experienceId,
    visitorId,
    consent = {},
    hp_token, // Honeypot anti-spam trap
    website_trap // Honeypot anti-spam trap
  } = data;

  // 1. Honeypot Anti-Spam Check: bots automatically fill hidden fields
  const isSpam = Boolean(hp_token || website_trap);
  if (isSpam) {
    console.warn(`[Anti-Spam] Bot detected and trapped from IP: ${clientIp}, email: ${email}`);
    // Silently return pseudo-success so bot scrapers do not adapt, but do NOT pollute CRM or fire notifications
    return {
      success: true,
      leadId: 'spam-filtered',
      status: 'filtered',
      message: 'Thank you! Your request has been received.'
    };
  }

  // 2. Validate mandatory consent
  if (!consent.consentGiven) {
    throw new ApiError(400, 'Explicit consent is required to submit inquiry and contact details');
  }

  // 3. Resolve Organization ID
  let organizationId = data.organizationId;
  let resolvedProductName = data.productName || 'Spatial Experience';

  if (!organizationId && slug) {
    // Try finding via catalog
    const catRes = await query('SELECT organization_id, name FROM catalogs WHERE slug = $1', [slug]);
    if (catRes.rows.length > 0) {
      organizationId = catRes.rows[0].organization_id;
      resolvedProductName = catRes.rows[0].name;
    } else {
      // Try finding via spatial experience
      const expRes = await query('SELECT organization_id, name FROM spatial_experiences WHERE slug = $1', [slug]);
      if (expRes.rows.length > 0) {
        organizationId = expRes.rows[0].organization_id;
        resolvedProductName = expRes.rows[0].name;
      } else {
        // Try finding via product
        const prodRes = await query('SELECT organization_id, name FROM products WHERE slug = $1', [slug]);
        if (prodRes.rows.length > 0) {
          organizationId = prodRes.rows[0].organization_id;
          resolvedProductName = prodRes.rows[0].name;
        }
      }
    }
  }

  if (!organizationId && catalogId) {
    const r = await query('SELECT organization_id, name FROM catalogs WHERE id = $1', [catalogId]);
    if (r.rows.length > 0) {
      organizationId = r.rows[0].organization_id;
      resolvedProductName = r.rows[0].name;
    }
  }

  if (!organizationId && productId) {
    const r = await query('SELECT organization_id, name FROM products WHERE id = $1', [productId]);
    if (r.rows.length > 0) {
      organizationId = r.rows[0].organization_id;
      resolvedProductName = r.rows[0].name;
    }
  }

  if (!organizationId && experienceId) {
    const r = await query('SELECT organization_id, name FROM spatial_experiences WHERE id = $1', [experienceId]);
    if (r.rows.length > 0) {
      organizationId = r.rows[0].organization_id;
      resolvedProductName = r.rows[0].name;
    }
  }

  if (!organizationId) {
    throw new ApiError(400, 'Unable to associate lead with an organization. Provide slug, catalogId, or organizationId.');
  }

  // Anonymize IP (subnet mask for privacy compliance: e.g. 192.168.1.xxx)
  const anonymizedIp = clientIp.includes(':') 
    ? clientIp.split(':').slice(0, 3).join(':') + '::xxxx'
    : clientIp.split('.').slice(0, 3).join('.') + '.0';

  const consentRecord = {
    consentGiven: true,
    consentText: consent.consentText || 'I agree to be contacted regarding this industrial equipment inquiry.',
    consentTimestamp: consent.consentTimestamp || new Date().toISOString(),
    anonymizedIp
  };

  // 4. Upsert or Insert into Leads
  let leadId;
  const existingLead = await query(
    `SELECT id, name FROM leads WHERE email = $1 AND organization_id = $2 LIMIT 1`,
    [email, organizationId]
  );

  const finalSource = qrAttributed ? 'Spatial Hub (QR Code)' : source;

  if (existingLead.rows.length > 0) {
    leadId = existingLead.rows[0].id;
    await query(
      `UPDATE leads SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         company = COALESCE($3, company),
         organization = COALESCE($3, organization),
         qr_attributed = qr_attributed OR $4,
         consent_metadata = $5,
         notes = CASE WHEN $6::text IS NOT NULL THEN COALESCE(notes || E'\n', '') || $6 ELSE notes END,
         updated_at = now()
       WHERE id = $7`,
      [name, phone || null, company || null, qrAttributed, JSON.stringify(consentRecord), message ? `[${intent.toUpperCase()}] ${message}` : null, leadId]
    );
  } else {
    const insertRes = await query(
      `INSERT INTO leads (
         organization_id, product_id, catalog_id, experience_id, name, email, phone, company, organization,
         status, source, qr_attributed, consent_metadata, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, 'New', $9, $10, $11, $12)
       RETURNING id`,
      [
        organizationId,
        productId || null,
        catalogId || null,
        experienceId || null,
        name,
        email,
        phone || null,
        company || null,
        finalSource,
        qrAttributed,
        JSON.stringify(consentRecord),
        message ? `[${intent.toUpperCase()}] ${message}` : null
      ]
    );
    leadId = insertRes.rows[0].id;
  }

  // 5. Track Telemetry Event
  await trackEvent({
    organizationId,
    productId: productId || null,
    catalogId: catalogId || null,
    visitorId: visitorId || 'anonymous_hub_user',
    leadId,
    eventType: 'lead_form_submitted',
    metadata: {
      name,
      email,
      company,
      intent,
      qrAttributed,
      productName: resolvedProductName,
      slug
    }
  });

  // 6. Trigger I3DION Flow Platform Automation
  const flowResult = await executeFlowRules({
    organizationId,
    eventType: 'lead_form_submitted',
    payload: {
      leadId,
      name,
      email,
      company,
      intent,
      qrAttributed,
      productName: resolvedProductName
    }
  });

  return {
    success: true,
    leadId,
    status: 'captured',
    qrAttributed,
    flow: flowResult,
    message: 'Thank you! Your request has been sent to our sales engineering team.'
  };
}


/**
 * Submits an RFQ quote basket with idempotency, anti-bot check, and Flow lead outbox trigger
 */
export async function submitHubRfq(data, clientIp = '127.0.0.1') {
  const {
    name,
    email,
    phone = '',
    company = '',
    items = [],
    message = '',
    intent = 'quote',
    timeline = '1-3 months',
    targetDelivery = '',
    campaign = 'Direct Hub',
    shortCode = null,
    qrAttributed = false,
    idempotencyKey = null,
    consent = {},
    hp_token,
    website_trap
  } = data;

  // 1. Anti-spam honeypot detection
  if (hp_token || website_trap) {
    console.warn(`[Anti-Spam] Bot trapped in Hub RFQ from IP: ${clientIp}, email: ${email}`);
    return {
      success: true,
      leadId: 'spam-filtered',
      status: 'filtered',
      message: 'Thank you! Your quote request has been received.'
    };
  }

  // 2. Validate mandatory consent
  if (!consent || !consent.consentGiven) {
    throw new ApiError(400, 'Explicit consent is required to submit RFQ inquiry');
  }

  if (!items || items.length === 0) {
    throw new ApiError(400, 'Quote basket must contain at least one item');
  }

  // 3. Resolve Organization ID
  let organizationId = data.organizationId;
  let resolvedOrgName = 'I3DION Equipment';

  if (!organizationId) {
    for (const item of items) {
      if (item.productId) {
        const prodRes = await query(`SELECT organization_id FROM products WHERE id = $1`, [item.productId]);
        if (prodRes.rows.length > 0) {
          organizationId = prodRes.rows[0].organization_id;
          break;
        }
      }
    }
  }

  if (!organizationId) {
    const orgRes = await query(`SELECT id, name FROM organizations WHERE slug = 'i3dion' OR is_verified = true ORDER BY is_verified DESC LIMIT 1`);
    if (orgRes.rows.length > 0) {
      organizationId = orgRes.rows[0].id;
      resolvedOrgName = orgRes.rows[0].name;
    }
  }

  if (!organizationId) {
    throw new ApiError(400, 'Unable to identify target organization for RFQ');
  }

  // 4. Idempotency Key Deduplication
  if (idempotencyKey) {
    const existingRes = await query(
      `SELECT id, created_at FROM leads WHERE organization_id = $1 AND metadata->>'idempotencyKey' = $2 LIMIT 1`,
      [organizationId, idempotencyKey]
    );
    if (existingRes.rows.length > 0) {
      return {
        success: true,
        leadId: existingRes.rows[0].id,
        rfqId: existingRes.rows[0].id,
        isDuplicate: true,
        status: 'already_submitted',
        message: 'RFQ inquiry already received previously.'
      };
    }
  }

  // 5. IP Anonymization for GDPR/Privacy compliance
  const anonymizedIp = clientIp.includes(':') 
    ? clientIp.split(':').slice(0, 3).join(':') + '::xxxx'
    : clientIp.split('.').slice(0, 3).join('.') + '.0';

  const consentRecord = {
    consentGiven: true,
    consentText: consent.consentText || 'I agree to be contacted regarding this quotation and technical requirements.',
    consentTimestamp: consent.consentTimestamp || new Date().toISOString(),
    anonymizedIp
  };

  const leadMetadata = {
    items,
    idempotencyKey,
    campaign,
    shortCode,
    timeline,
    targetDelivery,
    source: 'Spatial Hub RFQ'
  };

  const formattedNotes = `[RFQ INQUIRY]\nItems (${items.length}):\n${items.map(it => `- ${it.name} (Qty: ${it.quantity || 1})${it.notes ? ' - Note: ' + it.notes : ''}`).join('\n')}\nTimeline: ${timeline}${targetDelivery ? `\nTarget Delivery: ${targetDelivery}` : ''}${message ? `\n\nClient Note:\n${message}` : ''}`;

  // 6. Insert into Leads
  const insertLeadSql = `
    INSERT INTO leads (
      organization_id, product_id, name, email, phone, company, organization,
      intent, source, qr_attributed, status, consent_metadata, metadata, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $6, 'quote', 'Spatial Hub RFQ', $7, 'New', $8, $9, $10)
    RETURNING id, name, email, created_at
  `;

  const primaryProductId = items[0]?.productId || null;

  const leadRes = await query(insertLeadSql, [
    organizationId,
    primaryProductId,
    name,
    email,
    phone || null,
    company || null,
    Boolean(qrAttributed || shortCode),
    JSON.stringify(consentRecord),
    JSON.stringify(leadMetadata),
    formattedNotes
  ]);

  const lead = leadRes.rows[0];

  // 7. Flow Event Outbox trigger ('rfq.submitted')
  try {
    const outboxSql = `
      INSERT INTO flow_event_outbox (
        organization_id, event_type, payload, status
      ) VALUES ($1, 'rfq.submitted', $2, 'pending')
    `;
    await query(outboxSql, [
      organizationId,
      JSON.stringify({
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone,
        company,
        itemsCount: items.length,
        items,
        campaign,
        qrAttributed: Boolean(qrAttributed || shortCode),
        timeline,
        timestamp: new Date().toISOString()
      })
    ]);
  } catch (err) {
    console.warn('Flow outbox insertion warning for rfq.submitted:', err);
  }

  // 8. Execute Flow Rules directly
  let flowResult = null;
  try {
    flowResult = await executeFlowRules({
      organizationId,
      eventType: 'rfq.submitted',
      payload: {
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone,
        company,
        itemsCount: items.length,
        items,
        campaign
      }
    });
  } catch (err) {
    console.warn('Direct flow execution warning:', err);
  }

  // 9. Telemetry
  try {
    await trackEvent({
      organizationId,
      visitorId: data.visitorId || 'anonymous_hub_user',
      leadId: lead.id,
      eventType: 'lead_form_submitted',
      metadata: {
        type: 'rfq',
        itemsCount: items.length,
        leadId: lead.id,
        campaign,
        qrAttributed: Boolean(qrAttributed || shortCode)
      }
    });
  } catch (err) {
    console.warn('Telemetry tracking warning:', err);
  }

  // 10. WhatsApp Deep-Link Builder
  const waSummary = items.map(i => `${i.name} (x${i.quantity || 1})`).join(', ');
  const waText = encodeURIComponent(`Hello, I submitted an RFQ on I3DION Spatial Hub for: ${waSummary}. My reference is [RFQ-${lead.id.slice(0, 8)}].`);
  const whatsappDeepLink = `https://wa.me/?text=${waText}`;

  return {
    success: true,
    leadId: lead.id,
    rfqId: lead.id,
    itemsCount: items.length,
    status: 'submitted',
    whatsappDeepLink,
    flow: flowResult,
    message: 'Your Request for Quotation has been received. Our sales engineering team will follow up within 24 hours.'
  };
}

/**
 * Submit Moderation Report (HUB-15)
 * Allows users and public visitors to report broken models, abusive content, copyright issues, or offensive material.
 */
export async function submitModerationReport(reportData, clientIp = '127.0.0.1', userId = null) {
  const { 
    entityType, 
    entityId, 
    reason, 
    details = '', 
    reporterEmail = null, 
    hp_token, 
    website_trap 
  } = reportData;

  // Anti-spam honeypot
  if (hp_token || website_trap) {
    console.warn(`[Anti-Spam] Bot trapped in moderation report from IP: ${clientIp}`);
    return {
      success: true,
      reportId: 'spam-filtered',
      status: 'filtered',
      message: 'Thank you for your report. Our trust & safety team will review it.'
    };
  }

  const { rows } = await query(
    `INSERT INTO moderation_reports (
      reporter_id, reporter_email, entity_type, entity_id, reason, details, ip_address, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
    RETURNING id, entity_type, entity_id, reason, status, created_at`,
    [userId || null, reporterEmail || null, entityType, entityId, reason, details, clientIp]
  );

  return {
    success: true,
    report: rows[0],
    message: 'Thank you for your report. Our trust & safety team has received your submission.'
  };
}

/**
 * Generate Dynamic Social Meta / OpenGraph Data (HUB-13)
 */
export async function generateSocialMeta(type, identifier) {
  const baseUrl = process.env.PUBLIC_HUB_URL || 'https://spatial.i3dion.com';
  const defaultImage = `${baseUrl}/og-spatial-hub.png`;

  if (type === 'product') {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let sql = `
      SELECT p.*, o.name as org_name, o.logo_url as org_logo, o.slug as org_slug
      FROM products p
      LEFT JOIN organizations o ON p.organization_id = o.id
      WHERE (p.id::text = $1 OR p.slug = $1) AND p.is_public = true AND p.status = 'Published'
    `;
    const { rows } = await query(sql, [identifier]);
    if (rows.length === 0) {
      throw new ApiError(404, `Product not found: ${identifier}`);
    }
    const product = rows[0];
    const title = `${product.name} | ${product.org_name || 'I3DION Spatial Hub'}`;
    const cleanDesc = (product.description || `Interactive 3D CAD visualization & industrial AR for ${product.name}`)
      .replace(/<[^>]*>?/gm, '')
      .slice(0, 180);
    const image = product.poster_url || product.image_url || defaultImage;
    const url = `${baseUrl}/hub/product/${product.id}`;

    return {
      type: 'product',
      title,
      description: cleanDesc,
      image,
      url,
      twitterCard: 'summary_large_image',
      canonicalUrl: url,
      schemaOrg: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: cleanDesc,
        image: [image],
        category: product.category,
        brand: {
          '@type': 'Brand',
          name: product.org_name || 'I3DION'
        },
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          price: '0',
          priceCurrency: 'USD',
          description: 'Request for Quotation available'
        }
      }
    };
  }

  if (type === 'organization' || type === 'org') {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let sql = isUuid 
      ? `SELECT id, name, slug, profile, logo_url, website FROM organizations WHERE id = $1`
      : `SELECT id, name, slug, profile, logo_url, website FROM organizations WHERE slug = $1 OR LOWER(name) = LOWER($1)`;
    const { rows } = await query(sql, [identifier]);
    if (rows.length === 0) {
      throw new ApiError(404, `Organization not found: ${identifier}`);
    }
    const org = rows[0];
    const title = `${org.name} - 3D Showroom & AR Catalog | I3DION Spatial Hub`;
    const cleanDesc = (org.profile || `Explore the interactive 3D digital showroom and spatial catalog of ${org.name} on I3DION Spatial Hub.`)
      .replace(/<[^>]*>?/gm, '')
      .slice(0, 180);
    const image = org.logo_url || defaultImage;
    const url = `${baseUrl}/hub/org/${org.slug || org.id}`;

    return {
      type: 'profile',
      title,
      description: cleanDesc,
      image,
      url,
      twitterCard: 'summary',
      canonicalUrl: url,
      schemaOrg: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: org.name,
        url: org.website || url,
        logo: image
      }
    };
  }

  if (type === 'catalog') {
    const { rows } = await query(
      `SELECT c.*, o.name as org_name, o.logo_url as org_logo 
       FROM catalogs c
       JOIN organizations o ON c.organization_id = o.id
       WHERE (c.id::text = $1 OR c.slug = $1) AND c.status = 'Published'`,
      [identifier]
    );
    if (rows.length === 0) {
      throw new ApiError(404, `Catalog not found: ${identifier}`);
    }
    const catalog = rows[0];
    const title = `${catalog.name} | ${catalog.org_name} Catalog`;
    const cleanDesc = (catalog.description || `Browse interactive 3D products in the ${catalog.name} catalog.`)
      .replace(/<[^>]*>?/gm, '')
      .slice(0, 180);
    const image = (catalog.branding && catalog.branding.cover_image) || catalog.org_logo || defaultImage;
    const url = `${baseUrl}/catalog/${catalog.slug}`;

    return {
      type: 'article',
      title,
      description: cleanDesc,
      image,
      url,
      twitterCard: 'summary_large_image',
      canonicalUrl: url,
      schemaOrg: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: catalog.name,
        description: cleanDesc,
        image: [image]
      }
    };
  }

  // Generic fallback
  return {
    type: 'website',
    title: 'I3DION Spatial Hub | Industrial 3D & AR Showroom',
    description: 'Explore industrial-grade 3D equipment models, CAD specifications, interactive WebXR, and verified commercial quotes.',
    image: defaultImage,
    url: baseUrl,
    twitterCard: 'summary_large_image',
    canonicalUrl: baseUrl,
    schemaOrg: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'I3DION Spatial Hub',
      url: baseUrl
    }
  };
}

/**
 * Generate Raw HTML Meta Tags & Crawler Template
 */
export function generateHtmlMetaTags(meta) {
  return `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <link rel="canonical" href="${escapeHtml(meta.canonicalUrl || meta.url)}" />
    <!-- OpenGraph -->
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${escapeHtml(meta.image)}" />
    <meta property="og:url" content="${escapeHtml(meta.url)}" />
    <meta property="og:type" content="${escapeHtml(meta.type || 'website')}" />
    <meta property="og:site_name" content="I3DION Spatial Hub" />
    <!-- Twitter Card -->
    <meta name="twitter:card" content="${escapeHtml(meta.twitterCard || 'summary_large_image')}" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(meta.image)}" />
    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
      ${JSON.stringify(meta.schemaOrg, null, 2)}
    </script>
  `.trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


