import { useEffect, useState, useMemo } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { BookOpen, Download, Plus, CheckCircle2, Box } from 'lucide-react';
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
            <div className="mt-4 grid grid-cols-3 gap-4">
              {['IndustrialClassic', 'ModernShowcase', 'SalesBrochure'].map(t => (
                <div 
                  key={t}
                  onClick={() => setTemplate(t as any)}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${template === t ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className={`mx-auto mb-2 h-16 w-12 rounded bg-white shadow-sm border ${template === t ? 'border-blue-200' : 'border-slate-200'}`} />
                  <p className="text-xs font-semibold text-slate-700">{t.replace(/([A-Z])/g, ' $1').trim()}</p>
                </div>
              ))}
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
