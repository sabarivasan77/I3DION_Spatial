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
import { lazyWithRetry } from './utils/lazyWithRetry';

const LandingPage = lazyWithRetry(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazyWithRetry(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazyWithRetry(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.ResetPasswordPage })));
const ProductManagementPage = lazyWithRetry(() => import('./pages/ProductFlow').then((m) => ({ default: m.ProductManagementPage })));
const ProductUploadWizardPage = lazyWithRetry(() => import('./pages/ProductFlow').then((m) => ({ default: m.ProductUploadWizardPage })));
const ProductExperiencePage = lazyWithRetry(() => import('./pages/ProductFlow').then((m) => ({ default: m.ProductExperiencePage })));
const PublicProductPage = lazyWithRetry(() => import('./pages/PublicProductPage').then((m) => ({ default: m.PublicProductPage })));
const AnalyticsDashboardPage = lazyWithRetry(() => import('./pages/SalesIntelligence').then((m) => ({ default: m.SalesIntelligencePage })));
const AiIntelligencePage = lazyWithRetry(() => import('./pages/AiIntelligence').then((m) => ({ default: m.AiIntelligencePage })));
const LeadsDashboardPage = lazyWithRetry(() => import('./pages/LeadManagement').then((m) => ({ default: m.LeadManagementPage })));
const CompanySettingsPage = lazyWithRetry(() => import('./pages/CompanySettingsPage').then((m) => ({ default: m.CompanySettingsPage })));
const SupportDashboardPage = lazyWithRetry(() => import('./pages/SupportDashboard').then((m) => ({ default: m.SupportDashboardPage })));
const HelpCenterPage = lazyWithRetry(() => import('./pages/HelpCenter').then((m) => ({ default: m.HelpCenterPage })));

// Spatial Hub Pages
const HubExplorePage = lazyWithRetry(() => import('./pages/hub/HubExplore').then((m) => ({ default: m.HubExplore })));
const HubFeedPage = lazyWithRetry(() => import('./pages/hub/HubFeed').then((m) => ({ default: m.HubFeed })));
const HubProductDetailPage = lazyWithRetry(() => import('./pages/hub/HubProductDetail').then((m) => ({ default: m.HubProductDetail })));
const HubSearchPage = lazyWithRetry(() => import('./pages/hub/HubSearch').then((m) => ({ default: m.HubSearch })));
const CreatorProfilePage = lazyWithRetry(() => import('./pages/hub/CreatorProfile').then((m) => ({ default: m.CreatorProfile })));
const HubSavedPage = lazyWithRetry(() => import('./pages/hub/HubSavedPage').then((m) => ({ default: m.HubSavedPage })));
const HubLikedPage = lazyWithRetry(() => import('./pages/hub/HubLikedPage').then((m) => ({ default: m.HubLikedPage })));
const HubEnquiriesPage = lazyWithRetry(() => import('./pages/hub/HubEnquiriesPage').then((m) => ({ default: m.HubEnquiriesPage })));
const HubOrganizationPage = lazyWithRetry(() => import('./pages/hub/HubOrganizationPage').then((m) => ({ default: m.HubOrganizationPage })));

const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SecurityDashboard = lazyWithRetry(() => import('./pages/SecurityDashboard').then((m) => ({ default: m.SecurityDashboard })));
const BillingSettingsPage = lazyWithRetry(() => import('./pages/settings/BillingSettingsPage').then((m) => ({ default: m.BillingSettingsPage })));
const TeamManagementPage = lazyWithRetry(() => import('./pages/settings/TeamManagementPage').then((m) => ({ default: m.TeamManagementPage })));
const EnginePage = lazyWithRetry(() => import('./features/engine/EnginePage').then((m) => ({ default: m.EnginePage })));
const LensPage = lazyWithRetry(() => import('./features/lens/LensPage').then((m) => ({ default: m.LensPage })));
const BuildingManagementPage = lazyWithRetry(() => import('./pages/BuildingManagementPage').then((m) => ({ default: m.BuildingManagementPage })));

const VaultLayout = lazyWithRetry(() => import('./layouts/VaultLayout'));
const VaultDashboard = lazyWithRetry(() => import('./pages/vault/VaultDashboard'));
const VaultAssetList = lazyWithRetry(() => import('./pages/vault/VaultAssetList'));
const VaultAssetDetail = lazyWithRetry(() => import('./pages/vault/VaultAssetDetail'));
const VaultUploadWizard = lazyWithRetry(() => import('./pages/vault/VaultUploadWizard'));
const VaultDataWorkspace = lazyWithRetry(() => import('./pages/vault/VaultDataWorkspace'));
const VaultAuditTrail = lazyWithRetry(() => import('./pages/vault/VaultAuditTrail'));
const VaultSecondary = lazyWithRetry(() => import('./pages/vault/VaultSecondaryViews').then((m) => ({ default: m.VaultCollections })));
const VaultTemplates = lazyWithRetry(() => import('./pages/vault/VaultSecondaryViews').then((m) => ({ default: m.VaultTemplates })));
const VaultProcessing = lazyWithRetry(() => import('./pages/vault/VaultSecondaryViews').then((m) => ({ default: m.VaultProcessing })));
const VaultTrash = lazyWithRetry(() => import('./pages/vault/VaultSecondaryViews').then((m) => ({ default: m.VaultTrash })));
const VaultShared = lazyWithRetry(() => import('./pages/vault/VaultSecondaryViews').then((m) => ({ default: m.VaultShared })));
const VaultSettings = lazyWithRetry(() => import('./pages/vault/VaultSecondaryViews').then((m) => ({ default: m.VaultSettings })));

