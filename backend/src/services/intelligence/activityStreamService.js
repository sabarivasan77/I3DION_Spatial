import { query } from '../../db/pool.js';

export class ActivityStreamService {
  /**
   * Transforms structured analytics events into readable activity stream items.
   */
  formatEventToActivityMessage(event) {
    const actorName = event.user_name || (event.visitor_id ? `Visitor ${event.visitor_id.slice(-6)}` : 'Anonymous Visitor');
    const productName = event.product_name || 'Spatial Product';
    const catalogName = event.catalog_name || 'Spatial Catalog';

    switch (event.event_type) {
      case 'product_view':
        return `${actorName} viewed product details for "${productName}"`;
      case 'model_rotation':
      case 'model_interaction':
        return `${actorName} interacted with 3D CAD geometry for "${productName}"`;
      case 'specification_view':
        return `${actorName} inspected technical specifications for "${productName}"`;
      case 'ar_launch':
      case 'ar_session':
        return `${actorName} launched WebXR 1:1 scale AR experience for "${productName}"`;
      case 'catalog_view':
      case 'catalog_opened':
        return `${actorName} opened catalog showcase "${catalogName}"`;
      case 'quote_request':
        return `HIGH INTENT: ${actorName} requested a commercial quote for "${productName}"`;
      case 'contact_sales':
        return `COMMERCIAL ACTION: ${actorName} requested sales contact for "${productName}"`;
      case 'brochure_download':
      case 'model_download':
        return `${actorName} downloaded technical documentation for "${productName}"`;
      case 'search_performed':
        return `${actorName} searched for "${event.metadata?.query || 'content'}"`;
      case 'lead_created':
        return `LEAD CONVERTED: New lead "${event.metadata?.name || actorName}" identified`;
      case 'user_login':
        return `${actorName} logged into Spatial Ecosystem`;
      default:
        return `${actorName} performed action "${event.event_type.replace(/_/g, ' ')}"`;
    }
  }

  /**
   * Retrieves tenant-isolated activity stream for an organization.
   */
  async getActivityStream({ organizationId, limit = 30 }) {
    if (!organizationId) {
      throw new Error('organizationId required for activity stream');
    }

    const { rows } = await query(
      `SELECT e.*, u.name as user_name, u.avatar_url as user_avatar, p.name as product_name, c.name as catalog_name
       FROM analytics_events e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN products p ON e.product_id = p.id
       LEFT JOIN catalogs c ON e.catalog_id = c.id
       WHERE e.organization_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      [organizationId, Math.min(limit, 100)]
    );

    return rows.map((e) => ({
      id: e.id,
      eventType: e.event_type,
      message: this.formatEventToActivityMessage(e),
      actorName: e.user_name || (e.visitor_id ? `Visitor ${e.visitor_id.slice(-6)}` : 'Anonymous Visitor'),
      actorAvatar: e.user_avatar || null,
      productId: e.product_id,
      productName: e.product_name,
      catalogId: e.catalog_id,
      timestamp: e.created_at,
      metadata: e.metadata,
    }));
  }
}

export const activityStreamService = new ActivityStreamService();
