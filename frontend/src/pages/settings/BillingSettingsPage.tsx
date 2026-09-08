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
      const options = {
        key: checkoutRes.keyId,
        amount: checkoutRes.amount,
        currency: checkoutRes.currency,
        name: 'I3DION Spatial',
        description: `Upgrade to ${plan.name} (${billingCycle})`,
        order_id: checkoutRes.orderId,
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

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setMessage({ type: 'error', text: 'Razorpay SDK failed to load. Please refresh and try again.' });
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
    <div className="max-w-6xl mx-auto space-y-8 p-6 text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-blue-600" /> Subscription &amp; Billing
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Manage your organization plan, resource quotas, and billing settings.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowPlatformAdminModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Platform Admin Console</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* CURRENT PLAN & USAGE SUMMARY CARD */}
      {usageData && limits && usage && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-600">Current Subscription</span>
              <h2 className="text-2xl font-bold text-slate-950 mt-1 flex items-center gap-3">
                {usageData.plan.name}
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                  {usageData.plan.status}
                </span>
              </h2>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Yearly</span>
                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] rounded-full font-bold">20% OFF</span>
              </button>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-slate-600">Products</span>
                <span className="font-bold text-slate-950">
                  {usage.productsCount} / {formatLimit(limits.maxProducts)}
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${limits.maxProducts >= 999999 ? 100 : Math.min(100, (usage.productsCount / limits.maxProducts) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-slate-600">Catalogs</span>
                <span className="font-bold text-slate-950">
                  {usage.catalogsCount} / {formatLimit(limits.maxCatalogs)}
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${limits.maxCatalogs >= 999999 ? 100 : Math.min(100, (usage.catalogsCount / limits.maxCatalogs) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-slate-600">3D Models</span>
                <span className="font-bold text-slate-950">
                  {usage.modelsCount} / {formatLimit(limits.max3dModels)}
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${limits.max3dModels >= 999999 ? 100 : Math.min(100, (usage.modelsCount / limits.max3dModels) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-slate-600">Team Members</span>
                <span className="font-bold text-slate-950">
                  {usage.teamMembersCount} / {formatLimit(limits.maxTeamMembers)}
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${limits.maxTeamMembers >= 999999 ? 100 : Math.min(100, (usage.teamMembersCount / limits.maxTeamMembers) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AVAILABLE PLANS GRID */}
      <div>
        <h2 className="text-xl font-bold text-slate-950 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> Available Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch">
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
                className={`rounded-2xl p-5 border flex flex-col justify-between relative transition-all duration-200 ${
                  isEnterprise
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-indigo-900/60 shadow-xl'
                    : isCurrent
                    ? 'bg-white border-blue-600 ring-2 ring-blue-600/20 card-shadow'
                    : 'bg-white border-slate-200 hover:border-slate-300 card-shadow'
                }`}
              >
                {p.id === 'BUSINESS' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}

                {isEnterprise && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Custom Plan
                  </div>
                )}

                <div>
                  <h3 className={`text-lg font-bold ${isEnterprise ? 'text-white' : 'text-slate-950'}`}>{p.name}</h3>
                  <p className={`text-xs mt-1 min-h-[36px] line-clamp-2 ${isEnterprise ? 'text-slate-300' : 'text-slate-500'}`}>{p.description}</p>

                  <div className="my-4">
                    {isEnterprise ? (
                      <div>
                        <span className="text-2xl font-extrabold text-indigo-300">Custom</span>
                        <span className="text-xs text-slate-400 block mt-0.5 font-medium">Negotiated Pricing</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-extrabold text-slate-950">₹{price?.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-medium"> / month</span>
                      </div>
                    )}
                  </div>

                  <ul className={`space-y-2.5 text-xs border-t pt-4 ${isEnterprise ? 'border-slate-800 text-slate-200' : 'border-slate-100 text-slate-700'}`}>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>{formatLimit(p.max_products)}</strong> Products</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>{formatLimit(p.max_catalogs)}</strong> Catalogs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>{formatLimit(p.max_team_members)}</strong> Team Members</span>
                    </li>
                    {Object.entries(p.features || {}).map(([key, enabled]) =>
                      enabled ? (
                        <li key={key} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        </li>
                      ) : null
                    )}
                  </ul>
                </div>

                <div className={`mt-6 pt-4 border-t ${isEnterprise ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button
                    disabled={isCurrent || processingPlan === p.id}
                    onClick={() => handleSelectPlan(p)}
                    className={`w-full py-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                      isEnterprise
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md'
                        : isCurrent
                        ? 'bg-slate-100 text-slate-500 cursor-default font-bold'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {processingPlan === p.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : isCurrent ? (
                      <span>Current Plan</span>
                    ) : isEnterprise ? (
                      <span>Contact Sales</span>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow space-y-4">
        <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Billing &amp; Invoice History
        </h2>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
            No invoices yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold text-slate-950">{inv.invoice_number}</td>
                    <td className="p-3 font-medium">{inv.plan_id}</td>
                    <td className="p-3 font-semibold">₹{inv.amount_inr.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-blue-600 hover:text-blue-700 font-semibold transition inline-flex items-center gap-1">
                        <span>View Invoice</span>
                        <ArrowUpRight className="w-3 h-3" />
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
      <form onSubmit={handleSaveBillingInfo} className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" /> Organization Billing Information
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Official organization details used for invoices, tax receipts, and payment notices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Billing Business Name
            </label>
            <input
              type="text"
              required
              value={billingInfo.billing_name || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, billing_name: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Billing Email (Invoices)
            </label>
            <input
              type="email"
              required
              value={billingInfo.billing_email || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, billing_email: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
            </label>
            <input
              type="tel"
              value={billingInfo.phone || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Tax ID / GSTIN
            </label>
            <input
              type="text"
              value={billingInfo.tax_id || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, tax_id: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              placeholder="e.g. 29AAAAA0000A1Z5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-700 mb-1.5 font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Billing Address
            </label>
            <input
              type="text"
              value={billingInfo.address_line1 || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, address_line1: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              placeholder="Street address, building, suite"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold">City</label>
            <input
              type="text"
              value={billingInfo.city || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold">State / Province</label>
            <input
              type="text"
              value={billingInfo.state || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold">Postal Code</label>
            <input
              type="text"
              value={billingInfo.postal_code || ''}
              onChange={(e) => setBillingInfo({ ...billingInfo, postal_code: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold">Country</label>
            <input
              type="text"
              value={billingInfo.country || 'India'}
              onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingInfo}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            {savingInfo ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
