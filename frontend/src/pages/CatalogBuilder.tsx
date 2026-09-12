import { useEffect, useState, useMemo } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { BookOpen, Download, Plus, CheckCircle2, Box, Layers, Briefcase, Sparkles, Search, ArrowUp, ArrowDown, Loader2, LayoutTemplate, ExternalLink, Gem, Rocket, Leaf, Building2, Atom } from 'lucide-react';
import QRCode from 'qrcode';
import { Button, Card, PageHeader, SectionTitle } from '../components/ui';
import { api, CatalogRecord } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { CatalogPDF, CatalogData } from '../components/pdf/Templates';

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
  const [template, setTemplate] = useState<CatalogData['template']>('IndustrialClassic');
  const [productSearch, setProductSearch] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'manage'>('build');

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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category?.toLowerCase().includes(productSearch.toLowerCase()));

  const toggleProduct = async (product: any) => {
    const exists = selectedProducts.find(p => p.id === product.id);
    if (exists) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      const targetUrl = `${baseUrl}/product/${product.slug}?source=catalog_qr&catalog=preview`;
      const qrDataUri = await QRCode.toDataURL(targetUrl, { width: 400, margin: 1 });
      setSelectedProducts(prev => [...prev, { ...product, _catalogQrDataUri: qrDataUri }]);
    }
  };

  const moveProduct = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedProducts.length - 1) return;
    const newArr = [...selectedProducts];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    [newArr[index], newArr[swapIdx]] = [newArr[swapIdx], newArr[index]];
    setSelectedProducts(newArr);
  };

  const catalogData = useMemo(() => ({
    name: name || 'Untitled Catalog',
    description: description || 'Digital catalog preview.',
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
      const catalogRecord = await api.createCatalog(token!, {
        name,
        description,
        status: 'Published',
        productIds: selectedProducts.map(p => p.id)
      }) as CatalogRecord;

      const enrichedProducts = await Promise.all(selectedProducts.map(async (p) => {
        const targetUrl = `${baseUrl}/product/${p.slug}?source=catalog_qr&catalog=${catalogRecord.id}`;
        const qrDataUri = await QRCode.toDataURL(targetUrl, { width: 400, margin: 1 });
        return { ...p, _catalogQrDataUri: qrDataUri };
      }));
      setSelectedProducts(enrichedProducts);

      await new Promise(r => setTimeout(r, 100));

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

      const { pdf_url } = await api.uploadCatalogPdf(token!, catalogRecord.id, blob, `${name.replace(/\s+/g, '_')}.pdf`);
      
      success('Catalog Generated Successfully!');
      setCatalogs([ Object.assign({}, catalogRecord, { pdf_url }), ...catalogs ]);
      
      setName('');
      setDescription('');
      setSelectedProducts([]);
      setActiveTab('manage');
    } catch (err: any) {
      showError('Failed to generate catalog', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const templates = [
    {
      id: 'IndustrialClassic', name: 'Tech Blueprint', emoji: '⚙️', description: 'A highly technical layout focused on exact specifications.',
      badge: 'ENGINEERING', features: ['Precise Grids', 'Data Heavy'], icon: Layers,
      gradient: 'from-slate-900 via-slate-800 to-slate-900', hoverGradient: 'hover:from-slate-900 hover:via-slate-800 hover:to-slate-900', accentText: 'text-emerald-400', accentBg: 'bg-emerald-500/20', accentBorder: 'border-emerald-500/50',
      shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]', activeRing: 'ring-2 ring-emerald-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]',
    },
    {
      id: 'ModernShowcase', name: 'Creative Showcase', emoji: '✨', description: 'Visually stunning, fun presentation for full bleed AR models.',
      badge: 'FUN & MASSIVE', features: ['Vibrant Colors', 'Minimal UI'], icon: Sparkles,
      gradient: 'from-purple-900 via-indigo-900 to-purple-900', hoverGradient: 'hover:from-purple-900 hover:via-indigo-900 hover:to-purple-900', accentText: 'text-pink-400', accentBg: 'bg-pink-500/20', accentBorder: 'border-pink-500/50',
      shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.4)]', activeRing: 'ring-2 ring-pink-500 shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)]',
    },
    {
      id: 'SalesBrochure', name: 'Corporate Elite', emoji: '💼', description: 'Optimized for enterprise sales, clear CTAs, executive summaries.',
      badge: 'PROFESSIONAL', features: ['Executive Style', 'Conversion'], icon: Briefcase,
      gradient: 'from-blue-950 via-slate-900 to-blue-950', hoverGradient: 'hover:from-blue-950 hover:via-slate-900 hover:to-blue-950', accentText: 'text-blue-400', accentBg: 'bg-blue-500/20', accentBorder: 'border-blue-500/50',
      shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]', activeRing: 'ring-2 ring-blue-500 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
    },
    {
      id: 'LuxuryMinimalist', name: 'Luxury Minimalist', emoji: '💎', description: 'Ultra-clean, high-end presentation with elegant typography and metallic accents.',
      badge: 'PREMIUM', features: ['High Fashion', 'Whitespace'], icon: Gem,
      gradient: 'from-stone-900 via-stone-800 to-black', hoverGradient: 'hover:from-stone-900 hover:via-stone-800 hover:to-black', accentText: 'text-amber-200', accentBg: 'bg-amber-500/10', accentBorder: 'border-amber-500/30',
      shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.3)]', activeRing: 'ring-2 ring-amber-400/80 shadow-[0_0_30px_-5px_rgba(251,191,36,0.2)]',
    },
    {
      id: 'CyberNeo', name: 'Cyber Neo', emoji: '🚀', description: 'Futuristic dark-mode design with glowing edges and glassmorphism.',
      badge: 'NEXT-GEN', features: ['Neon Glow', 'Web3 Vibe'], icon: Rocket,
      gradient: 'from-slate-950 via-cyan-950 to-slate-950', hoverGradient: 'hover:from-slate-950 hover:via-cyan-950 hover:to-slate-950', accentText: 'text-cyan-400', accentBg: 'bg-cyan-500/20', accentBorder: 'border-cyan-500/50',
      shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)]', activeRing: 'ring-2 ring-cyan-400 shadow-[0_0_30px_-5px_rgba(34,211,238,0.4)]',
    },
    {
      id: 'NordicElegance', name: 'Nordic Elegance', emoji: '🌿', description: 'Light-themed, organic aesthetic utilizing pastel tones and smooth curves.',
      badge: 'LIFESTYLE', features: ['Soft Tones', 'Organic Feel'], icon: Leaf,
      gradient: 'from-teal-50 via-white to-stone-50', hoverGradient: 'hover:from-teal-50 hover:via-white hover:to-stone-50', accentText: 'text-teal-700', accentBg: 'bg-teal-100', accentBorder: 'border-teal-200',
      shadowHover: 'hover:shadow-[0_10px_40px_-10px_rgba(20,184,166,0.3)]', activeRing: 'ring-2 ring-teal-500 shadow-[0_10px_30px_-5px_rgba(20,184,166,0.2)]',
    },
    {
      id: 'ArchitecturalSpatial', name: 'Architectural Spatial', emoji: '🏛️', description: 'Structured, grid-based monochrome design emphasizing dimensions.',
      badge: 'STRUCTURAL', features: ['Grid Layout', 'Stark Contrast'], icon: Building2,
      gradient: 'from-zinc-900 via-neutral-800 to-zinc-900', hoverGradient: 'hover:from-zinc-900 hover:via-neutral-800 hover:to-zinc-900', accentText: 'text-slate-100', accentBg: 'bg-slate-700/50', accentBorder: 'border-slate-500/50',
      shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(241,245,249,0.3)]', activeRing: 'ring-2 ring-slate-300 shadow-[0_0_30px_-5px_rgba(241,245,249,0.2)]',
    },
    {
      id: 'QuantumHologram', name: 'Quantum Hologram', emoji: '🌌', description: 'Deep space aesthetics with ethereal gradients for advanced AR.',
      badge: 'SPATIAL', features: ['Deep Gradients', 'Ethereal'], icon: Atom,
      gradient: 'from-fuchsia-950 via-purple-900 to-slate-950', hoverGradient: 'hover:from-fuchsia-950 hover:via-purple-900 hover:to-slate-950', accentText: 'text-fuchsia-400', accentBg: 'bg-fuchsia-500/20', accentBorder: 'border-fuchsia-500/50',
      shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(232,121,249,0.4)]', activeRing: 'ring-2 ring-fuchsia-400 shadow-[0_0_30px_-5px_rgba(232,121,249,0.3)]',
    }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader 
          title="Catalog Builder" 
          eyebrow="Generate professional, interactive PDF catalogs with embedded AR and QR flows."
        />
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('build')} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'build' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Create New</button>
          <button onClick={() => setActiveTab('manage')} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'manage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Manage Catalogs</button>
        </div>
      </div>

      {activeTab === 'build' && (
        <div className="grid gap-8 xl:grid-cols-[450px_1fr]">
          {/* Left Column: Form & Selections */}
          <div className="space-y-6">
            
            {/* Catalog Details */}
            <Card className="p-6 border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-5 text-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">1</div>
                <h3 className="font-bold">Catalog Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Enter catalog title..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" 
                  />
                </div>
                <div>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Write a brief overview for the cover page..."
                    className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-[14px] outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 resize-none" 
                  />
                </div>
              </div>
            </Card>

            {/* Template Selection */}
            <Card className="p-6 border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-5 text-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">2</div>
                <h3 className="font-bold">Choose Template</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {templates.map(t => {
                  const Icon = t.icon;
                  const isSelected = template === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTemplate(t.id as any)}
                      className={`group relative cursor-pointer overflow-hidden rounded-[20px] border transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] ${
                        isSelected
                          ? `border-transparent bg-gradient-to-r ${t.gradient} ${t.activeRing}`
                          : `border-slate-200/80 bg-white hover:border-transparent hover:bg-gradient-to-r ${t.hoverGradient} ${t.shadowHover}`
                      }`}
                    >
                      <div className="relative z-10 flex items-center p-5 gap-5">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${
                          isSelected ? `${t.accentBg} ${t.accentText}` : `bg-slate-100 text-slate-400 group-hover:${t.accentBg} group-hover:${t.accentText}`
                        }`}>
                          <Icon size={24} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className={`text-lg font-bold truncate transition-colors duration-500 ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-white'}`}>{t.name}</h4>
                            <span className="text-2xl filter drop-shadow-sm">{t.emoji}</span>
                          </div>
                          <p className={`text-[13px] leading-snug line-clamp-2 transition-colors duration-500 ${isSelected ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-300'}`}>{t.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Product Selection */}
            <Card className="p-6 border-slate-200/60 shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center gap-2 mb-5 text-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">3</div>
                <h3 className="font-bold">Select Products</h3>
                <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{selectedProducts.length} Selected</span>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search products to add..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No products found</div>
                ) : (
                  filteredProducts.map(p => {
                    const isSelected = selectedProducts.some(sp => sp.id === p.id);
                    const selectedIndex = selectedProducts.findIndex(sp => sp.id === p.id);
                    
                    return (
                      <div 
                        key={p.id}
                        onClick={() => toggleProduct(p)}
                        className={`group flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100 border border-slate-200/50">
                            {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <Box className="m-auto mt-2 text-slate-300" size={20} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{p.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && (
                            <div className="flex gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => moveProduct(e, selectedIndex, 'up')} className="p-1 text-slate-400 hover:bg-white hover:text-blue-600 rounded">
                                <ArrowUp size={16} />
                              </button>
                              <button onClick={(e) => moveProduct(e, selectedIndex, 'down')} className="p-1 text-slate-400 hover:bg-white hover:text-blue-600 rounded">
                                <ArrowDown size={16} />
                              </button>
                            </div>
                          )}
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                          }`}>
                            {isSelected ? <CheckCircle2 size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Massive Preview */}
          <div className="sticky top-6 hidden xl:flex flex-col h-[calc(100vh-100px)]">
            <div className="bg-slate-900 rounded-t-2xl px-4 py-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                </div>
                <div className="ml-4 px-3 py-1 bg-slate-800 rounded-md flex items-center gap-2 text-xs font-mono text-slate-400">
                  <BookOpen size={12} /> Live PDF Render
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || selectedProducts.length === 0 || !name.trim()} 
                  className={`h-9 px-6 transition-all duration-300 ${isGenerating ? 'bg-blue-600 text-white opacity-80' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5'}`}
                >
                  {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Generating...</> : <><Sparkles size={16} className="mr-2" /> Generate Document</>}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-100/50 border-x border-b border-slate-200 rounded-b-2xl overflow-hidden relative shadow-2xl">
              {selectedProducts.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-200/50 flex items-center justify-center">
                    <LayoutTemplate size={48} className="text-slate-300" strokeWidth={1} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-600 mb-2">Preview Canvas Empty</h3>
                  <p className="max-w-md text-sm">Select products from the sidebar to visualize how your printed or digital catalog will look in real-time.</p>
                </div>
              ) : (
                <PDFViewer width="100%" height="100%" className="border-none bg-transparent">
                  <CatalogPDF data={catalogData} />
                </PDFViewer>
              )}
              
              {/* Overlay Loader */}
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                  <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Rendering PDF</h3>
                    <p className="text-sm text-slate-500">Injecting spatial assets & high-res images...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile floating generate button */}
          <div className="fixed bottom-6 left-6 right-6 xl:hidden z-40">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || selectedProducts.length === 0 || !name.trim()} 
              className="w-full h-14 text-lg shadow-2xl shadow-blue-500/20"
            >
              {isGenerating ? <><Loader2 size={20} className="animate-spin mr-2" /> Compiling Document...</> : 'Generate Catalog'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-6">
          <SectionTitle title="Your Catalogs" />
          {catalogs.length === 0 ? (
            <Card className="p-16 flex flex-col items-center justify-center text-center border-dashed border-2">
              <BookOpen size={48} className="text-slate-300 mb-4" strokeWidth={1} />
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Catalogs Yet</h3>
              <p className="text-slate-500 max-w-sm mb-6">Create your first spatial catalog to showcase your products with AR capabilities.</p>
              <Button onClick={() => setActiveTab('build')}>Create Catalog</Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {catalogs.map(c => {
                return (
                  <div key={c.id} className="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-[340px]">
                    <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                          <BookOpen size={12} /> {c.productIds?.length || 0} Products
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                          <Sparkles size={14} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-bold text-xl text-slate-900 line-clamp-1">{c.name}</h3>
                        <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          {c.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-auto">{c.description || 'No description provided.'}</p>
                      
                      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2">
                        {c.pdf_url ? (
                          <a href={c.pdf_url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 h-10 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors">
                            <Download size={16} /> Download PDF
                          </a>
                        ) : (
                          <div className="flex-1 flex items-center justify-center gap-2 h-10 bg-slate-100 text-slate-400 text-sm font-semibold rounded-xl cursor-not-allowed">
                            Processing...
                          </div>
                        )}
                        <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                          <ExternalLink size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
