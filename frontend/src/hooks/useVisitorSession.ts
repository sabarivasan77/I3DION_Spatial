import { useEffect, useState, useRef } from 'react';

export interface VisitorInfo {
  name?: string;
  email?: string;
  company?: string;
}

export function useVisitorSession(slug?: string, organizationId?: string) {
  const [visitorId, setVisitorId] = useState<string>('');
  const [returningVisitor, setReturningVisitor] = useState<boolean>(false);
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // 1. Get or create visitor ID
    let vid = localStorage.getItem('i3dion_visitor_id');
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('i3dion_visitor_id', vid);
    }
    setVisitorId(vid);

    // 2. Fetch returning visitor context if possible
    if (vid) {
      const url = `/api/public/visitor/${vid}/context${organizationId ? `?organizationId=${organizationId}` : ''}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data?.returningVisitor && data?.visitor) {
            setReturningVisitor(true);
            setVisitorInfo(data.visitor);
          }
        })
        .catch((err) => console.warn('Could not check returning visitor:', err));
    }

    // 3. Track initial page_view / product_view
    if (slug && vid) {
      trackPublicEvent(slug, 'product_view', { source: 'web' }, vid);
    }

    // 4. Track session duration on unmount
    return () => {
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (slug && vid && durationSeconds > 3) {
        trackPublicEvent(slug, 'session_duration', { durationSeconds }, vid);
      }
    };
  }, [slug, organizationId]);

  const trackEvent = (eventType: string, metadata: Record<string, any> = {}) => {
    if (!visitorId) return;
    trackPublicEvent(slug, eventType, metadata, visitorId);
  };

  return {
    visitorId,
    returningVisitor,
    visitorInfo,
    trackEvent,
  };
}

export async function trackPublicEvent(
  slug?: string,
  eventType: string = 'product_view',
  metadata: Record<string, any> = {},
  visitorId?: string
) {
  const vid = visitorId || localStorage.getItem('i3dion_visitor_id') || undefined;

  try {
    await fetch('/api/public/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        eventType,
        metadata,
        visitorId: vid,
      }),
    });
  } catch (err) {
    console.warn('Failed to track public analytics event:', err);
  }
}
