import { create } from 'zustand';

export type LicenseTier = 'Basic' | 'Professional' | 'Enterprise';

export type AppKey = 'hub' | 'vault' | 'studio' | 'engine' | 'lens';

export interface LicenseState {
  currentTier: LicenseTier;
  organizationId: string | null;
  companyName: string | null;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled';
  renewalDate: string;
  setLicenseTier: (tier: LicenseTier) => void;
  hasAppAccess: (appKey: AppKey) => boolean;
  hasFeatureAccess: (featureKey: string) => boolean;
}

export const APP_ENTITLEMENTS: Record<LicenseTier, AppKey[]> = {
  Basic: ['hub'],
  Professional: ['hub', 'vault', 'studio', 'engine'],
  Enterprise: ['hub', 'vault', 'studio', 'engine', 'lens'],
};

export const FEATURE_ENTITLEMENTS: Record<LicenseTier, string[]> = {
  Basic: ['hub.view', 'hub.like', 'hub.save', 'hub.comment', 'hub.share', 'hub.enquire', 'org.view_published'],
  Professional: [
    'hub.view', 'hub.like', 'hub.save', 'hub.comment', 'hub.share', 'hub.enquire', 'org.view_published',
    'vault.manage', 'studio.create_catalog', 'engine.author_interactive', 'ar.export'
  ],
  Enterprise: [
    'hub.view', 'hub.like', 'hub.save', 'hub.comment', 'hub.share', 'hub.enquire', 'org.view_published',
    'vault.manage', 'studio.create_catalog', 'engine.author_interactive', 'ar.export',
    'lens.build_dashboards', 'lens.publish_dashboards', 'org.billing.manage', 'org.advanced_rbac'
  ],
};

export const useLicenseStore = create<LicenseState>((set, get) => ({
  currentTier: (localStorage.getItem('i3dion_license_tier') as LicenseTier) || 'Enterprise',
  organizationId: 'org_i3dion_demo',
  companyName: 'I3DION Technologies',
  subscriptionStatus: 'active',
  renewalDate: '2027-12-31',

  setLicenseTier: (tier: LicenseTier) => {
    localStorage.setItem('i3dion_license_tier', tier);
    set({ currentTier: tier });
  },

  hasAppAccess: (appKey: AppKey) => {
    const { currentTier } = get();
    const allowed = APP_ENTITLEMENTS[currentTier] || [];
    return allowed.includes(appKey);
  },

  hasFeatureAccess: (featureKey: string) => {
    const { currentTier } = get();
    const allowed = FEATURE_ENTITLEMENTS[currentTier] || [];
    return allowed.includes(featureKey);
  },
}));
