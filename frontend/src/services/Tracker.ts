

const VISITOR_ID_KEY = 'i3dion_visitor_id';

class TrackingService {
  private visitorId: string;
  private sessionId: string;

  constructor() {
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = crypto.randomUUID();
    this.initializeSession();
  }

  private getOrCreateVisitorId(): string {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  }

  private initializeSession() {
    const sessionStart = Date.now();
    // Setup beforeunload to track total session duration
    window.addEventListener('beforeunload', () => {
      const durationSeconds = Math.floor((Date.now() - sessionStart) / 1000);
      if (durationSeconds > 5) {
        // Use sendBeacon for reliable delivery on unload
        this.trackEventBeacon('time_spent', { durationSeconds });
      }
    });
  }

  public getVisitorId(): string {
    return this.visitorId;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Tracks an event via the public API.
   * @param eventType The type of event (e.g. 'page_view', 'ar_launch')
   * @param metadata Optional metadata
   * @param slug Optional product slug if relevant
   */
  public async trackEvent(eventType: string, metadata: any = {}, slug?: string) {
    try {
      const payload = {
        eventType,
        metadata: {
          ...metadata,
          visitorId: this.visitorId,
        },
        sessionId: this.sessionId,
        slug
      };

      await fetch('http://localhost:4000/api/public/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Uses navigator.sendBeacon for events right before page unload
   */
  private trackEventBeacon(eventType: string, metadata: any = {}, slug?: string) {
    try {
      const payload = {
        eventType,
        metadata: {
          ...metadata,
          visitorId: this.visitorId,
        },
        sessionId: this.sessionId,
        slug
      };

      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('http://localhost:4000/api/public/analytics/events', blob);
    } catch (error) {
      console.error('Failed to send beacon:', error);
    }
  }
}

export const Tracker = new TrackingService();
