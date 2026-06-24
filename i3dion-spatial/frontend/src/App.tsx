import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import { Suspense, lazy } from 'react';
import RouteTracker from './components/RouteTracker';

const LandingPage = lazy(() => import('./pages/Pages').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/Pages').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/Pages').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/Pages').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/Pages').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/Pages').then(m => ({ default: m.DashboardPage })));
const ProductManagementPage = lazy(() => import('./pages/ProductFlow').then(m => ({ default: m.ProductManagementPage })));
const ProductUploadWizardPage = lazy(() => import('./pages/ProductFlow').then(m => ({ default: m.ProductUploadWizardPage })));
const CatalogBuilderPage = lazy(() => import('./pages/CatalogBuilder').then(m => ({ default: m.CatalogBuilderPage })));
const ProductExperiencePage = lazy(() => import('./pages/ProductFlow').then(m => ({ default: m.ProductExperiencePage })));
const PublicProductPage = lazy(() => import('./pages/ProductFlow').then(m => ({ default: m.PublicProductPage })));
const AnalyticsDashboardPage = lazy(() => import('./pages/SalesIntelligence').then(m => ({ default: m.SalesIntelligencePage })));
const LeadsDashboardPage = lazy(() => import('./pages/LeadManagement').then(m => ({ default: m.LeadManagementPage })));
const CompanySettingsPage = lazy(() => import('./pages/Pages').then(m => ({ default: m.CompanySettingsPage })));
const SupportPage = lazy(() => import('./pages/Pages').then(m => ({ default: m.SupportPage })));

export default function App() {
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
        <Route path="products" element={<ProductManagementPage />} />
        <Route path="products/upload" element={<ProductUploadWizardPage />} />
        <Route path="catalog-builder" element={<CatalogBuilderPage />} />
        <Route path="product-experience" element={<ProductExperiencePage />} />

        <Route path="leads" element={<LeadsDashboardPage />} />
        <Route path="analytics" element={<AnalyticsDashboardPage />} />
        <Route path="settings" element={<CompanySettingsPage />} />
        <Route path="support" element={<SupportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
