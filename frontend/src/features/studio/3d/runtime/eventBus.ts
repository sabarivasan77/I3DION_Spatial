import { ExperienceEventPayload, ExperienceEventType } from '../types/threeTypes';

type EventListener = (event: ExperienceEventPayload) => void;

class ExperienceEventBus {
  private listeners: Map<ExperienceEventType, Set<EventListener>> = new Map();

  public subscribe(type: ExperienceEventType, listener: EventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  public dispatch(event: Omit<ExperienceEventPayload, 'timestamp'>): void {
    const payload: ExperienceEventPayload = {
      ...event,
      timestamp: Date.now(),
    };

    const targetListeners = this.listeners.get(event.type);
    if (targetListeners) {
      targetListeners.forEach(listener => listener(payload));
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const experienceEventBus = new ExperienceEventBus();
