import { useState, useEffect } from 'react';
import {
  FolderOpen,
  ArrowUp,
  ArrowDown,
  Plus,
  CheckCircle2,
  Package,
  Layers,
  X
} from 'lucide-react';
import { vaultApi } from '../../api/vaultApi';

export default function VaultCatalogs() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [activeCatalog, setActiveCatalog] = useState<any | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderSuccess, setReorderSuccess] = useState(false);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    setIsLoading(true);
    try {
      const res = await vaultApi.getCatalogDataset();
      const list = res.records || [];
      setCatalogs(list);
      if (list.length > 0) {
        selectCatalog(list[0]);
      }
    } catch (err) {
      console.error('Failed to load catalogs', err);
      setCatalogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCatalog = async (cat: any) => {
    setActiveCatalog(cat);
    try {
      const prods = await vaultApi.getCatalogProducts(cat.id);
      setCatalogProducts(prods);
    } catch {
      setCatalogProducts([]);
    }
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= catalogProducts.length) return;

    const newOrder = [...catalogProducts];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setCatalogProducts(newOrder);
    setIsReordering(true);
  };

  const handleSaveOrder = async () => {
    if (!activeCatalog) return;
    try {
      const productIds = catalogProducts.map(p => p.id);
      await vaultApi.reorderCatalogProducts(activeCatalog.id, productIds);
      setIsReordering(false);
      setReorderSuccess(true);
      setTimeout(() => setReorderSuccess(false), 3000);
    } catch (err) {
      console.error('Reorder save failed', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300 select-none pb-8">
      {/* ─── HEADER ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Catalog Manager</h1>
          <p className="text-xs text-slate-500 mt-1">Structured product catalogs, sequence ordering, and visibility placements.</p>
        </div>
        {reorderSuccess && (
          <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} /> Product Display Sequence Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* CATALOG LIST */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Active Catalogs</h2>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">Loading catalogs...</div>
          ) : catalogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No catalogs created</div>
          ) : (
            <div className="space-y-2">
              {catalogs.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => selectCatalog(cat)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    activeCatalog?.id === cat.id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen size={18} className={activeCatalog?.id === cat.id ? 'text-emerald-600' : 'text-slate-400'} />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{cat.name}</h3>
                      <span className="text-[10px] text-slate-400">{cat.status || 'Published'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CATALOG PRODUCT ORDERING WORKSPACE */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">{activeCatalog?.name || 'Select a Catalog'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Drag/Reorder products to control display sequence across Hub & OmniStudio.</p>
            </div>
            {isReordering && (
              <button
                onClick={handleSaveOrder}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
              >
                Save Product Order
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {catalogProducts.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400 text-xs">
                <Package size={40} className="mb-2 opacity-30 text-emerald-600" />
                No products assigned to this catalog.
              </div>
            ) : (
              catalogProducts.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200 text-slate-700 text-xs font-extrabold">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{p.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveProduct(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveProduct(index, 'down')}
                      disabled={index === catalogProducts.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
