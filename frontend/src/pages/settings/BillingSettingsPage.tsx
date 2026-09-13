import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  fetchSaaSPlans,
  fetchSaaSUsage,
  fetchBillingInfo,
  updateBillingInfo,
  fetchBillingInvoices,
  initiateCheckoutOrder,
  verifyCheckoutPayment,
  SaaSPlan,
  SaaSUsageAndPlan,
  OrganizationBillingInfo,
  BillingInvoice
} from '../../services/api';
import { useLicenseStore, LicenseTier } from '../../store/licenseStore';
import {
  CreditCard,
  Check,
  AlertCircle,
  ShieldCheck,
  Zap,
  Building,
  FileText,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Save,
  ArrowUpRight
} from 'lucide-react';
import { EnterpriseInquiryModal } from '../../components/billing/EnterpriseInquiryModal';
import { PlatformAdminEnterpriseModal } from '../../components/billing/PlatformAdminEnterpriseModal';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const BillingSettingsPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [usageData, setUsageData] = useState<SaaSUsageAndPlan | null>(null);
  const [billingInfo, setBillingInfo] = useState<OrganizationBillingInfo>({
    billing_name: '',
    billing_email: '',
    phone: '',
    tax_id: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [showPlatformAdminModal, setShowPlatformAdminModal] = useState(false);

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [p, u, info, invs] = await Promise.all([
        fetchSaaSPlans(token),
        fetchSaaSUsage(token),
        fetchBillingInfo(token).catch(() => ({
          billing_name: user?.name || '',
          billing_email: user?.email || '',
          country: 'India'
        })),
        fetchBillingInvoices(token).catch(() => [])
      ]);

      setPlans(p || []);
      setUsageData(u || null);
      setBillingInfo(info || { billing_name: '', billing_email: '', country: 'India' });
      setInvoices(invs || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load billing status.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleSelectPlan = async (plan: SaaSPlan) => {
    if (!token) return;

    if (plan.id === 'ENTERPRISE') {
      setShowEnterpriseModal(true);
      return;
    }

    setProcessingPlan(plan.id);
    setMessage(null);

    try {
      const checkoutRes = await initiateCheckoutOrder(token, plan.id, billingCycle);

      if (checkoutRes.isFree) {
        setMessage({ type: 'success', text: 'Switched to Free plan successfully!' });
        await loadData();
        setProcessingPlan(null);
        return;
      }

      // Open Razorpay Modal
      const razorpayKey = checkoutRes.keyId || checkoutRes.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TaoxOjjvfv3Z3U';
      const orderId = checkoutRes.orderId || checkoutRes.order_id;

      const options: any = {
        key: razorpayKey,
        amount: checkoutRes.amount,
        currency: checkoutRes.currency || 'INR',
        name: 'I3DION Spatial',
        description: `Upgrade to ${plan.name} (${billingCycle})`,
        handler: async (response: any) => {
          try {
            await verifyCheckoutPayment(token, {
              ...response,
              planId: plan.id,
              billingCycle
            });
            setMessage({ type: 'success', text: `Successfully upgraded to ${plan.name}!` });
            await loadData();
          } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Payment verification failed' });
          } finally {
            setProcessingPlan(null);
          }
        },
        prefill: {
          email: billingInfo.billing_email || user?.email || '',
          name: billingInfo.billing_name || user?.name || ''
        },
        theme: { color: '#2563eb' }
      };

      if (orderId && typeof orderId === 'string' && !orderId.startsWith('order_mock_')) {
        options.order_id = orderId;
      }

      const openModal = () => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      };

      if (window.Razorpay) {
        openModal();
      } else {
        // Dynamically load script if missing
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => openModal();
        script.onerror = () => setMessage({ type: 'error', text: 'Razorpay SDK failed to load.' });
        document.body.appendChild(script);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Checkout initiation failed' });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleSaveBillingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingInfo(true);
    setMessage(null);

    try {
      await updateBillingInfo(token, billingInfo);
      setMessage({ type: 'success', text: 'Billing information updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update billing information' });
    } finally {
      setSavingInfo(false);
    }
  };

  const formatLimit = (value: number) => (value >= 999999 ? 'Unlimited' : value.toLocaleString());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const currentPlanId = usageData?.plan.id || 'FREE';
  const limits = usageData?.plan.limits;
  const usage = usageData?.usage;
  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6 md:p-10 text-slate-900 font-sans antialiased">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200/60 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shadow-inner border border-blue-100">
              <CreditCard className="w-8 h-8" />
            </div>
            Subscription &amp; Billing
          </h1>
          <p className="mt-2 text-base text-slate-500 font-medium">
            Manage your organization's plan, resource quotas, and billing settings in one place.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowPlatformAdminModal(true)}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-2xl transition-all shadow-[0_4px_14px_0_rgba(15,23,42,0.2)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Platform Admin Console</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === 'success'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 shadow-sm'
              : 'bg-red-50/80 border-red-200 text-red-800 shadow-sm'
          }`}
        >
          {message.type === 'success' ? <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* 3-TIER ECOSYSTEM LICENSE ENTITLEMENT BANNER */}
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-blue-600 block mb-1">
              Ecosystem License Tier
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Active Tier: {useLicenseStore((s) => s.currentTier)}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Application access across <b>Spatial Hub</b>, <b>Spatial Vault</b>, <b>Omni Studio</b>, <b>Spatial Engine</b>, and <b>Spatial Lens</b> is governed by your organization license tier.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {(['Basic', 'Professional', 'Enterprise'] as LicenseTier[]).map((tier) => {
              const currentTier = useLicenseStore.getState().currentTier;
              const isSelected = currentTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => {
                    useLicenseStore.getState().setLicenseTier(tier);
                    setMessage({ type: 'success', text: `Switched organization to ${tier} License Tier.` });
                  }}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border shadow-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {tier} Tier
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CURRENT PLAN & USAGE SUMMARY CARD */}
      {usageData && limits && usage && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
          <div className="absolute top-0 right-0 p-32 bg-blue-50/40 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 p-32 bg-indigo-50/40 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-100">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-blue-600/80 mb-1 block">Current Subscription</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-4">
                {usageData.plan.name}
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 uppercase tracking-widest shadow-sm">
                  {usageData.plan.status}
                </span>
              </h2>
            </div>

            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner backdrop-blur-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                  billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Yearly</span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2 py-0.5 text-[10px] rounded-full font-extrabold shadow-sm">20% OFF</span>
              </button>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {[
              { label: 'Products', count: usage.productsCount, max: limits.maxProducts, color: 'bg-blue-600' },
              { label: 'Catalogs', count: usage.catalogsCount, max: limits.maxCatalogs, color: 'bg-indigo-600' },
              { label: '3D Models', count: usage.modelsCount, max: limits.max3dModels, color: 'bg-purple-600' },
              { label: 'Team Members', count: usage.teamMembersCount, max: limits.maxTeamMembers, color: 'bg-emerald-600' }
            ].map((stat) => (
              <div key={stat.label} className="bg-white/80 p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{stat.label}</span>
                  <span className="font-extrabold text-slate-900">
                    {stat.count} <span className="text-slate-400 font-semibold text-xs">/ {formatLimit(stat.max)}</span>
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-200/50 inset-ring">
                  <div
                    className={`h-full ${stat.color} rounded-full transition-all duration-700 ease-out`}
                    style={{
                      width: `${stat.max >= 999999 ? 100 : Math.min(100, (stat.count / stat.max) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AVAILABLE PLANS GRID */}
      <div className="pt-4">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500/20" /> Available Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((p) => {
            const isCurrent = p.id === currentPlanId;
            const isEnterprise = p.id === 'ENTERPRISE';
            const price = isEnterprise
              ? null
              : billingCycle === 'yearly'
              ? Math.round(p.price_yearly_inr / 12)
              : p.price_monthly_inr;

            return (
              <div
                key={p.id}
                className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1 ${
                  isEnterprise
                    ? 'bg-slate-950 text-white border border-slate-800 shadow-2xl hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]'
                    : isCurrent
                    ? 'bg-white border-2 border-blue-600 shadow-[0_8px_30px_rgb(59,130,246,0.12)]'
                    : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl'
                }`}
              >
                {p.id === 'BUSINESS' && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                )}

                {isEnterprise && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[11px] font-extrabold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Custom Plan
                  </div>
                )}

                <div>
                  <h3 className={`text-2xl font-extrabold ${isEnterprise ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                  <p className={`text-sm mt-2 min-h-[40px] font-medium leading-relaxed ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>{p.description}</p>

                  <div className="my-6">
                    {isEnterprise ? (
                      <div>
                        <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Custom</span>
                        <span className="text-sm text-slate-400 block mt-1 font-semibold tracking-wide">Negotiated Pricing</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">₹{price?.toLocaleString()}</span>
                        <span className="text-sm text-slate-500 font-bold">/mo</span>
                      </div>
                    )}
                  </div>

                  <ul className={`space-y-3.5 text-sm font-medium border-t pt-6 ${isEnterprise ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
                    <li className="flex items-center gap-3">
                      <div className={`p-1 rounded-full ${isEnterprise ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                      </div>
                      <span><strong className={isEnterprise ? "text-white" : "text-slate-900"}>{formatLimit(p.max_products)}</strong> Products</span>
                    </li>
                    <li className="flex items-center gap-3">
                       <div className={`p-1 rounded-full ${isEnterprise ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                      </div>
                      <span><strong className={isEnterprise ? "text-white" : "text-slate-900"}>{formatLimit(p.max_catalogs)}</strong> Catalogs</span>
                    </li>
                    <li className="flex items-center gap-3">
                       <div className={`p-1 rounded-full ${isEnterprise ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                      </div>
                      <span><strong className={isEnterprise ? "text-white" : "text-slate-900"}>{formatLimit(p.max_team_members)}</strong> Team Members</span>
                    </li>
                    {Object.entries(p.features || {}).map(([key, enabled]) =>
                      enabled ? (
                        <li key={key} className="flex items-center gap-3">
                           <div className={`p-1 rounded-full ${isEnterprise ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                          </div>
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        </li>
                      ) : null
                    )}
                  </ul>
                </div>

                <div className={`mt-8 pt-6 border-t ${isEnterprise ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button
                    disabled={isCurrent || processingPlan === p.id}
                    onClick={() => handleSelectPlan(p)}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${
                      isEnterprise
                        ? 'bg-white hover:bg-slate-100 text-slate-900 shadow-lg hover:shadow-xl'
                        : isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-blue-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    {processingPlan === p.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                    ) : isCurrent ? (
                      <span>Current Plan</span>
                    ) : isEnterprise ? (
                      <span>Contact Sales</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Choose {p.name}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BILLING HISTORY */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
             <FileText className="w-5 h-5" />
          </div>
          Billing &amp; Invoice History
        </h2>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm bg-slate-50/50 rounded-2xl border border-slate-200 border-dashed font-medium">
            No invoices yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4 uppercase tracking-wider text-xs">Date</th>
                  <th className="p-4 uppercase tracking-wider text-xs">Invoice Number</th>
                  <th className="p-4 uppercase tracking-wider text-xs">Plan</th>
                  <th className="p-4 uppercase tracking-wider text-xs">Amount</th>
                  <th className="p-4 uppercase tracking-wider text-xs">Status</th>
                  <th className="p-4 uppercase tracking-wider text-xs text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 font-medium">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-4 font-semibold text-slate-600">{inv.plan_id}</td>
                    <td className="p-4 font-extrabold text-slate-900">₹{inv.amount_inr.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-[11px] uppercase font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200 shadow-sm">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-bold transition-colors inline-flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                        <span>View</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORGANIZATION BILLING INFORMATION FORM */}
      <form onSubmit={handleSaveBillingInfo} className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
               <Building className="w-5 h-5" />
             </div>
            Organization Billing Information
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Official organization details used for invoices, tax receipts, and payment notices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <label className="text-slate-900 font-bold flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" /> Billing Business Name
            </label>
            <input
              type="text"
              required
              value={billingInfo.billing_name || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, billing_name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-900 font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" /> Billing Email (Invoices)
            </label>
            <input
              type="email"
              required
              value={billingInfo.billing_email || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, billing_email: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-900 font-bold flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" /> Phone
            </label>
            <input
              type="tel"
              value={billingInfo.phone || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-900 font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Tax ID / GSTIN
            </label>
            <input
              type="text"
              value={billingInfo.tax_id || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, tax_id: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
              placeholder="e.g. 29AAAAA0000A1Z5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="md:col-span-2 space-y-2">
            <label className="text-slate-900 font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" /> Billing Address
            </label>
            <input
              type="text"
              value={billingInfo.address_line1 || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, address_line1: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
              placeholder="Street address, building, suite"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-900 font-bold">City</label>
            <input
              type="text"
              value={billingInfo.city || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-900 font-bold">State / Province</label>
            <input
              type="text"
              value={billingInfo.state || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-900 font-bold">Postal Code</label>
            <input
              type="text"
              value={billingInfo.postal_code || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, postal_code: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-900 font-bold">Country</label>
            <input
              type="text"
              value={billingInfo.country || 'India'}
              onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={savingInfo}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            {savingInfo ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Billing Information</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Enterprise Inquiry Modal */}
      <EnterpriseInquiryModal
        isOpen={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
      />

      {/* Platform Admin Enterprise Modal */}
      <PlatformAdminEnterpriseModal
        isOpen={showPlatformAdminModal}
        onClose={() => setShowPlatformAdminModal(false)}
      />
    </div>
  );
};
