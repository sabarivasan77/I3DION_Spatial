import { useState, useEffect } from 'react';
import { Search, Box as BoxIcon, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hubApi, HubProduct } from '../../services/hubApi';
import { Card } from '../../components/ui';

export function HubSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<HubProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = ['Industrial Equipment', 'Automotive', 'Architecture', 'Furniture', 'Consumer Products', 'Electronics', 'Education', 'Medical', 'Engineering', 'Custom'];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      hubApi.search(query, category)
        .then(setResults)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, category]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = Array.from(new Set(results.flatMap(r => [r.name, ...(r.tags || [])]))).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Search Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Global Discovery</h1>
        <div className="max-w-2xl mx-auto relative flex items-center">
          <Search className="absolute left-4 w-6 h-6 text-slate-400 z-10" />
          <input 
            type="text" 
            placeholder="Search products, models, creators, tags..." 
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 text-lg transition-shadow relative z-10"
          />
          {showSuggestions && query.length > 0 && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-20">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => { setQuery(suggestion); setShowSuggestions(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 flex items-center border-b border-slate-50 last:border-0"
                >
                  <Search className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="font-medium">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categories / Filters */}
        <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          <button 
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!category ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All Categories
          </button>
          {categories.map(c => (
            <button 
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Searching...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-24 text-slate-400 flex flex-col items-center">
          <Filter className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-xl font-medium text-slate-500">No results found.</p>
          <p className="mt-2 text-sm">Try adjusting your search terms or category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map(item => (
            <Link key={item.id} to={`/hub/product/${item.id}`} className="group block">
              <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200">
                <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <BoxIcon className="w-16 h-16 text-slate-300" />
                  )}
                  {item.modelUrl && (
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                      3D / AR
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-1 truncate">{item.name}</h3>
                  <p className="text-xs text-slate-500 truncate mb-3">by {item.creator_name || item.company_name}</p>
                  <div className="flex gap-1 overflow-hidden">
                    {item.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">#{tag}</span>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
