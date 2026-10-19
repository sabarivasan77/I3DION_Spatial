import { useState, useId, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Send, 
  CheckCircle2, 
  ArrowLeft, 
  MessageSquare, 
  Building2, 
  Clock, 
  ShieldCheck, 
  WifiOff, 
  AlertCircle 
} from 'lucide-react';
import { useHubQuoteStore, QuoteItem } from '../../store/hubQuoteStore';
import { hubApi, HubRfqPayload } from '../../services/hubApi';
import { updateSeoMeta } from '../../utils/seoMeta';

export default function HubRfqPage() {
  const [searchParams] = useSearchParams();

  // Synchronize dynamic RFQ SEO metadata (HUB-13)
  useEffect(() => {
    updateSeoMeta({
      title: 'Commercial RFQ Basket & Quotation Portal',
      description: 'Submit verified commercial Requests for Quotation (RFQ) directly to equipment manufacturers with multi-item baskets and instant WhatsApp dispatch.',
      type: 'website'
    });
  }, []);
  const campaign = searchParams.get('campaign') || 'Direct Hub';
  const shortCode = searchParams.get('ref') || null;
  const qrAttributed = searchParams.get('qr') === 'true' || Boolean(shortCode);

  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearBasket, 
    queueOfflineRfq 
  } = useHubQuoteStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    timeline: '1-3 months',
    targetDelivery: '',
    message: '',
    consent: false,
    hp_token: '',      // Honeypot field 1
    website_trap: ''  // Honeypot field 2
  });

  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    leadId: string;
    rfqId: string;
    itemsCount: number;
    whatsappDeepLink?: string;
    isOfflineQueued?: boolean;
  } | null>(null);

  const honeypotId1 = useId();
  const honeypotId2 = useId();

  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

  const handleNoteChange = (productId: string, note: string) => {
    setItemNotes((prev) => ({ ...prev, [productId]: note }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('Please add at least one industrial 3D model to your quote basket.');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Full name and business email are required.');
      return;
    }

    if (!formData.consent) {
      setErrorMsg('Please accept the consent checkbox to permit contact regarding this RFQ.');
      return;
    }

    // Client-side anti-spam trip check
    if (formData.hp_token || formData.website_trap) {
      setSuccessResult({
        leadId: 'rfq-trap',
        rfqId: 'rfq-trap',
        itemsCount: items.length
      });
      clearBasket();
      return;
    }

    setSubmitting(true);

    const idempotencyKey = `rfq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const rfqPayload: HubRfqPayload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      company: formData.company.trim() || undefined,
      timeline: formData.timeline,
      targetDelivery: formData.targetDelivery.trim() || undefined,
      message: formData.message.trim() || undefined,
      campaign,
      shortCode,
      qrAttributed,
      idempotencyKey,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        modelUrl: item.modelUrl,
        posterUrl: item.posterUrl,
        quantity: item.quantity,
        notes: itemNotes[item.productId] || item.notes || ''
      })),
      consent: {
        consentGiven: true,
        consentText: 'I agree to be contacted by I3DION and verified manufacturers regarding this industrial equipment RFQ.',
        consentTimestamp: new Date().toISOString()
      },
      hp_token: formData.hp_token || undefined,
      website_trap: formData.website_trap || undefined
    };

    // Offline handling
    if (!isOnline) {
      queueOfflineRfq(rfqPayload);
      setSuccessResult({
        leadId: idempotencyKey,
        rfqId: idempotencyKey,
        itemsCount: items.length,
        isOfflineQueued: true
      });
      clearBasket();
      setSubmitting(false);
      return;
    }

    try {
      const res = await hubApi.submitRfq(rfqPayload);
      setSuccessResult({
        leadId: res.leadId,
        rfqId: res.rfqId,
        itemsCount: res.itemsCount,
        whatsappDeepLink: res.whatsappDeepLink
      });
      clearBasket();
    } catch (err: any) {
      // If network failure occurs, fall back to offline queue
      if (err.message && (err.message.includes('network') || err.message.includes('offline') || err.message.includes('fetch'))) {
        queueOfflineRfq(rfqPayload);
        setSuccessResult({
          leadId: idempotencyKey,
          rfqId: idempotencyKey,
          itemsCount: items.length,
          isOfflineQueued: true
        });
        clearBasket();
      } else {
        setErrorMsg(err.message || 'Failed to submit RFQ. Please verify your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const buildDirectWhatsAppLink = () => {
    if (items.length === 0) return '#';
    const summary = items.map((i) => `${i.name} (Qty: ${i.quantity})`).join(', ');
    const text = encodeURIComponent(`Hello I3DION Sales, I would like to inquire directly about: ${summary}.`);
    return `https://wa.me/?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      {/* Top Header / Breadcrumb */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Link
              to="/hub/feed"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft size={16} />
              Back to Catalog Feed
            </Link>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <ShoppingBag size={13} />
                RFQ Basket: {items.reduce((acc, i) => acc + i.quantity, 0)} Items
              </span>
              {qrAttributed && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  QR Attributed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Success Modal / State */}
        {successResult ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl animate-in fade-in zoom-in-95">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-2xl font-black text-slate-900">RFQ Successfully Received!</h1>
            <p className="mt-2 text-xs text-slate-500">
              Reference Inquiry ID: <span className="font-mono font-bold text-slate-800">RFQ-{successResult.rfqId.slice(0, 8).toUpperCase()}</span>
            </p>

            <div className="my-6 rounded-2xl bg-slate-50 p-4 text-left text-xs text-slate-600 space-y-2 border border-slate-100">
              <p className="font-bold text-slate-800">What happens next?</p>
              <p>• Our industrial sales engineering team has been alerted via I3DION Flow.</p>
              <p>• A tailored quote package with technical specs, lead times, and volumetric discounts will be delivered within 24 hours.</p>
              {successResult.isOfflineQueued && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-amber-800">
                  <WifiOff size={16} className="shrink-0" />
                  <p className="text-[11px]">You submitted while offline. Your RFQ has been saved locally and will transmit automatically once connection is re-established.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/hub/feed"
                className="w-full sm:w-auto rounded-xl bg-[#0F172A] px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 transition text-center"
              >
                Continue Browsing Hub
              </Link>

              {successResult.whatsappDeepLink && (
                <a
                  href={successResult.whatsappDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  <MessageSquare size={16} />
                  Connect on WhatsApp
                </a>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Request for Quotation (RFQ)</h1>
              <p className="mt-1 text-xs text-slate-500">
                Consolidate 3D industrial equipment into a unified quotation package and dispatch directly to manufacturer sales engineering.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left Column: Basket Items */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingBag size={16} className="text-blue-600" />
                      Configured Models ({items.length})
                    </h2>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={clearBasket}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <ShoppingBag size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Your Quote Basket is empty</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Browse our verified industrial equipment catalog and add models to initiate an RFQ.
                      </p>
                      <Link
                        to="/hub/feed"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                      >
                        Explore Catalog Feed
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <div key={item.productId} className="py-4 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {item.posterUrl ? (
                                <img
                                  src={item.posterUrl}
                                  alt={item.name}
                                  className="h-14 w-14 rounded-2xl border border-slate-200 object-cover bg-slate-50"
                                />
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                  <Building2 size={20} />
                                </div>
                              )}
                              <div>
                                <h3 className="text-xs font-bold text-slate-900">{item.name}</h3>
                                <p className="text-[11px] text-slate-400">{item.companyName || 'I3DION Verified Model'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Quantity Stepper */}
                              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                  disabled={item.quantity <= 1}
                                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-30"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-slate-800">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-white"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.productId)}
                                title="Remove item"
                                className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Item Custom Specification Note */}
                          <input
                            type="text"
                            placeholder="Add customization note (e.g. 480V variant, stainless hardware, NEMA 4X enclosure)..."
                            value={itemNotes[item.productId] ?? item.notes ?? ''}
                            onChange={(e) => handleNoteChange(item.productId, e.target.value)}
                            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-1.5 text-[11px] text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instant WhatsApp Quick Handoff */}
                {items.length > 0 && (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">Need Immediate Pricing?</h4>
                        <p className="text-[11px] text-emerald-700">Chat directly with a sales engineer via WhatsApp with your basket loaded.</p>
                      </div>
                    </div>
                    <a
                      href={buildDirectWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      WhatsApp Us
                    </a>
                  </div>
                )}
              </div>

              {/* Right Column: RFQ Form */}
              <div className="lg:col-span-5">
                <form
                  onSubmit={handleSubmit}
                  className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4"
                >
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Send size={15} className="text-blue-600" />
                    Buyer & Project Details
                  </h2>

                  {/* Honeypot Fields (Invisible to humans, traps automated scrapers) */}
                  <div aria-hidden="true" style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}>
                    <label htmlFor={honeypotId1}>Leave blank</label>
                    <input
                      id={honeypotId1}
                      type="text"
                      name="hp_token"
                      tabIndex={-1}
                      value={formData.hp_token}
                      onChange={(e) => setFormData({ ...formData, hp_token: e.target.value })}
                      autoComplete="off"
                    />
                    <label htmlFor={honeypotId2}>Website URL</label>
                    <input
                      id={honeypotId2}
                      type="text"
                      name="website_trap"
                      tabIndex={-1}
                      value={formData.website_trap}
                      onChange={(e) => setFormData({ ...formData, website_trap: e.target.value })}
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Work Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@industrial-corp.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="Acme Industrial Ltd."
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        Project Timeline
                      </label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Immediate (< 30 days)">Immediate (&lt; 30 days)</option>
                        <option value="1-3 months">1-3 Months</option>
                        <option value="3-6 months">3-6 Months</option>
                        <option value="Budgetary / Exploratory">Budgetary / Exploratory</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Delivery Destination
                      </label>
                      <input
                        type="text"
                        placeholder="City, State / Country"
                        value={formData.targetDelivery}
                        onChange={(e) => setFormData({ ...formData, targetDelivery: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Project Notes & Specifications
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Detail project constraints, environmental ratings, required certifications (UL, CE, ASME), or target installation date..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="rfq-consent"
                      required
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="rfq-consent" className="text-[11px] text-slate-500 leading-tight">
                      I agree to be contacted by I3DION and verified manufacturers regarding quotation and engineering details for this RFQ.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || items.length === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0F172A] py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing RFQ...
                      </span>
                    ) : (
                      <>
                        <Send size={14} />
                        Submit Request for Quotation
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Protected by I3DION Enterprise Lead Integrity</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
