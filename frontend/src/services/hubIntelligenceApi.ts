import { api } from './api';

export interface IntelligenceEventPayload {
  organizationId?: string;
  userId?: string;
  sessionId?: string;
  projectId?: string;
  applicationId?: string;
  entityType?: 'product' | 'catalog' | 'experience' | 'ar' | 'lead' | 'organization' | string;
  entityId?: string;
  productId?: string;
  catalogId?: string;
  leadId?: string;
  visitorId?: string;
  eventType: string;
  metadata?: Record<string, any>;
  source?: string;
}

export interface RecommendationItem {
  recommendationId: string;
  entityType: string;
  entityId: string;
  name: string;
  category: string;
  imageUrl?: string;
  modelUrl?: string;
  companyName?: string;
  score: number;
  reasons: string[];
}

export interface NextBestAction {
  actionType: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ActivityStreamItem {
  id: string;
  eventType: string;
  message: string;
  actorName: string;
  actorAvatar?: string;
  productId?: string;
  productName?: string;
  catalogId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class HubIntelligenceApi {
  private getSessionId(): string {
    let sid = sessionStorage.getItem('i3dion_session_id');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('i3dion_session_id', sid);
    }
    return sid;
  }

  private getVisitorId(): string {
    let vid = localStorage.getItem('i3dion_visitor_id');
    if (!vid) {
      vid = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('i3dion_visitor_id', vid);
    }
    return vid;
  }

  /**
   * Track structured interaction event
   */
  async trackEvent(payload: IntelligenceEventPayload): Promise<void> {
    try {
      const fullPayload: IntelligenceEventPayload = {
        sessionId: this.getSessionId(),
        visitorId: this.getVisitorId(),
        applicationId: 'hub',
        source: 'web_hub',
        ...payload,
      };
      await (api as any).request('/intelligence/events', {
        method: 'POST',
        body: JSON.stringify(fullPayload),
      });
    } catch (err) {
      console.warn('[HubIntelligenceApi] Failed tracking event:', err);
    }
  }

  /**
   * Get personalized feed items for Hub Explore
   */
  async getPersonalizedFeed(organizationId?: string, limit = 20): Promise<{ items: any[]; totalCount: number }> {
    try {
      const query = new URLSearchParams();
      if (organizationId) query.append('organizationId', organizationId);
      query.append('visitorId', this.getVisitorId());
      query.append('limit', String(limit));

      const res = await (api as any).request(`/intelligence/feed/personalized?${query.toString()}`);
      return res || { items: [], totalCount: 0 };
    } catch (err) {
      console.warn('[HubIntelligenceApi] Failed fetching personalized feed:', err);
      return { items: [], totalCount: 0 };
    }
  }

  /**
   * Get explainable recommendations
   */
  async getRecommendedProducts(currentProductId?: string, organizationId?: string): Promise<RecommendationItem[]> {
    try {
      const query = new URLSearchParams();
      if (organizationId) query.append('organizationId', organizationId);
      if (currentProductId) query.append('currentProductId', currentProductId);
      query.append('visitorId', this.getVisitorId());

      const res = await (api as any).request(`/intelligence/recommendations/products?${query.toString()}`);
      return res || [];
    } catch (err) {
      console.warn('[HubIntelligenceApi] Failed fetching product recommendations:', err);
      return [];
    }
  }

  /**
   * Get Next Best Action guidance
   */
  async getNextBestAction(currentProductId?: string, organizationId?: string): Promise<NextBestAction | null> {
    try {
      const query = new URLSearchParams();
      if (organizationId) query.append('organizationId', organizationId);
      if (currentProductId) query.append('currentProductId', currentProductId);
      query.append('visitorId', this.getVisitorId());

      const res = await (api as any).request(`/intelligence/recommendations/next-best-action?${query.toString()}`);
      return res || null;
    } catch (err) {
      console.warn('[HubIntelligenceApi] Failed fetching next best action:', err);
      return null;
    }
  }

  /**
   * Get Activity Stream for Hub Feed
   */
  async getActivityStream(organizationId?: string, limit = 30): Promise<ActivityStreamItem[]> {
    try {
      const query = new URLSearchParams();
      if (organizationId) query.append('organizationId', organizationId);
      query.append('limit', String(limit));

      const res = await (api as any).request(`/intelligence/activity-stream?${query.toString()}`);
      return res || [];
    } catch (err) {
      console.warn('[HubIntelligenceApi] Failed fetching activity stream:', err);
      return [];
    }
  }
}

export const hubIntelligenceApi = new HubIntelligenceApi();
