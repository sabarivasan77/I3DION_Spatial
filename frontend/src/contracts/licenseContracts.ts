export type LicenseTier = 'Basic' | 'Professional' | 'Enterprise';

export type AppKey = 'hub' | 'vault' | 'studio' | 'engine' | 'lens';

export interface AppEntitlement {
  appKey: AppKey;
  appName: string;
  requiredTier: LicenseTier;
}

export const APP_ENTITLEMENT_MAP: Record<AppKey, { name: string; requiredTier: LicenseTier }> = {
  hub: { name: 'I3DION Spatial Hub', requiredTier: 'Basic' },
  vault: { name: 'I3DION Spatial Vault', requiredTier: 'Professional' },
  studio: { name: 'I3DION Omni Studio', requiredTier: 'Professional' },
  engine: { name: 'I3DION Spatial Engine', requiredTier: 'Professional' },
  lens: { name: 'I3DION Spatial Lens', requiredTier: 'Enterprise' },
};
