import { API_BASE_URL } from './api';

const VISITOR_ID_KEY = 'i3dion_visitor_id';
const EVENTS_STORAGE_KEY = 'i3dion.analytics_events';

export interface AnalyticsEventRecord {
  eventId: string;
  eventName: string;
  productId?: string;
  sessionId: string;
  visitorId: string;
  timestamp: string;
  source?: string;
  metadata?: Record<string, any>;
  activeDurationSeconds?: number;
}

class TrackingService {
  private visitorId: string;
  private sessionId: string;
  private sessionStartTime: number;
  private activeTimeSeconds: number = 0;
  private lastActiveTimestamp: number = Date.now();
  private lastFiredEvents: Map<string, number> = new Map();

  constructor() {
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = crypto.randomUUID();
    this.sessionStartTime = Date.now();
    this.initializeSession();
  }

  private getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return 'server-side';
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  }

  private initializeSession() {
    if (typeof window === 'undefined') return;

    // Active time tracking
    const updateActiveTime = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const delta = Math.floor((now - this.lastActiveTimestamp) / 1000);
        if (delta > 0 && delta < 300) {
          this.activeTimeSeconds += delta;
        }
        this.lastActiveTimestamp = now;
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.lastActiveTimestamp = Date.now();
      } else {
        updateActiveTime();
      }
    });

    setInterval(updateActiveTime, 5000);

    // Track total session on unload
    window.addEventListener('beforeunload', () => {
      updateActiveTime();
      const totalDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      this.trackEventBeacon('product_view_ended', {
        totalDurationSeconds: totalDuration,
        activeTimeSeconds: this.activeTimeSeconds,
      });
    });
  }

  public getVisitorId(): string {
    return this.visitorId;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getActiveTimeSeconds(): number {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      const now = Date.now();
      const delta = Math.floor((now - this.lastActiveTimestamp) / 1000);
      if (delta > 0 && delta < 300) {
        this.activeTimeSeconds += delta;
        this.lastActiveTimestamp = now;
      }
    }
    return this.activeTimeSeconds;
  }

  /**
   * Centralized track function
   */
  public async track(
    eventName: string,
    productId?: string,
    metadata: Record<string, any> = {},
    slug?: string
  ) {
    // Throttle frequent 3D interaction events to avoid spamming 100s per second
    if (['model_rotate', 'model_zoom', 'model_pan'].includes(eventName)) {
      const lastTime = this.lastFiredEvents.get(`${eventName}_${productId || 'global'}`) || 0;
      if (Date.now() - lastTime < 1500) {
        return;
      }
      this.lastFiredEvents.set(`${eventName}_${productId || 'global'}`, Date.now());
    }

    const eventRecord: AnalyticsEventRecord = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventName,
      productId,
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      timestamp: new Date().toISOString(),
      source: metadata.source || (typeof window !== 'undefined' ? window.location.pathname : 'direct'),
      metadata: {
        ...metadata,
        deviceCategory: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
      },
      activeDurationSeconds: this.getActiveTimeSeconds(),
    };

    // Store in local event stream
    this.storeLocalEvent(eventRecord);

    // Send to API
    try {
      await fetch(`${API_BASE_URL}/public/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventRecord),
      });
    } catch {
      // Non-blocking fallback if network fails
    }
  }

  /**
   * Alias for backward compatibility
   */
  public async trackEvent(eventType: string, metadata: any = {}, slug?: string) {
    return this.track(eventType, metadata.productId, metadata, slug);
  }

  private storeLocalEvent(record: AnalyticsEventRecord) {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) ?? '[]') as AnalyticsEventRecord[];
      stored.unshift(record);
      // Keep up to 1000 recent events
      if (stored.length > 1000) stored.length = 1000;
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(stored));
    } catch (err) {
      console.warn('Failed to persist analytics event locally:', err);
    }
  }

  public getLocalEvents(): AnalyticsEventRecord[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) ?? '[]') as AnalyticsEventRecord[];
    } catch {
      return [];
    }
  }

  private trackEventBeacon(eventType: string, metadata: any = {}) {
    try {
      const payload = {
        eventId: `evt_${Date.now()}`,
        eventName: eventType,
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        timestamp: new Date().toISOString(),
        metadata,
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE_URL}/public/analytics/events`, blob);
    } catch (err) {
      console.error('Failed to send beacon:', err);
    }
  }
}

export const Tracker = new TrackingService();
