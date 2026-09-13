import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import ThreeProduct from '../../components/ThreeProduct';

export function HubSavedPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Products' | 'Experiences' | 'AR' | 'Catalogs'>('All');

  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem('i3dion_saved_items') || '[]');
    setSavedIds(loaded);
  }, []);

  const savedModels = SPATIAL_HUB_MODELS.filter((m) => savedIds.includes(m.id));

  const handleRemove = (id: string) => {
    const updated = savedIds.filter((itemId) => itemId !== id);
    setSavedIds(updated);
    localStorage.setItem('i3dion_saved_items', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header matching Screen 4 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 md:p-8 shadow-2xs border border-slate-200/80">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Saved Items</h1>
            <p className="text-xs text-slate-500 mt-0.5">Your personal collection of bookmarked products and experiences.</p>
          </div>

          {/* Filter Pills matching Screen 4 */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {(['All', 'Products', 'Experiences', 'AR', 'Catalogs'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  activeFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {savedModels.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Bookmark size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-800">No saved items</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              Click the save button on any product card in Spatial Hub to build your collection.
            </p>
            <Link
              to="/hub"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition"
            >
              <Sparkles size={16} />
              Explore Spatial Hub
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedModels.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md transition overflow-hidden"
              >
                <div className="relative h-44 w-full bg-[#0F172A]">
                  <ThreeProduct modelUrl={item.modelUrl} renderMode="solid" autoRotate={true} interactive={false} className="h-full w-full" />
                  <button
                    onClick={() => handleRemove(item.id)}
                    title="Remove item"
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 hover:bg-rose-600 hover:text-white transition backdrop-blur-md"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">{item.category}</span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.shortDescription}</p>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500">Saved</span>
                    <Link
                      to={`/hub/product/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
