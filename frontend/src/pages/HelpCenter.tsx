import { useEffect, useState } from 'react';
import { PageHeader, Card } from '../components/ui';
import { Search, Book, HelpCircle, ChevronRight, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function HelpCenterPage() {
  const token = useAuthStore(s => s.token);
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadKb() {
      try {
        const res = await fetch('/api/support/kb', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    }
    if (token) loadKb();
  }, [token]);

  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Knowledge Base" 
        eyebrow="Manage support documentation used by the automated chatbot to answer customer queries."
        action={
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 transition">
            <Plus size={16} /> New Article
          </button>
        }
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search knowledge base articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
            />
          </div>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Book size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="font-bold text-slate-700">No articles found</h3>
                <p className="text-sm mt-1">Try a different search term or create a new article.</p>
              </div>
            ) : (
              filtered.map(article => (
                <Card key={article.id} className="p-5 hover:border-primary/50 transition cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{article.category}</span>
                        {article.tags.map((t: string) => (
                          <span key={t} className="text-[10px] text-slate-400">#{t}</span>
                        ))}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition">{article.title}</h3>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{article.content}</p>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-primary transition" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <HelpCircle className="text-blue-400" />
              How this works
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Articles added here are automatically indexed into the Automated Support Engine. 
              <br/><br/>
              When customers ask questions in the chat widget, the algorithm searches this knowledge base first to provide instant answers without human intervention.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-slate-900 mb-4">Categories</h3>
            <ul className="space-y-2">
              {['Getting Started', 'Account & Billing', 'Troubleshooting', 'API & Integrations', 'Best Practices'].map(cat => (
                <li key={cat} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded cursor-pointer transition">
                  <span className="text-slate-600 font-medium">{cat}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {articles.filter(a => a.category === cat).length}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
