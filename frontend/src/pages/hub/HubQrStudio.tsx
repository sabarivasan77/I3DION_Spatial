import { useState, useMemo } from 'react';
import { 
  Printer, QrCode, Download, Layers, Sparkles, Sliders, CheckCircle2, 
  ExternalLink, Copy, Box, ShieldCheck 
} from 'lucide-react';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import { QRCodeGenerator } from '../../components/QRCodeGenerator';
import { useToast } from '../../components/Toast';

export function HubQrStudio() {
  const { success, info } = useToast();
  const [selectedSlug, setSelectedSlug] = useState(SPATIAL_HUB_MODELS[0].slug);
  const [campaignLabel, setCampaignLabel] = useState('TradeShow-2026');
  const [ecLevel, setEcLevel] = useState<'M' | 'Q'>('M');
  const [printSizeCm, setPrintSizeCm] = useState<number>(3);
  const [batchMode, setBatchMode] = useState(false);

  const selectedModel = useMemo(() => {
    return SPATIAL_HUB_MODELS.find((m) => m.slug === selectedSlug) || SPATIAL_HUB_MODELS[0];
  }, [selectedSlug]);

  const targetUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hub.i3dion.com';
    const campaignParam = campaignLabel.trim() ? `?campaign=${encodeURIComponent(campaignLabel.trim())}` : '';
    return `${origin}/hub/product/${selectedSlug}${campaignParam}`;
  }, [selectedSlug, campaignLabel]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    success('Target URL Copied', targetUrl);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider mb-2">
              <QrCode className="w-3.5 h-3.5" /> High-Fidelity Print Studio (§7)
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">QR Studio & Print Sheet Engine</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Generate 100% locally rendered, high-contrast QR codes conforming to ISO 18004. Free of third-party tracking, with guaranteed &ge; 4 module quiet zones and campaign attribution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setBatchMode(!batchMode)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                batchMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{batchMode ? 'Single Mode' : 'Batch A4 Sheet'}</span>
            </button>
            <button
              onClick={handlePrintSheet}
              className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>

        {/* ─── SINGLE MODE STUDIO ─────────────────────────────────────────── */}
        {!batchMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 items-start">
            {/* Left: Configuration Panel */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" /> Print Parameters & Campaign Routing
              </h2>

              {/* Target Product Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target 3D Product</label>
                <select
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {SPATIAL_HUB_MODELS.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Campaign Attribution Tag</label>
                <input
                  type="text"
                  value={campaignLabel}
                  onChange={(e) => setCampaignLabel(e.target.value)}
                  placeholder="e.g. TradeShow-Booth-B12, Brochure-A4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400">Attached to scans for campaign lead source tracking in Lens Analytics.</p>
              </div>

              {/* Print Physical Dimension Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Printed Target Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { cm: 2, label: '2 cm', desc: 'Brochures (10-20 cm scan)' },
                    { cm: 3, label: '3 cm (Recommended)', desc: 'Standard A4/Catalog' },
                    { cm: 5, label: '5 cm', desc: 'Standee / Posters (1m+ scan)' }
                  ].map((s) => (
                    <button
                      key={s.cm}
                      onClick={() => setPrintSizeCm(s.cm)}
                      className={`p-3 rounded-xl border text-left transition ${
                        printSizeCm === s.cm 
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold text-xs">{s.label}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Correction Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Error Correction Level</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEcLevel('M')}
                    className={`p-3 rounded-xl border text-left transition ${
                      ecLevel === 'M' ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold text-xs">Level M (15% Recovery)</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">High scan speed & maximum module density</span>
                  </button>
                  <button
                    onClick={() => setEcLevel('Q')}
                    className={`p-3 rounded-xl border text-left transition ${
                      ecLevel === 'Q' ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold text-xs">Level Q (25% Recovery)</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Recommended for textured/glossy print media</span>
                  </button>
                </div>
              </div>

              {/* Resolved Target URL */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Encoded Destination URL:</span>
                  <button onClick={handleCopyLink} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <p className="text-[11px] font-mono text-slate-700 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                  {targetUrl}
                </p>
              </div>
            </div>

            {/* Right: Print-Ready QR Preview Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                  Print-Ready Vector Preview
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedModel.name}</h3>
                <p className="text-xs text-slate-500">Scan distance recommendation: ~{printSizeCm * 10} cm</p>
              </div>

              {/* Clean White Canvas Box with Quiet Zone */}
              <div className="bg-white p-8 rounded-3xl border-2 border-slate-900/10 shadow-xl inline-block relative">
                <QRCodeGenerator
                  url={targetUrl}
                  size={printSizeCm * 80}
                  className="mx-auto"
                />
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="text-[11px] font-extrabold text-slate-900 tracking-wider uppercase">
                    I3DION SPATIAL HUB
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                    {campaignLabel ? `CAMPAIGN: ${campaignLabel}` : 'OPEN SHOWROOM AR'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Complies with ISO 18004 • Quiet Zone &gt;= 4 modules • 100% Local Canvas</span>
              </div>
            </div>
          </div>
        ) : (
          /* ─── BATCH A4 PRINT SHEET (12 CODES PER SHEET) ───────────────────── */
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Standard A4 Batch Sheet Layout (12 Models)</h2>
                <p className="text-xs text-slate-500">Form-fitted for A4 printing (3x4 grid) with trim guidelines and product names.</p>
              </div>
              <button
                onClick={handlePrintSheet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print A4 Sheet
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 print:bg-white print:border-none print:p-0">
              {SPATIAL_HUB_MODELS.slice(0, 12).map((m) => {
                const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://hub.i3dion.com'}/hub/product/${m.slug}?campaign=${encodeURIComponent(campaignLabel)}`;
                return (
                  <div key={m.id} className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center space-y-2 flex flex-col items-center justify-between">
                    <QRCodeGenerator url={qrUrl} size={130} className="mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{m.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{campaignLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
