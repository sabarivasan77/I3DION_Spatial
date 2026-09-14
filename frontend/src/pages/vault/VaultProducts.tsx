import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Plus,
  Download,
  Grid,
  List,
  ArrowRight,
  CheckCircle2,
  X,
  Filter
} from 'lucide-react';
import { vaultApi } from '../../api/vaultApi';
import { VaultExportModal } from '../../components/vault/VaultImportExportModal';

export default function VaultProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New product form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Industrial Equipment');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await vaultApi.getProductDataset();
      setProducts(res.records || []);
    } catch (err) {
      console.error('Failed to load products dataset', err);
      setProducts([]);
    } flex: {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await vaultApi.createRecord('system_products', {
        name,
        status: 'Published',
        data: {
          category,
          description,
          is_public: 'True'
        }
      });
      setProducts([created, ...products]);
      setName('');
      setDescription('');
      setIsCreateOpen(false);
      navigate(`/vault/products/${created.id}`);
    } catch (err) {
      console.error('Failed to create product record', err);
    }
  };

  const categories = ['All', 'Industrial Equipment', 'Compressors', 'HVAC', 'Pumps', 'Turbines'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || String(p.data?.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.data?.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300 select-none pb-8">
      {/* ─── HEADER ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Master Registry</h1>
          <p className="text-xs text-slate-500 mt-1">Authoritative enterprise product records, 3D model specs, and catalog assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download size={15} /> Export Dataset
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <Plus size={16} /> New Product Record
          </button>
        </div>
      </div>

      {/* ─── FILTER BAR ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product code, title, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter size={14} className="text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ─── MAIN PRODUCTS CONTENT ───────── */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400 font-bold">Loading product records...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <Package size={48} className="mb-4 opacity-40 text-emerald-600" />
          <p className="text-sm font-bold text-slate-800">No Product Records Found</p>
          <button onClick={() => setIsCreateOpen(true)} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">+ Create Product</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/vault/products/${p.id}`)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 size={12} /> {p.status || 'Published'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">{p.data?.category || 'Equipment'}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.data?.description || 'Enterprise product specification master record.'}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Created {new Date(p.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold group-hover:translate-x-1 transition-transform">
                  View Detail <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Product Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Public Visibility</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/vault/products/${p.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{p.data?.category || 'Equipment'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-semibold">{p.data?.is_public === 'True' ? 'Public' : 'Organization Only'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-emerald-600 hover:underline font-bold">Inspect →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Create New Product Record</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Pressure Centrifugal Turbine CMP-900"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="Industrial Equipment">Industrial Equipment</option>
                  <option value="Compressors">Compressors</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Pumps">Pumps</option>
                  <option value="Turbines">Turbines</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Technical Description</label>
                <textarea
                  placeholder="Engineering specifications overview..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full rounded-xl border border-slate-200 p-3 text-xs font-medium outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      <VaultExportModal
        collectionName="Product Master Registry"
        records={filteredProducts}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
