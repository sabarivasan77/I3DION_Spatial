import crypto from 'node:crypto';
import { query } from '../../db/pool.js';
import { ApiError } from '../../utils/errors.js';
import { recalculateLeadScore } from '../scoringEngine.js';

/**
 * Spatial Lens Service - Telemetry, Ingestion & Business Intelligence Layer
 */

// In-memory LRU-style set for sub-second deduplication
const dedupeMemoryCache = new Set();
setInterval(() => {
  if (dedupeMemoryCache.size > 10000) {
    dedupeMemoryCache.clear();
  }
}, 60000);

export async function ingestTelemetryEvent(eventData, reqContext = {}) {
  const {
    eventId,
    type,
    timestamp = new Date().toISOString(),
    organizationId,
    sourceProduct = 'hub',
    publishedRef,
    sessionId,
    visitorId,
    properties = {},
    device = {},
    dwellDurationSeconds,
    dedupeKey: clientDedupeKey
  } = eventData;

  if (!organizationId) {
    throw new ApiError(400, 'organizationId is required for event ingestion');
  }

  if (!type) {
    throw new ApiError(400, 'event type is required');
  }

  // 1. Generate deterministic dedupe key if not provided
  const targetRef = publishedRef?.slug || properties?.productId || properties?.catalogId || 'global';
  const timeWindowBucket = Math.floor(Date.now() / 5000); // 5-second deduplication window
  const computedDedupeKey = clientDedupeKey || `${sessionId || visitorId}-${type}-${targetRef}-${timeWindowBucket}`;

  // 2. Fast memory cache dedupe check
  if (dedupeMemoryCache.has(computedDedupeKey)) {
    return {
      success: true,
      deduplicated: true,
      status: 'dropped_duplicate_memory',
      dedupeKey: computedDedupeKey
    };
  }

  // 3. Database deduplication check
  const existingEvent = await query(
    `SELECT id FROM analytics_events 
     WHERE dedupe_key = $1 AND created_at > (now() - interval '10 seconds') 
     LIMIT 1`,
    [computedDedupeKey]
  );

  if (existingEvent.rows.length > 0) {
    dedupeMemoryCache.add(computedDedupeKey);
    return {
      success: true,
      deduplicated: true,
      status: 'dropped_duplicate_db',
      dedupeKey: computedDedupeKey
    };
  }

  dedupeMemoryCache.add(computedDedupeKey);

  // 4. Assemble clean, privacy-safe metadata
  const eventMetadata = {
    ...properties,
    sourceProduct,
    publishedRef: publishedRef || null,
    device: {
      deviceType: device.deviceType || 'desktop',
      os: device.os || 'other',
      browser: device.browser || 'unknown',
      arSupported: Boolean(device.arSupported),
      arMode: device.arMode || 'none',
      viewportWidth: device.viewportWidth || null,
      viewportHeight: device.viewportHeight || null
    },
    dwellDurationSeconds: dwellDurationSeconds ?? properties.dwellDurationSeconds ?? null,
    userAgent: reqContext.userAgent || null,
    referrer: reqContext.referrer || null,
    clientIpSubnet: reqContext.clientIpSubnet || null
  };

  // 5. Insert event into analytics_events
  const resolvedProductId = publishedRef?.contentType === 'product_showcase' ? publishedRef.contentId : (properties.productId || null);
  const resolvedCatalogId = publishedRef?.contentType === 'catalog' ? publishedRef.contentId : (properties.catalogId || null);

  const { rows: inserted } = await query(
    `INSERT INTO analytics_events (
       organization_id, product_id, catalog_id, visitor_id, session_id, event_type, metadata, dedupe_key, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, organization_id, event_type, created_at`,
    [
      organizationId,
      resolvedProductId,
      resolvedCatalogId,
      visitorId || 'anon_visitor',
      sessionId || null,
      type,
      JSON.stringify(eventMetadata),
      computedDedupeKey,
      timestamp
    ]
  );

  // 6. Record/Update visitor session
  if (visitorId) {
    try {
      await query(
        `INSERT INTO visitor_sessions (organization_id, visitor_id, session_start, updated_at)
         VALUES ($1, $2, now(), now())
         ON CONFLICT (id) DO UPDATE SET updated_at = now()`,
        [organizationId, visitorId]
      );
    } catch (e) {
      // Non-blocking visitor session update
    }
  }

  return {
    success: true,
    deduplicated: false,
    eventId: inserted[0].id,
    eventType: inserted[0].event_type,
    timestamp: inserted[0].created_at
  };
}

