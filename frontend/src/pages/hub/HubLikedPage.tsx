import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import ThreeProduct from '../../components/ThreeProduct';

export function HubLikedPage() {
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem('i3dion_liked_items') || '[]');
    setLikedIds(loaded);
  }, []);

  const likedModels = SPATIAL_HUB_MODELS.filter((m) => likedIds.includes(m.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Banner */}
        <div className="mb-8 rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Liked Content</h1>
              <p className="text-xs text-slate-500">Spatial experiences and 3D products you have liked.</p>
            </div>
          </div>
        </div>

        {likedModels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-400 mb-3">
              <Heart size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Liked Content Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              As you browse Spatial Hub, click the heart button on items that catch your interest.
            </p>
            <Link
              to="/hub"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition"
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
                className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition overflow-hidden"
              >
                <div className="relative h-48 w-full bg-slate-900">
                  <ThreeProduct
                    modelUrl={item.modelUrl}
                    renderMode="solid"
                    autoRotate={true}
                    interactive={false}
                    className="h-full w-full"
                  />
                  <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm">
                    <Heart size={15} fill="currentColor" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">{item.category}</span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.shortDescription}</p>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500">{item.likesCount + 1} Likes</span>
                    <Link
                      to={`/hub/product/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View Details
                      <ArrowRight size={14} />
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
