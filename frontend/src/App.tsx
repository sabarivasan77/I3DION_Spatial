import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import { Suspense, lazy, useEffect } from 'react';
import RouteTracker from './components/RouteTracker';
import { ChatbotWidget } from './components/ChatbotWidget';
import { useAuthStore } from './store/authStore';

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/auth/AuthPages').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth/AuthPages').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/AuthPages').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/AuthPages').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductManagementPage = lazy(() => import('./pages/ProductFlow').then(m => ({ default: m.ProductManagementPage })));
const ProductUploadWizardPage = lazy(() => import('./pages/ProductFlow').then(m => ({ default: m.ProductUploadWizardPage })));
const CatalogBuilderPage = lazy(() => import('./pages/CatalogBuilder').then(m => ({ default: m.CatalogBuilderPage })));
const ProductExperiencePage = lazy(() => import('./pages/ProductFlow').then(m => ({ default: m.ProductExperiencePage })));
const PublicProductPage = lazy(() => import('./pages/ProductFlow').then(m => ({ default: m.PublicProductPage })));
const AnalyticsDashboardPage = lazy(() => import('./pages/SalesIntelligence').then(m => ({ default: m.SalesIntelligencePage })));
const AiIntelligencePage = lazy(() => import('./pages/AiIntelligence').then(m => ({ default: m.AiIntelligencePage })));
const LeadsDashboardPage = lazy(() => import('./pages/LeadManagement').then(m => ({ default: m.LeadManagementPage })));
const CompanySettingsPage = lazy(() => import('./pages/CompanySettingsPage').then(m => ({ default: m.CompanySettingsPage })));
const SupportDashboardPage = lazy(() => import('./pages/SupportDashboard').then(m => ({ default: m.SupportDashboardPage })));
const HelpCenterPage = lazy(() => import('./pages/HelpCenter').then(m => ({ default: m.HelpCenterPage })));
const HubFeedPage = lazy(() => import('./pages/hub/HubFeed').then(m => ({ default: m.HubFeed })));
const HubProductDetailPage = lazy(() => import('./pages/hub/HubProductDetail').then(m => ({ default: m.HubProductDetail })));
const HubSearchPage = lazy(() => import('./pages/hub/HubSearch').then(m => ({ default: m.HubSearch })));
const CreatorProfilePage = lazy(() => import('./pages/hub/CreatorProfile').then(m => ({ default: m.CreatorProfile })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard').then(m => ({ default: m.SecurityDashboard })));
const BillingSettingsPage = lazy(() => import('./pages/settings/BillingSettingsPage').then(m => ({ default: m.BillingSettingsPage })));
const TeamManagementPage = lazy(() => import('./pages/settings/TeamManagementPage').then(m => ({ default: m.TeamManagementPage })));

export default function App() {
  const initialize = useAuthStore(state => state.initialize);
  const initialized = useAuthStore(state => state.initialized);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Initializing App...</div>;
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading...</div>}>
      <RouteTracker />
      <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="product/:slug" element={<PublicProductPage />} />
      </Route>
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="hub" element={<HubFeedPage />} />
        <Route path="hub/search" element={<HubSearchPage />} />
        <Route path="hub/product/:id" element={<HubProductDetailPage />} />
        <Route path="hub/creator/:id" element={<CreatorProfilePage />} />
        <Route path="products" element={<ProductManagementPage />} />
        <Route path="products/upload" element={<ProductUploadWizardPage />} />
        <Route path="catalog-builder" element={<CatalogBuilderPage />} />
        <Route path="product-experience" element={<ProductExperiencePage />} />

        <Route path="leads" element={<LeadsDashboardPage />} />
        <Route path="analytics" element={<AnalyticsDashboardPage />} />
        <Route path="ai" element={<AiIntelligencePage />} />
        <Route path="settings" element={<CompanySettingsPage />} />
        <Route path="settings/billing" element={<BillingSettingsPage />} />
        <Route path="settings/team" element={<TeamManagementPage />} />
        <Route path="security" element={<SecurityDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="support" element={<SupportDashboardPage />} />
        <Route path="support/kb" element={<HelpCenterPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatbotWidget />
    </Suspense>
  );
}
