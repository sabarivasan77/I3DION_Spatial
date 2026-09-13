import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { canAccessApp } from '../utils/permissions';
import { AppKey, APP_ENTITLEMENT_MAP } from '../contracts/licenseContracts';

interface EntitlementGuardProps {
  appKey: AppKey;
  children: React.ReactNode;
}

export const EntitlementGuard: React.FC<EntitlementGuardProps> = ({ appKey, children }) => {
  const user = useAuthStore((s) => s.user);
  const isAllowed = canAccessApp(user, appKey);

  if (!isAllowed) {
    const requiredTier = APP_ENTITLEMENT_MAP[appKey]?.requiredTier || 'Professional';
    console.warn(`[EntitlementGuard Access Blocked]: User does not have entitlement for ${appKey}. Required: ${requiredTier}`);
    
    // Redirect to Spatial Hub Organization page
    return <Navigate to="/hub/organization" replace state={{ entitlementBlockedApp: appKey, requiredTier }} />;
  }

  return <>{children}</>;
};
