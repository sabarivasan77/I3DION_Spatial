import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Check, Plus, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  fetchPlatformEnterpriseRequests,
  createPlatformEnterpriseOffer,
  activatePlatformEnterpriseOffer
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface PlatformAdminEnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformAdminEnterpriseModal: React.FC<PlatformAdminEnterpriseModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Custom Offer
  const [offerForm, setOfferForm] = useState({
    customPriceInr: 12000,
    billingInterval: 'monthly',
    productLimit: 500,
    modelLimit: 500,
    catalogLimit: 100,
    teamLimit: 50,
    storageLimitGb: 500,
    customBranding: true,
    customDomain: true,
    prioritySupport: true,
    customIntegrations: true,
    notes: ''
  });

  const loadRequests = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetchPlatformEnterpriseRequests(token);
      setRequests(res.requests || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load Enterprise requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedReq) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const offerRes = await createPlatformEnterpriseOffer(token, {
        organization_id: selectedReq.organization_id,
        request_id: selectedReq.id,
        custom_price_inr: Number(offerForm.customPriceInr),
        billing_interval: offerForm.billingInterval,
        product_limit: Number(offerForm.productLimit),
        model_limit: Number(offerForm.modelLimit),
        catalog_limit: Number(offerForm.catalogLimit),
        team_limit: Number(offerForm.teamLimit),
        storage_limit_bytes: Number(offerForm.storageLimitGb) * 1024 * 1024 * 1024,
        feature_entitlements: {
          ar_views: true,
          qr_codes: true,
          lead_management: true,
          advanced_analytics: true,
          custom_branding: offerForm.customBranding,
          custom_domain: offerForm.customDomain,
          priority_support: offerForm.prioritySupport,
          custom_integrations: offerForm.customIntegrations
        },
        notes: offerForm.notes
      });

      // Activate offer immediately
      await activatePlatformEnterpriseOffer(token, offerRes.offer.id);

      setMessage({ type: 'success', text: `Enterprise Plan activated for ${selectedReq.company_name}!` });
      setSelectedReq(null);
      await loadRequests();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create Enterprise offer' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">I3DION Platform Admin — Enterprise Console</h2>
            <p className="text-xs text-slate-400">Configure custom limits &amp; commercial terms for Enterprise organizations.</p>
          </div>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {selectedReq ? (
          <form onSubmit={handleCreateAndActivate} className="space-y-6 border-t border-slate-800 pt-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-blue-400 font-semibold uppercase">Configuring Offer For</span>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-400" /> {selectedReq.company_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                &larr; Back to Requests
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Negotiated Price (₹ / month)</label>
                <input
                  type="number"
                  required
                  value={offerForm.customPriceInr}
                  onChange={(e) => setOfferForm({ ...offerForm, customPriceInr: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Billing Interval</label>
                <select
                  value={offerForm.billingInterval}
                  onChange={(e) => setOfferForm({ ...offerForm, billingInterval: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Products Cap</label>
                <input
                  type="number"
                  value={offerForm.productLimit}
                  onChange={(e) => setOfferForm({ ...offerForm, productLimit: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">3D Models Cap</label>
                <input
                  type="number"
                  value={offerForm.modelLimit}
                  onChange={(e) => setOfferForm({ ...offerForm, modelLimit: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Catalogs Cap</label>
                <input
                  type="number"
                  value={offerForm.catalogLimit}
                  onChange={(e) => setOfferForm({ ...offerForm, catalogLimit: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Team Limit</label>
                <input
                  type="number"
                  value={offerForm.teamLimit}
                  onChange={(e) => setOfferForm({ ...offerForm, teamLimit: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Storage (GB)</label>
                <input
                  type="number"
                  value={offerForm.storageLimitGb}
                  onChange={(e) => setOfferForm({ ...offerForm, storageLimitGb: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-300 font-medium">Feature Entitlements</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'customBranding', label: 'Custom Branding' },
                  { key: 'customDomain', label: 'Custom Domain' },
                  { key: 'prioritySupport', label: 'Priority Support' },
                  { key: 'customIntegrations', label: 'Custom Integrations' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={(offerForm as any)[item.key]}
                      onChange={(e) => setOfferForm({ ...offerForm, [item.key]: e.target.checked })}
                      className="rounded border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Activate Custom Enterprise Plan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Enterprise Inquiries</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-800">
                No Enterprise requests recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden text-xs">
                {requests.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-950/50 hover:bg-slate-950 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{r.company_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1">
                        Contact: <strong>{r.contact_name}</strong> ({r.work_email}) &bull; Products: {r.expected_product_count} &bull; Team: {r.team_size}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedReq(r);
                        setOfferForm((prev) => ({
                          ...prev,
                          productLimit: r.expected_product_count || 500,
                          catalogLimit: r.expected_catalog_usage || 100,
                          teamLimit: r.team_size || 50
                        }));
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shrink-0 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Prepare Custom Offer</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
