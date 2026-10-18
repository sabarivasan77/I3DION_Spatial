/**
 * editor-kernel/featureFlags.ts
 * Manages feature flags for strangler migration and progressive rollout.
 */

export interface FeatureFlags {
  'ff.kernel.studio': boolean;    // Enables @dnd-kit based Studio Layout canvas
  'ff.kernel.logic': boolean;     // Enables @xyflow/react based Circuits Canvas
  'ff.engine.circuits': boolean;  // Enables 3D Engine Circuits integration
  'ff.engine.transform': boolean; // Enables 3D TransformControls in Edit Mode
}

const DEFAULT_FLAGS: FeatureFlags = {
  'ff.kernel.studio': true,
  'ff.kernel.logic': true,
  'ff.engine.circuits': true,
  'ff.engine.transform': true,
};

export class FeatureFlagManager {
  private flags: FeatureFlags;

  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = localStorage.getItem('i3dion_feature_flags');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = { ...this.flags, ...parsed };
      }
    } catch {
      // ignore
    }
  }

  public isEnabled(key: keyof FeatureFlags): boolean {
    return !!this.flags[key];
  }

  public setFlag(key: keyof FeatureFlags, value: boolean) {
    this.flags[key] = value;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('i3dion_feature_flags', JSON.stringify(this.flags));
      } catch {
        // ignore
      }
    }
  }

  public getAll(): FeatureFlags {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagManager();
