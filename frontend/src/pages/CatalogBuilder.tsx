import { useEffect, useState, useMemo } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { BookOpen, Download, Plus, CheckCircle2, Box, Layers, Briefcase, ArrowRight, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { Button, Card, PageHeader, SectionTitle } from '../components/ui';
import { api, CatalogRecord } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { CatalogPDF } from '../components/pdf/Templates';

export function CatalogBuilderPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { success, error: showError } = useToast();
  const baseUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;

  const [products, setProducts] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [template, setTemplate] = useState<'IndustrialClassic' | 'ModernShowcase' | 'SalesBrochure'>('IndustrialClassic');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.listProducts(token).catch(() => []),
      api.listCatalogs(token).catch(() => []),
    ]).then(([p, c]) => {
      setProducts(p as any[]);
      setCatalogs(c as CatalogRecord[]);
      setLoading(false);
    });
  }, [token]);

  const toggleProduct = async (product: any) => {
    const exists = selectedProducts.find(p => p.id === product.id);
    if (exists) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      // Generate preview QR code immediately so it shows up in the live preview
      const targetUrl = `${baseUrl}/product/${product.slug}?source=catalog_qr&catalog=preview`;
      const qrDataUri = await QRCode.toDataURL(targetUrl, { width: 400, margin: 1 });
      setSelectedProducts(prev => [...prev, { ...product, _catalogQrDataUri: qrDataUri }]);
    }
  };

  const catalogData = useMemo(() => ({
    name: name || 'Untitled Catalog',
    description,
    companyName: 'I3DION Spatial',
    date: new Date().toLocaleDateString(),
    template,
    products: selectedProducts.map(p => ({
      name: p.name,
      description: p.description,
      imageUrl: p.image_url,
      specs: p.specs,
      qrUrl: p._catalogQrDataUri || null,
      url: `${baseUrl}/product/${p.slug}?source=catalog`
    }))
  }), [name, description, user, template, selectedProducts]);

  const handleGenerate = async () => {
    if (!name.trim()) return showError('Error', 'Catalog name is required');
    if (selectedProducts.length === 0) return showError('Error', 'Select at least one product');
    
    setIsGenerating(true);
    try {
      // 1. Create Catalog Record in DB
      const catalogRecord = await api.createCatalog(token!, {
        name,
        description,
        status: 'Published',
        productIds: selectedProducts.map(p => p.id)
      }) as CatalogRecord;

      // 2. Refresh custom QR codes with actual catalog ID before rendering final PDF
      const enrichedProducts = await Promise.all(selectedProducts.map(async (p) => {
        const targetUrl = `${baseUrl}/product/${p.slug}?source=catalog_qr&catalog=${catalogRecord.id}`;
        const qrDataUri = await QRCode.toDataURL(targetUrl, { width: 400, margin: 1 });
        return { ...p, _catalogQrDataUri: qrDataUri };
      }));
      setSelectedProducts(enrichedProducts);

      // Force a short delay so the useMemo re-evaluates the catalogData with the new QRs
      await new Promise(r => setTimeout(r, 100));

      // 3. Generate PDF Blob Client-Side
      const blob = await pdf(<CatalogPDF data={{
        name: name || 'Untitled Catalog',
        description,
        companyName: 'I3DION Spatial',
        date: new Date().toLocaleDateString(),
        template,
        products: enrichedProducts.map(p => ({
          name: p.name,
          description: p.description,
          imageUrl: p.image_url,
          specs: p.specs,
          qrUrl: p._catalogQrDataUri,
          url: `${baseUrl}/product/${p.slug}?source=catalog`
        }))
      }} />).toBlob();

      // 4. Upload PDF to Backend
      const { pdf_url } = await api.uploadCatalogPdf(token!, catalogRecord.id, blob, `${name.replace(/\s+/g, '_')}.pdf`);
      
      success('Catalog Generated & Uploaded!');
      
      setCatalogs([ Object.assign({}, catalogRecord, { pdf_url }), ...catalogs ]);
      
      // Reset form
      setName('');
      setDescription('');
      setSelectedProducts([]);
      setShowPreview(false);
    } catch (err: any) {
      showError('Failed to generate catalog', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Catalog Builder" 
        eyebrow="Generate professional, interactive PDF catalogs with embedded AR and QR flows."
        action={
          <Button onClick={() => setShowPreview(!showPreview)} variant="secondary">
            <BookOpen size={18} /> {showPreview ? 'Edit Details' : 'Preview Document'}
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Side: Builder Form */}
        <div className={`space-y-6 ${showPreview ? 'hidden lg:block' : ''}`}>
          <Card className="p-6">
            <SectionTitle title="Catalog Details" />
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Catalog Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. 2026 Industrial Systems Catalog"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Description (Optional)</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="A brief overview for the cover page..."
                  className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle title="Template Style" />
            <div className="mt-6 grid grid-cols-3 gap-6">
              {[
                {
                  id: 'IndustrialClassic',
                  name: 'Tech Blueprint',
                  emoji: '⚙️',
                  description: 'A highly technical layout focused on exact specifications, robust engineering data, and structural clarity.',
                  badge: 'ENGINEERING',
                  features: ['Precise Grids', 'Data Heavy', 'Technical Specs'],
                  icon: Layers,
                  gradient: 'from-slate-900 via-slate-800 to-slate-900',
                  accentText: 'text-emerald-400',
                  accentBg: 'bg-emerald-500/20',
                  accentBorder: 'border-emerald-500/50',
                  shadowHover: 'group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]',
                  activeRing: 'ring-2 ring-emerald-500 shadow-[0_0_40px_-5px_rgba(16,185,129,0.5)]',
                  buttonActive: 'bg-gradient-to-r from-emerald-600 to-emerald-400 text-white shadow-emerald-500/25',
                },
                {
                  id: 'ModernShowcase',
                  name: 'Creative Showcase',
                  emoji: '✨',
                  description: 'A visually stunning, fun and vibrant presentation tailored to wow your clients with full bleed AR models.',
                  badge: 'FUN & MASSIVE',
                  features: ['Vibrant Colors', 'Minimal UI', 'Spatial Ready'],
                  icon: Sparkles,
                  gradient: 'from-purple-900 via-indigo-900 to-purple-900',
                  accentText: 'text-pink-400',
                  accentBg: 'bg-pink-500/20',
                  accentBorder: 'border-pink-500/50',
                  shadowHover: 'group-hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.5)]',
                  activeRing: 'ring-2 ring-pink-500 shadow-[0_0_40px_-5px_rgba(236,72,153,0.5)]',
                  buttonActive: 'bg-gradient-to-r from-pink-600 to-pink-400 text-white shadow-pink-500/25',
                },
                {
                  id: 'SalesBrochure',
                  name: 'Corporate Elite',
                  emoji: '💼',
                  description: 'Highly professional and polished. Optimized for enterprise sales, clear CTAs, and executive summaries.',
                  badge: 'PROFESSIONAL',
                  features: ['Executive Style', 'Lead Capture', 'Conversion'],
                  icon: Briefcase,
                  gradient: 'from-blue-950 via-slate-900 to-blue-950',
                  accentText: 'text-blue-400',
                  accentBg: 'bg-blue-500/20',
                  accentBorder: 'border-blue-500/50',
                  shadowHover: 'group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]',
                  activeRing: 'ring-2 ring-blue-500 shadow-[0_0_40px_-5px_rgba(59,130,246,0.5)]',
                  buttonActive: 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-blue-500/25',
                }
              ].map(t => {
                const Icon = t.icon;
                const isSelected = template === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setTemplate(t.id as any)}
                    className={`group relative cursor-pointer overflow-hidden rounded-[24px] border transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] ${
                      isSelected
                        ? `border-transparent bg-gradient-to-br ${t.gradient} ${t.activeRing}`
                        : `border-slate-200/80 bg-white hover:border-transparent hover:bg-gradient-to-br hover:${t.gradient} ${t.shadowHover}`
                    }`}
                  >
                    {/* Background glows */}
                    <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
                    <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/5 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />

                    {/* Badge */}
                    <div className="absolute right-5 top-5 z-10">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-500 backdrop-blur-md ${
                        isSelected 
                          ? `${t.accentBg} ${t.accentText} border border-transparent` 
                          : `bg-slate-100 text-slate-500 border border-slate-200 group-hover:${t.accentBg} group-hover:${t.accentText} group-hover:${t.accentBorder}`
                      }`}>
                        {t.badge}
                      </span>
                    </div>
              
                    <div className="relative z-10 p-7 h-full flex flex-col">
                      {/* Icon & Emoji */}
                      <div className="mb-6 flex items-center justify-between">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg ${
                          isSelected 
                            ? `${t.accentBg} ${t.accentText} ${t.accentBorder}`
                            : `border-slate-200/80 bg-slate-50 text-slate-400 group-hover:${t.accentBg} group-hover:${t.accentText} group-hover:${t.accentBorder}`
                        }`}>
                          <Icon strokeWidth={1.5} size={28} />
                        </div>
                        <span className="text-4xl filter drop-shadow-md transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{t.emoji}</span>
                      </div>
              
                      {/* Text */}
                      <h3 className={`mb-2 text-2xl font-black tracking-tight transition-colors duration-500 ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-white'}`}>{t.name}</h3>
                      <p className={`mb-8 text-sm leading-relaxed transition-colors duration-500 ${isSelected ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-300'}`}>{t.description}</p>
              
                      {/* Features */}
                      <div className="mb-8 flex flex-wrap gap-2">
                        {t.features.map(f => (
                          <span key={f} className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm transition-colors duration-300 ${
                            isSelected
                              ? 'border-white/10 bg-white/5 text-white'
                              : 'border-slate-200/60 bg-slate-50 text-slate-600 group-hover:border-white/10 group-hover:bg-white/5 group-hover:text-white'
                          }`}>
                            <CheckCircle2 size={14} className={`mr-1.5 transition-colors duration-300 ${isSelected ? t.accentText : 'text-cyan-500 group-hover:' + t.accentText}`} />
                            {f}
                          </span>
                        ))}
                      </div>
              
                      {/* Button */}
                      <button
                        className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-500 ${
                          isSelected
                            ? `${t.buttonActive} shadow-lg`
                            : `border border-slate-200/80 bg-white text-slate-700 shadow-sm group-hover:border-transparent group-hover:bg-white/10 group-hover:text-white group-hover:backdrop-blur-md`
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Sparkles size={18} className="animate-pulse" /> Activated
                          </>
                        ) : (
                          <>
                            Select Template <ArrowRight size={18} className="transition-transform duration-500 group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title="Select Products" />
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{selectedProducts.length} Selected</span>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {loading ? (
                <p className="text-sm text-slate-500">Loading products...</p>
              ) : products.map(p => {
                const isSelected = selectedProducts.some(sp => sp.id === p.id);
                return (
                  <div 
                    key={p.id}
                    onClick={() => toggleProduct(p)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded bg-slate-100">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <Box className="m-auto mt-2 text-slate-300" size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.category}</p>
                      </div>
                    </div>
                    {isSelected ? <CheckCircle2 className="text-blue-500" size={20} /> : <Plus className="text-slate-300" size={20} />}
                  </div>
                );
              })}
            </div>
          </Card>
          
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-14 text-lg">
            {isGenerating ? 'Generating PDF...' : 'Generate & Save Catalog'}
          </Button>
        </div>

        {/* Right Side: Preview */}
        <div className={`h-[800px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 ${!showPreview ? 'hidden lg:block' : ''}`}>
          <PDFViewer width="100%" height="100%" className="border-none">
            <CatalogPDF data={catalogData} />
          </PDFViewer>
        </div>
      </div>
      
      {/* Generated Catalogs List */}
      {catalogs.length > 0 && (
        <Card className="p-6 mt-12">
          <SectionTitle title="Generated Catalogs" />
          <div className="mt-6 space-y-4">
            {catalogs.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{c.name}</h3>
                    <p className="text-sm text-slate-500">{c.productIds?.length || 0} Products</p>
                  </div>
                </div>
                {c.pdf_url && (
                  <Button variant="secondary" onClick={() => window.open(c.pdf_url, '_blank')}>
                    <Download size={16} /> Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
