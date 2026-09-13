import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import ThreeProduct from '../../components/ThreeProduct';

export function HubLikedPage() {
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Products' | 'Experiences' | 'AR' | 'Catalogs'>('All');

  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem('i3dion_liked_items') || '[]');
    setLikedIds(loaded);
  }, []);

  const likedModels = SPATIAL_HUB_MODELS.filter((m) => likedIds.includes(m.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header matching Screen 5 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 md:p-8 shadow-2xs border border-slate-200/80">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Liked Items</h1>
            <p className="text-xs text-slate-500 mt-0.5">Spatial experiences and products you have liked.</p>
          </div>

          {/* Filter Pills matching Screen 5 */}
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

        {likedModels.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Heart size={32} className="mx-auto text-rose-300 mb-2" />
            <p className="text-sm font-bold text-slate-800">No liked items</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              Click the heart icon on spatial content to build your liked collection.
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
            {likedModels.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md transition overflow-hidden"
              >
                <div className="relative h-44 w-full bg-[#0F172A]">
                  <ThreeProduct modelUrl={item.modelUrl} renderMode="solid" autoRotate={true} interactive={false} className="h-full w-full" />
                  <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm">
                    <Heart size={14} fill="currentColor" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">{item.category}</span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.shortDescription}</p>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500">{item.likesCount + 1} Likes</span>
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
