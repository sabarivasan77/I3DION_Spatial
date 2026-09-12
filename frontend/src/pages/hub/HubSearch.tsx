import { useState, useMemo } from 'react';
import { Search, Filter, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SPATIAL_HUB_MODELS, searchSpatialHubModels } from '../../data/spatialHubModels';
import ThreeProduct from '../../components/ThreeProduct';

export function HubSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set(SPATIAL_HUB_MODELS.map(m => m.category));
    return ['All', ...Array.from(set)];
  }, []);

  const results = useMemo(() => {
    return searchSpatialHubModels(query, category);
  }, [query, category]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Search Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Search Spatial Hub</h1>
        <p className="text-sm text-slate-500 mb-6 max-w-xl mx-auto">Instant search across 30 curated industrial CAD models, assembly categories, and tags.</p>

        <div className="max-w-2xl mx-auto relative flex items-center mb-8">
          <Search className="absolute left-4 w-5 h-5 text-slate-400 z-10" />
          <input 
            type="text" 
            placeholder="Search by model name, category, or tag (e.g. pump, gearbox, motor, valve)..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 text-base transition-shadow relative z-10 font-medium text-slate-900"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 text-xs font-bold text-slate-400 hover:text-slate-600 z-20"
            >
              Clear
            </button>
          )}
        </div>

        {/* Categories / Filters */}
        <div className="flex flex-wrap justify-center gap-2 max-w-5xl mx-auto">
          {categories.slice(0, 10).map(c => (
            <button 
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${category === c ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {results.length === 0 ? (
        <div className="text-center py-16 text-slate-400 flex flex-col items-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
          <Filter className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-lg font-bold text-slate-700">No matching models found</p>
          <p className="mt-1 text-xs text-slate-500 mb-4">Try adjusting your search terms or selecting a different category.</p>
          <button
            onClick={() => { setQuery(''); setCategory('All'); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Reset Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map(item => (
            <Link key={item.id} to={`/hub/product/${item.slug}`} className="group block h-full">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden border-b border-slate-100">
                  <ThreeProduct
                    modelUrl={item.modelUrl}
                    productName={item.name}
                    renderMode="solid"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
                    <Box className="w-3 h-3" /> AR Ready
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">{item.category}</span>
                    <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{item.shortDescription}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