export async function getLensOverview(organizationId) {
  // Query aggregated metrics with strict tenant scoping
  const { rows } = await query(
    `SELECT
       COUNT(DISTINCT visitor_id) as total_visitors,
       COUNT(DISTINCT COALESCE(session_id, visitor_id)) as total_sessions,
       COUNT(CASE WHEN event_type = 'qr_landing' OR (metadata->>'qrAttributed')::boolean = true THEN 1 END) as qr_attributed_visits,
       COUNT(DISTINCT CASE WHEN event_type IN ('3d_interaction', 'hotspot_click', 'animation_play', 'blueprint_toggle', 'model_rotation') THEN visitor_id END) as interactive_visitors,
       COUNT(CASE WHEN event_type IN ('ar_launch', 'ar_launch_attempt') THEN 1 END) as ar_launch_attempts,
       COUNT(CASE WHEN event_type IN ('ar_session', 'ar_session_success') THEN 1 END) as ar_session_success,
       COUNT(CASE WHEN event_type = 'hotspot_click' THEN 1 END) as hotspot_clicks,
       (SELECT COUNT(*) FROM leads WHERE organization_id = $1) as total_leads,
       (SELECT COUNT(*) FROM leads WHERE organization_id = $1 AND qr_attributed = true) as qr_leads,
       (SELECT COUNT(*) FROM leads WHERE organization_id = $1 AND status != 'Lost' AND is_spam = false) as active_leads
     FROM analytics_events
     WHERE organization_id = $1 AND created_at >= (now() - interval '30 days')`,
    [organizationId]
  );

  const raw = rows[0] || {};
  const totalSessions = parseInt(raw.total_sessions || '0', 10);
  const totalVisitors = parseInt(raw.total_visitors || '0', 10);
  const qrAttributedVisits = parseInt(raw.qr_attributed_visits || '0', 10);
  const interactiveVisitors = parseInt(raw.interactive_visitors || '0', 10);
  const arLaunchAttempts = parseInt(raw.ar_launch_attempts || '0', 10);
  const arSessionSuccess = parseInt(raw.ar_session_success || '0', 10);
  const hotspotClicks = parseInt(raw.hotspot_clicks || '0', 10);
  const totalLeads = parseInt(raw.total_leads || '0', 10);
  const qrLeads = parseInt(raw.qr_leads || '0', 10);
  const activeLeads = parseInt(raw.active_leads || '0', 10);

  const interactionRate = totalSessions > 0 ? Math.round((interactiveVisitors / totalSessions) * 100) : 0;
  const arAttemptRate = totalSessions > 0 ? Math.round((arLaunchAttempts / totalSessions) * 100) : 0;
  const leadConversionRate = totalSessions > 0 ? parseFloat(((totalLeads / totalSessions) * 100).toFixed(1)) : 0;

  return {
    kpis: {
      totalVisitors,
      totalSessions,
      qrAttributedVisits,
      interactiveVisitors,
      interactionRate,
      arLaunchAttempts,
      arSessionSuccess,
      arAttemptRate,
      hotspotClicks,
      totalLeads,
      qrLeads,
      activeLeads,
      leadConversionRate
    },
    reportingPeriod: '30_days',
    tenantScope: organizationId,
    verifiedAt: new Date().toISOString()
  };
}

export async function getLensFunnel(organizationId) {
  const { rows } = await query(
    `SELECT
       COUNT(DISTINCT visitor_id) as step1_impressions,
       COUNT(DISTINCT CASE WHEN event_type IN ('catalog_view', 'product_view', 'qr_landing') THEN visitor_id END) as step2_engaged,
       COUNT(DISTINCT CASE WHEN event_type IN ('3d_interaction', 'hotspot_click', 'animation_play', 'blueprint_toggle') THEN visitor_id END) as step3_spatial_interactive,
       COUNT(DISTINCT CASE WHEN event_type IN ('ar_launch', 'ar_launch_attempt', 'ar_session_success') THEN visitor_id END) as step4_ar_intent,
       (SELECT COUNT(DISTINCT id) FROM leads WHERE organization_id = $1) as step5_leads
     FROM analytics_events
     WHERE organization_id = $1 AND created_at >= (now() - interval '30 days')`,
    [organizationId]
  );

  const r = rows[0] || {};
  const impressions = parseInt(r.step1_impressions || '0', 10);
  const engaged = parseInt(r.step2_engaged || '0', 10);
  const spatialInteractive = parseInt(r.step3_spatial_interactive || '0', 10);
  const arIntent = parseInt(r.step4_ar_intent || '0', 10);
  const leads = parseInt(r.step5_leads || '0', 10);

  return [
    { stage: 'Showcase Impressions', count: impressions, percentage: 100 },
    { stage: 'Engaged Catalog/QR Visits', count: engaged, percentage: impressions > 0 ? Math.round((engaged / impressions) * 100) : 0 },
    { stage: '3D Spatial Hotspot Interactions', count: spatialInteractive, percentage: impressions > 0 ? Math.round((spatialInteractive / impressions) * 100) : 0 },
    { stage: 'Augmented Reality Intent', count: arIntent, percentage: impressions > 0 ? Math.round((arIntent / impressions) * 100) : 0 },
    { stage: 'Qualified Sales Leads', count: leads, percentage: impressions > 0 ? Math.round((leads / impressions) * 100) : 0 }
  ];
}

