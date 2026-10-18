// Small pool that limits how many live WebGL previews exist at once.
// Browsers allow only a limited number of WebGL contexts (and phones far fewer),
// so cards compete for a few "live" slots; the rest show a poster image.
type Listener = () => void;

const live: string[] = [];
const hovered = new Set<string>();
const listeners = new Set<Listener>();
let snapshot: readonly string[] = [];

function maxSlots(): number {
  if (typeof window === 'undefined') return 0;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const base = coarse ? 3 : 6;
  return memory !== undefined && memory <= 2 ? Math.min(base, 2) : base;
}

function emit() {
  snapshot = [...live];
  listeners.forEach((l) => l());
}

export function requestSlot(id: string) {
  if (live.includes(id)) return;
  live.push(id);
  while (live.length > maxSlots()) {
    const victim = live.find((v) => v !== id && !hovered.has(v)) ?? live.find((v) => v !== id);
    if (!victim) break;
    live.splice(live.indexOf(victim), 1);
  }
  emit();
}

export function releaseSlot(id: string) {
  const i = live.indexOf(id);
  if (i >= 0) {
    live.splice(i, 1);
    emit();
  }
}

export function setHovered(id: string, flag: boolean) {
  if (flag) hovered.add(id);
  else hovered.delete(id);
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): readonly string[] {
  return snapshot;
}
