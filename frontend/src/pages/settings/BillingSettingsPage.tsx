import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  fetchSaaSPlans,
  fetchSaaSUsage,
  initiateCheckoutOrder,
  verifyCheckoutPayment,
  SaaSPlan,
  SaaSUsageAndPlan
} from '../../services/api';
import { CreditCard, Check, AlertCircle, ShieldCheck, Zap } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const BillingSettingsPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [usageData, setUsageData] = useState<SaaSUsageAndPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetchSaaSPlans(token),
      fetchSaaSUsage(token)
    ])
      .then(([p, u]) => {
        setPlans(p);
        setUsageData(u);
      })
      .catch((err) => setMessage({ type: 'error', text: err.message || 'Failed to load billing status' }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSelectPlan = async (plan: SaaSPlan) => {
    if (!token) return;
    setProcessingPlan(plan.id);
    setMessage(null);

    try {
      const checkoutRes = await initiateCheckoutOrder(token, plan.id, billingCycle);

      if (checkoutRes.isFree) {
        setMessage({ type: 'success', text: 'Switched to Free plan successfully!' });
        const updatedUsage = await fetchSaaSUsage(token);
        setUsageData(updatedUsage);
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
            const updatedUsage = await fetchSaaSUsage(token);
            setUsageData(updatedUsage);
          } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Payment verification failed' });
          } finally {
            setProcessingPlan(null);
          }
        },
        prefill: {
          email: user?.email ?? '',
          name: user?.name ?? ''
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentPlanId = usageData?.plan.id || 'FREE';
  const limits = usageData?.plan.limits;
  const usage = usageData?.usage;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-400" /> Subscription & Billing
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your organization plan, resource quotas, and billing settings.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Current Plan & Usage Summary */}
      {usageData && limits && usage && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">Current Plan</span>
              <h2 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
                {usageData.plan.name}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {usageData.plan.status.toUpperCase()}
                </span>
              </h2>
            </div>
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Yearly</span>
                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] rounded-full font-bold">20% OFF</span>
              </button>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Products</span>
                <span className="font-semibold text-slate-200">{usage.productsCount} / {limits.maxProducts}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (usage.productsCount / limits.maxProducts) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Catalogs</span>
                <span className="font-semibold text-slate-200">{usage.catalogsCount} / {limits.maxCatalogs}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (usage.catalogsCount / limits.maxCatalogs) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Team Members</span>
                <span className="font-semibold text-slate-200">{usage.teamMembersCount} / {limits.maxTeamMembers}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (usage.teamMembersCount / limits.maxTeamMembers) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlanId;
          const price = billingCycle === 'yearly' ? Math.round(p.price_yearly_inr / 12) : p.price_monthly_inr;

          return (
            <div
              key={p.id}
              className={`bg-slate-900 rounded-2xl p-6 border flex flex-col justify-between relative shadow-lg ${
                isCurrent ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {p.id === 'BUSINESS' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-100">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description}</p>

                <div className="my-5">
                  <span className="text-3xl font-extrabold text-slate-100">₹{price.toLocaleString()}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>{p.max_products}</strong> Products</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>{p.max_catalogs}</strong> Catalogs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>{p.max_team_members}</strong> Team Members</span>
                  </li>
                  {Object.entries(p.features || {}).map(([key, enabled]) => (
                    enabled ? (
                      <li key={key} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="capitalize">{key.replace('_', ' ')}</span>
                      </li>
                    ) : null
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  disabled={isCurrent || processingPlan === p.id}
                  onClick={() => handleSelectPlan(p)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {processingPlan === p.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : isCurrent ? (
                    <span>Current Plan</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Upgrade to {p.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