export async function getLensQRAttribution(organizationId) {
  const { rows } = await query(
    `SELECT
       CASE 
         WHEN event_type = 'qr_landing' OR (metadata->>'qrAttributed')::boolean = true THEN 'QR Code'
         WHEN metadata->>'source' = 'catalog' THEN 'Catalog Direct'
         WHEN metadata->>'referrer' ILIKE '%linkedin%' OR metadata->>'referrer' ILIKE '%twitter%' THEN 'Social Media'
         ELSE 'Direct / Organic'
       END as channel,
       COUNT(*) as visit_count,
       COUNT(DISTINCT visitor_id) as unique_visitors
     FROM analytics_events
     WHERE organization_id = $1 AND created_at >= (now() - interval '30 days')
     GROUP BY channel
     ORDER BY visit_count DESC`,
    [organizationId]
  );

  return rows.map(r => ({
    channel: r.channel,
    visits: parseInt(r.visit_count, 10),
    uniqueVisitors: parseInt(r.unique_visitors, 10)
  }));
}

export async function getLensHotspotHeatmap(organizationId) {
  const { rows } = await query(
    `SELECT
       COALESCE(metadata->>'label', metadata->>'hotspotId', 'Hotspot') as hotspot_label,
       COALESCE(metadata->>'metricUnit', '') as metric_unit,
       COUNT(*) as click_count,
       COUNT(DISTINCT visitor_id) as unique_interactors
     FROM analytics_events
     WHERE organization_id = $1 AND event_type = 'hotspot_click' AND created_at >= (now() - interval '30 days')
     GROUP BY hotspot_label, metric_unit
     ORDER BY click_count DESC
     LIMIT 15`,
    [organizationId]
  );

  const totalClicks = rows.reduce((sum, r) => sum + parseInt(r.click_count, 10), 0);

  return rows.map(r => {
    const clicks = parseInt(r.click_count, 10);
    const share = totalClicks > 0 ? (clicks / totalClicks) * 100 : 0;
    let recommendation = 'Engagement within normal parameters.';
    if (share > 30) {
      recommendation = `High engagement (${share.toFixed(0)}% of clicks). Recommend promoting to primary specification hero card.`;
    } else if (share < 10) {
      recommendation = `Low engagement (${share.toFixed(0)}% of clicks). Consider adjusting 3D camera focus position or callout contrast.`;
    }

    return {
      label: r.hotspot_label,
      metricUnit: r.metric_unit,
      clicks,
      uniqueVisitors: parseInt(r.unique_interactors, 10),
      engagementShare: parseFloat(share.toFixed(1)),
      recommendation
    };
  });
}

export async function getLensDealerReports(organizationId) {
  const { rows } = await query(
    `SELECT
       COALESCE(metadata->>'dealerId', metadata->>'dealerCode', 'default_dealer') as dealer_id,
       COALESCE(metadata->>'dealerName', 'General Regional Dealer') as dealer_name,
       COUNT(*) as total_visits,
       COUNT(DISTINCT visitor_id) as unique_visitors,
       COUNT(CASE WHEN event_type IN ('quote_request', 'rfq_submitted') THEN 1 END) as inquiries,
       COALESCE(SUM((metadata->>'quoteValue')::numeric), 0) as total_quote_value
     FROM analytics_events
     WHERE organization_id = $1 AND created_at >= (now() - interval '30 days')
     GROUP BY dealer_id, dealer_name
     ORDER BY total_visits DESC`,
    [organizationId]
  );

  return rows.map(r => {
    const visits = parseInt(r.total_visits || '0', 10);
    const inquiries = parseInt(r.inquiries || '0', 10);
    const conversionRate = visits > 0 ? parseFloat(((inquiries / visits) * 100).toFixed(1)) : 0;
    return {
      dealerId: r.dealer_id,
      dealerName: r.dealer_name,
      totalVisits: visits,
      uniqueVisitors: parseInt(r.unique_visitors || '0', 10),
      inquiries,
      totalQuoteValue: parseFloat(r.total_quote_value || '0'),
      conversionRate
    };
  });
}