// Omni Studio Pages
const StudioLayout = lazyWithRetry(() => import('./layouts/StudioLayout'));
const StudioOverview = lazyWithRetry(() => import('./pages/studio/StudioOverview').then((m) => ({ default: m.StudioOverview })));
const StudioProjects = lazyWithRetry(() => import('./pages/studio/StudioProjects').then((m) => ({ default: m.StudioProjects })));
const StudioCatalogBuilder = lazyWithRetry(() => import('./pages/studio/StudioCatalogBuilder').then((m) => ({ default: m.StudioCatalogBuilder })));
const StudioTemplates = lazyWithRetry(() => import('./pages/studio/StudioTemplates').then((m) => ({ default: m.StudioTemplates })));
const StudioPublished = lazyWithRetry(() => import('./pages/studio/StudioPublished').then((m) => ({ default: m.StudioPublished })));
const StudioDrafts = lazyWithRetry(() => import('./pages/studio/StudioSecondaryViews').then((m) => ({ default: m.StudioDrafts })));
const StudioVersions = lazyWithRetry(() => import('./pages/studio/StudioSecondaryViews').then((m) => ({ default: m.StudioVersions })));
const StudioSettings = lazyWithRetry(() => import('./pages/studio/StudioSecondaryViews').then((m) => ({ default: m.StudioSettings })));
const StudioSupport = lazyWithRetry(() => import('./pages/studio/StudioSecondaryViews').then((m) => ({ default: m.StudioSupport })));

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
          <Route path="hub/profile/:id" element={<CreatorProfilePage />} />
          <Route path="hub/saved" element={<HubSavedPage />} />
          <Route path="hub/liked" element={<HubLikedPage />} />
          <Route path="hub/enquiries" element={<HubEnquiriesPage />} />
          <Route path="hub/organization" element={<HubOrganizationPage />} />
          <Route path="hub/organization/:tab" element={<HubOrganizationPage />} />
          <Route path="hub/company/:id" element={<HubOrganizationPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<ProfilePage />} />
          <Route path="support" element={<SupportDashboardPage />} />
          <Route path="support/kb" element={<HelpCenterPage />} />
        </Route>

        {/* 2. I3DION SPATIAL VAULT — DEDICATED NEW APPLICATION SHELL */}
        <Route
          path="vault"
          element={
            <ProtectedRoute>
              <ApplicationErrorBoundary appName="I3DION Spatial Vault">
                <EntitlementGuard appKey="vault">
                  <VaultLayout />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<VaultDashboard />} />
          <Route path="assets" element={<VaultAssetList />} />
          <Route path="assets/:assetId" element={<VaultAssetDetail />} />
          <Route path="workspace/:sourceId" element={<VaultDataWorkspace />} />
          <Route path="upload" element={<VaultUploadWizard />} />
          <Route path="collections" element={<VaultSecondary />} />
          <Route path="templates" element={<VaultTemplates />} />
          <Route path="processing" element={<VaultProcessing />} />
          <Route path="trash" element={<VaultTrash />} />
          <Route path="audit" element={<VaultAuditTrail />} />
          <Route path="shared" element={<VaultShared />} />
          <Route path="settings" element={<VaultSettings />} />
        </Route>

        {/* 3. I3DION OMNI STUDIO — DEDICATED NEW APPLICATION SHELL */}
        <Route
          path="omni-studio"
          element={
            <ProtectedRoute>
              <ApplicationErrorBoundary appName="I3DION Omni Studio">
                <EntitlementGuard appKey="studio">
                  <StudioLayout />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<StudioOverview />} />
          <Route path="overview" element={<StudioOverview />} />
          <Route path="projects" element={<StudioProjects />} />
          <Route path="builder/:id" element={<StudioCatalogBuilder />} />
          <Route path="templates" element={<StudioTemplates />} />
          <Route path="published" element={<StudioPublished />} />
          <Route path="drafts" element={<StudioDrafts />} />
          <Route path="versions" element={<StudioVersions />} />
          <Route path="settings" element={<StudioSettings />} />
          <Route path="support" element={<StudioSupport />} />
        </Route>

        {/* Legacy Catalog Builder Redirect to Omni Studio */}
        <Route path="catalog-builder" element={<Navigate to="/omni-studio/projects" replace />} />
        <Route path="catalog-builder/*" element={<Navigate to="/omni-studio/projects" replace />} />

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

        {/* 4. DEDICATED STANDALONE I3DION SPATIAL ENGINE */}
        <Route
          path="engine"
          element={
            <ProtectedRoute>
              <ApplicationErrorBoundary appName="I3DION Spatial Engine">
                <EntitlementGuard appKey="engine">
                  <EnginePage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="engine/*"
          element={
            <ProtectedRoute>
              <ApplicationErrorBoundary appName="I3DION Spatial Engine">
                <EntitlementGuard appKey="engine">
                  <EnginePage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="studio" element={<Navigate to="/omni-studio" replace />} />
        <Route path="studio/*" element={<Navigate to="/omni-studio" replace />} />

        {/* 5. DEDICATED STANDALONE I3DION SPATIAL LENS */}
        <Route
          path="lens"
          element={
            <ProtectedRoute>
              <ApplicationErrorBoundary appName="I3DION Spatial Lens">
                <EntitlementGuard appKey="lens">
                  <LensPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="lens/*"
          element={
            <ProtectedRoute>
              <ApplicationErrorBoundary appName="I3DION Spatial Lens">
                <EntitlementGuard appKey="lens">
                  <LensPage />
                </EntitlementGuard>
              </ApplicationErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
