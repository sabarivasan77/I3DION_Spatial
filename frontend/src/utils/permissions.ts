import { SessionUser } from '../services/api';
import { useLicenseStore, AppKey } from '../store/licenseStore';

export interface UserContext {
  user: SessionUser | null;
  isOrgUser: boolean;
  role: string;
}

export function getUserContext(user: SessionUser | null): UserContext {
  if (!user) {
    return { user: null, isOrgUser: false, role: 'Guest' };
  }

  // A user is considered an Organization User if they have a companyId or an org role
  const isOrgUser = Boolean(
    user.companyId &&
    user.companyId !== 'public' &&
    user.companyId !== 'guest' &&
    user.companyId.trim() !== ''
  );

  return {
    user,
    isOrgUser,
    role: user.role || 'Viewer',
  };
}

export function canAccessApp(user: SessionUser | null, appKey: AppKey): boolean {
  // Hub is accessible to everyone
  if (appKey === 'hub') return true;

  const { isOrgUser } = getUserContext(user);
  if (!isOrgUser) return false;

  // Check license tier access
  return useLicenseStore.getState().hasAppAccess(appKey);
}

export function canManageBilling(user: SessionUser | null): boolean {
  const { isOrgUser, role } = getUserContext(user);
  if (!isOrgUser) return false;
  
  const isOrgAdmin = ['Super Admin', 'Admin', 'Company Admin', 'Manager'].includes(role);
  const hasEntitlement = useLicenseStore.getState().hasFeatureAccess('org.billing.manage');
  
  return isOrgAdmin || hasEntitlement;
}