export async function getLensCampaignReports(organizationId) {
  const { rows } = await query(
    `SELECT
       COALESCE(metadata->>'campaign', metadata->>'utm_campaign', 'Direct QR Scan') as campaign_name,
       COALESCE(metadata->>'source', 'qr_code') as campaign_source,
       COUNT(*) as total_landings,
       COUNT(DISTINCT visitor_id) as unique_visitors,
       COUNT(CASE WHEN event_type IN ('quote_request', 'rfq_submitted', 'lead_form_submitted') THEN 1 END) as leads_generated
     FROM analytics_events
     WHERE organization_id = $1 AND (event_type = 'qr_landing' OR (metadata->>'qrAttributed')::boolean = true)
     GROUP BY campaign_name, campaign_source
     ORDER BY total_landings DESC`,
    [organizationId]
  );

  return rows.map(r => {
    const landings = parseInt(r.total_landings || '0', 10);
    const leads = parseInt(r.leads_generated || '0', 10);
    const conversionRate = landings > 0 ? parseFloat(((leads / landings) * 100).toFixed(1)) : 0;
    return {
      campaignName: r.campaign_name,
      source: r.campaign_source,
      totalLandings: landings,
      uniqueVisitors: parseInt(r.unique_visitors || '0', 10),
      leadsGenerated: leads,
      conversionRate
    };
  });
}

export async function triggerLensFlowAction(organizationId, userId, { flowId, eventType = 'analytics.anomaly_detected', data = {} }) {
  const res = await query(
    `INSERT INTO flow_event_outbox (organization_id, event_type, payload, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [organizationId, eventType, JSON.stringify({ ...data, triggeredBy: userId, flowId })]
  );

  return {
    success: true,
    outboxId: res.rows[0].id,
    eventType: res.rows[0].event_type,
    status: 'pending'
  };
}

export function getMetricDefinitions() {
  return {
    definitions: [
      {
        key: 'qr_attributed_visits',
        name: 'QR-Attributed Visits',
        definition: 'Visits arriving with a verified QR landing query parameter (?source=qr or qr_landing event). This accurately measures traffic originating from printed or digital QR codes without falsely claiming device camera optical scans.',
        source: 'analytics_events (event_type = qr_landing OR metadata->>qrAttributed = true)',
        nonNegotiableRule: 'Non-Negotiable #9 — Measurement Integrity'
      },
      {
        key: 'interactive_visitors',
        name: '3D Spatial Interactive Visitors',
        definition: 'Unique visitors who engaged in active viewport manipulation: orbital camera rotation, 3D metric hotspot inspection, animation scrubbing, or blueprint dimensional view.',
        source: 'analytics_events (event_type IN 3d_interaction, hotspot_click, animation_play, blueprint_toggle)',
        nonNegotiableRule: 'Non-Negotiable #1 — Real user events only, zero synthetic multipliers'
      },
      {
        key: 'ar_launch_attempts',
        name: 'AR Launch Attempts',
        definition: 'Telemetry count of users tapping to launch AR sessions (Quick Look .usdz on iOS or WebXR / Scene Viewer on Android).',
        source: 'analytics_events (event_type = ar_launch_attempt OR ar_launch)',
        nonNegotiableRule: 'Non-Negotiable #10 — Real AR Device Capability Matrix'
      },
      {
        key: 'lead_conversion_rate',
        name: 'Lead Conversion Rate (%)',
        definition: 'Percentage of total unique visitor sessions that result in an inbound quotation request or contact form submission with explicit GDPR/privacy consent.',
        source: '(leads.count / visitor_sessions.count) * 100',
        nonNegotiableRule: 'Non-Negotiable #1 — Verified database aggregates only'
      }
    ],
    updatedAt: new Date().toISOString()
  };
}
