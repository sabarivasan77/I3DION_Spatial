import { RuntimeEventPayload } from './runtimeTypes';

type EventCallback = (payload: RuntimeEventPayload) => void;

class RuntimeEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return cleanup function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  public emit(payload: RuntimeEventPayload): void {
    const set = this.listeners.get(payload.eventType);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error executing event bus listener for ${payload.eventType}:`, err);
        }
      });
    }
  }

  public clearAll(): void {
    this.listeners.clear();
  }
}

export const runtimeEventBus = new RuntimeEventBus();
