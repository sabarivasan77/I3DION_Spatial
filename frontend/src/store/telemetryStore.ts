import { create } from 'zustand';

export interface TelemetryEvent {
  id: string;
  eventType: 'view' | 'like' | 'save' | 'comment' | 'share' | 'enquiry' | 'ar_launch' | 'interactive_launch';
  productId?: string;
  productName?: string;
  userId?: string;
  organizationId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface TelemetryState {
  events: TelemetryEvent[];
  trackEvent: (event: Omit<TelemetryEvent, 'id' | 'timestamp'>) => void;
  getEventsByProduct: (productId: string) => TelemetryEvent[];
  getEventsByType: (eventType: TelemetryEvent['eventType']) => TelemetryEvent[];
  clearEvents: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  events: JSON.parse(localStorage.getItem('i3dion_telemetry_events') || '[]'),

  trackEvent: (eventData) => {
    const newEvent: TelemetryEvent = {
      ...eventData,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    const updated = [newEvent, ...get().events].slice(0, 500); // Maintain last 500 events locally
    localStorage.setItem('i3dion_telemetry_events', JSON.stringify(updated));
    set({ events: updated });
  },

  getEventsByProduct: (productId: string) => {
    return get().events.filter((e) => e.productId === productId);
  },

  getEventsByType: (eventType) => {
    return get().events.filter((e) => e.eventType === eventType);
  },

  clearEvents: () => {
    localStorage.removeItem('i3dion_telemetry_events');
    set({ events: [] });
  },
}));
