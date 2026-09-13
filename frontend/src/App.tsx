import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import SpatialHubLayout from './layouts/SpatialHubLayout';
import { ApplicationErrorBoundary } from './components/ApplicationErrorBoundary';
import { EntitlementGuard } from './components/EntitlementGuard';
import { Suspense, lazy, useEffect } from 'react';
import RouteTracker from './components/RouteTracker';
import { useAuthStore } from './store/authStore';

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProductManagementPage = lazy(() => import('./pages/ProductFlow').then((m) => ({ default: m.ProductManagementPage })));
const ProductUploadWizardPage = lazy(() => import('./pages/ProductFlow').then((m) => ({ default: m.ProductUploadWizardPage })));
const CatalogBuilderPage = lazy(() => import('./pages/CatalogBuilder').then((m) => ({ default: m.CatalogBuilderPage })));
const ProductExperiencePage = lazy(() => import('./pages/ProductFlow').then((m) => ({ default: m.ProductExperiencePage })));
const PublicProductPage = lazy(() => import('./pages/PublicProductPage').then((m) => ({ default: m.PublicProductPage })));
const AnalyticsDashboardPage = lazy(() => import('./pages/SalesIntelligence').then((m) => ({ default: m.SalesIntelligencePage })));
const AiIntelligencePage = lazy(() => import('./pages/AiIntelligence').then((m) => ({ default: m.AiIntelligencePage })));
const LeadsDashboardPage = lazy(() => import('./pages/LeadManagement').then((m) => ({ default: m.LeadManagementPage })));
const CompanySettingsPage = lazy(() => import('./pages/CompanySettingsPage').then((m) => ({ default: m.CompanySettingsPage })));
const SupportDashboardPage = lazy(() => import('./pages/SupportDashboard').then((m) => ({ default: m.SupportDashboardPage })));
const HelpCenterPage = lazy(() => import('./pages/HelpCenter').then((m) => ({ default: m.HelpCenterPage })));

// Spatial Hub Pages
const HubExplorePage = lazy(() => import('./pages/hub/HubExplore').then((m) => ({ default: m.HubExplore })));
const HubFeedPage = lazy(() => import('./pages/hub/HubFeed').then((m) => ({ default: m.HubFeed })));
const HubProductDetailPage = lazy(() => import('./pages/hub/HubProductDetail').then((m) => ({ default: m.HubProductDetail })));
const HubSearchPage = lazy(() => import('./pages/hub/HubSearch').then((m) => ({ default: m.HubSearch })));
const CreatorProfilePage = lazy(() => import('./pages/hub/CreatorProfile').then((m) => ({ default: m.CreatorProfile })));
const HubSavedPage = lazy(() => import('./pages/hub/HubSavedPage').then((m) => ({ default: m.HubSavedPage })));
const HubLikedPage = lazy(() => import('./pages/hub/HubLikedPage').then((m) => ({ default: m.HubLikedPage })));
const HubEnquiriesPage = lazy(() => import('./pages/hub/HubEnquiriesPage').then((m) => ({ default: m.HubEnquiriesPage })));
const HubOrganizationPage = lazy(() => import('./pages/hub/HubOrganizationPage').then((m) => ({ default: m.HubOrganizationPage })));

const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard').then((m) => ({ default: m.SecurityDashboard })));
const BillingSettingsPage = lazy(() => import('./pages/settings/BillingSettingsPage').then((m) => ({ default: m.BillingSettingsPage })));
const TeamManagementPage = lazy(() => import('./pages/settings/TeamManagementPage').then((m) => ({ default: m.TeamManagementPage })));
const OmniStudioPage = lazy(() => import('./features/studio/OmniStudioPage').then((m) => ({ default: m.OmniStudioPage })));
const BuildingManagementPage = lazy(() => import('./pages/BuildingManagementPage').then((m) => ({ default: m.BuildingManagementPage })));

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <RouteTracker />
      <Routes>
        {/* Public Auth & Marketing Landing */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Public Product & Experience Direct URLs */}
        <Route path="product/:slug" element={<PublicProductPage />} />
        <Route path="experience/:publicId" element={<PublicProductPage />} />

        {/* 1. I3DION SPATIAL HUB — Public Consumer Front Door Boundary */}
        <Route
          element={
            <ApplicationErrorBoundary appName="I3DION Spatial Hub">
              <SpatialHubLayout />
            </ApplicationErrorBoundary>
          }
        >
          <Route path="hub" element={<HubExplorePage />} />
          <Route path="hub/feed" element={<HubFeedPage />} />
          <Route path="hub/search" element={<HubSearchPage />} />
          <Route path="hub/product/:id" element={<HubProductDetailPage />} />
          <Route path="hub/creator/:id" element={<CreatorProfilePage />} />
          <Route path="hub/saved" element={<HubSavedPage />} />
          <Route path="hub/liked" element={<HubLikedPage />} />
          <Route path="hub/enquiries" element={<HubEnquiriesPage />} />
          <Route path="hub/organization" element={<HubOrganizationPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<ProfilePage />} />
          <Route path="support" element={<SupportDashboardPage />} />
          <Route path="support/kb" element={<HelpCenterPage />} />
        </Route>

        {/* INTERNAL ORGANIZATION APPLICATIONS SHELL */}
        <Route path="dashboard" element={<Navigate to="/hub" replace />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >

          {/* 2. I3DION SPATIAL VAULT */}
          <Route
            path="products"
            element={
              <ApplicationErrorBoundary appName="I3DION Spatial Vault">
                <EntitlementGuard appKey="vault">
                  <ProductManagementPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />
          <Route
            path="products/upload"
            element={
              <ApplicationErrorBoundary appName="I3DION Spatial Vault">
                <EntitlementGuard appKey="vault">
                  <ProductUploadWizardPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />
          <Route
            path="buildings"
            element={
              <ApplicationErrorBoundary appName="I3DION Spatial Vault">
                <EntitlementGuard appKey="vault">
                  <BuildingManagementPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />

          {/* 3. I3DION OMNI STUDIO */}
          <Route
            path="catalog-builder"
            element={
              <ApplicationErrorBoundary appName="I3DION Omni Studio">
                <EntitlementGuard appKey="studio">
                  <CatalogBuilderPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />

          {/* 4. I3DION SPATIAL ENGINE */}
          <Route
            path="studio"
            element={
              <ApplicationErrorBoundary appName="I3DION Spatial Engine">
                <EntitlementGuard appKey="engine">
                  <OmniStudioPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />
          <Route
            path="product-experience"
            element={
              <ApplicationErrorBoundary appName="I3DION Spatial Engine">
                <EntitlementGuard appKey="engine">
                  <ProductExperiencePage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />

          {/* 5. I3DION SPATIAL LENS */}
          <Route
            path="analytics"
            element={
              <ApplicationErrorBoundary appName="I3DION Spatial Lens">
                <EntitlementGuard appKey="lens">
                  <AnalyticsDashboardPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />
          <Route
            path="leads"
            element={
              <ApplicationErrorBoundary appName="I3DION Spatial Lens">
                <EntitlementGuard appKey="lens">
                  <LeadsDashboardPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />
          <Route
            path="ai"
            element={
              <ApplicationErrorBoundary appName="I3DION Spatial Lens">
                <EntitlementGuard appKey="lens">
                  <AiIntelligencePage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            }
          />

          {/* Settings & Admin */}
          <Route path="settings" element={<CompanySettingsPage />} />
          <Route path="settings/billing" element={<BillingSettingsPage />} />
          <Route path="settings/team" element={<TeamManagementPage />} />
          <Route path="security" element={<SecurityDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
