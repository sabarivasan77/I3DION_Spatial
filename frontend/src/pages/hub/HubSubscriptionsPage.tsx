import { useEffect } from 'react';
import { Package, CheckCircle2, AlertCircle, Calendar, CreditCard, ExternalLink, Zap } from 'lucide-react';
import { useHubPersonalStore } from '../../store/hubPersonalStore';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

export function HubSubscriptionsPage() {
  const { subscription, fetchPersonalData, isLoading } = useHubPersonalStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPersonalData();
  }, [fetchPersonalData]);

  const hasSubscription = !!subscription;
  const isEnterprise = subscription?.enterprise_access;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 md:p-8 shadow-2xs border border-slate-200/80">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Subscriptions & Access</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your organization's plans, enterprise access, and billing status.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          </div>
        ) : !hasSubscription ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Package size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-800">No active subscription</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              Explore available plans and enterprise access options to unlock advanced spatial capabilities for your organization.
            </p>
            <Link
              to="/settings/billing"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition"
            >
              <Zap size={16} />
              View Plans
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Current Plan Overview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-2xs border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Package size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{subscription.plan || 'Free Tier'}</h2>
                      <p className="text-xs text-slate-500">Current active plan</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    subscription.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {subscription.status === 'Active' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {subscription.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">Renewal Date</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {subscription.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Building2 size={14} />
                      <span className="text-xs font-medium">Enterprise Access</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {isEnterprise ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 mb-3">Included Features</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-500" /> Advanced 3D Asset Management
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-500" /> Custom Catalog Builder
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-500" /> Sales Intelligence & Analytics
                    </li>
                    {isEnterprise && (
                      <li className="flex items-center gap-2 text-xs font-medium text-slate-900">
                        <CheckCircle2 size={14} className="text-blue-500" /> Enterprise Single Sign-On (SSO)
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar / Upgrade / Support */}
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#0F172A] p-6 text-white shadow-xl">
                <h3 className="text-sm font-bold mb-2">Need more capacity?</h3>
                <p className="text-xs text-slate-300 mb-6">
                  Upgrade your plan to unlock more seats, increased storage, and advanced enterprise capabilities.
                </p>
                <Link
                  to="/settings/billing"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  <Zap size={14} /> View Upgrade Options
                </Link>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-2xs border border-slate-200/80">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Links</h3>
                <div className="space-y-1">
                  <Link to="/settings/billing" className="flex items-center justify-between rounded-xl p-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition">
                    <div className="flex items-center gap-2"><CreditCard size={15} /> Payment Methods</div>
                    <ExternalLink size={14} />
                  </Link>
                  <Link to="/settings/billing" className="flex items-center justify-between rounded-xl p-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition">
                    <div className="flex items-center gap-2"><Calendar size={15} /> Billing History</div>
                    <ExternalLink size={14} />
                  </Link>
                  <a href="mailto:enterprise@i3dion.com" className="flex items-center justify-between rounded-xl p-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition">
                    <div className="flex items-center gap-2"><Building2 size={15} /> Contact Enterprise Sales</div>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
