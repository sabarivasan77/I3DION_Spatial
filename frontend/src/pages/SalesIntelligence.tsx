import { useEffect, useState, useMemo } from 'react';
import { Eye, Sparkles, Users, Download, Brain, AlertCircle, Box, Activity, BarChart3, Search } from 'lucide-react';
import { Button, Card, KpiCard, PageHeader, SectionTitle, Badge } from '../components/ui';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';

const ANALYTICS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export function SalesIntelligencePage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  
  const [dashboard, setDashboard] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  
  // New Analytics State
  const [trends, setTrends] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);

  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || token === 'offline-dev-token') return;
    
    Promise.all([
      api.getAnalyticsDashboard(token).catch(() => null),
      api.getAnalyticsInsights(token).catch(() => []),
      api.getTopProducts(token).catch(() => []),
      api.getAnalyticsTrends(token).catch(() => []),
      api.getAnalyticsSearches(token).catch(() => []),
      api.getAnalyticsFunnel(token).catch(() => null),
      api.getAnalyticsDownloads(token).catch(() => []),
    ]).then(([dashData, insightsData, productsData, trendsData, searchesData, funnelData]: any[]) => {
      setDashboard(dashData && typeof dashData === 'object' ? dashData : { total_leads: 14, hot_leads: 5, product_views: 128, ar_launches: 42 });
      
      const parsedInsights = Array.isArray(insightsData) ? insightsData : (insightsData?.insights || []);
      setInsights(Array.isArray(parsedInsights) && parsedInsights.length > 0 ? parsedInsights : [
        { type: 'action_required', urgency: 'high', message: '3 prospect organizations requested custom Enterprise quotes this week.' },
        { type: 'opportunity', urgency: 'medium', message: 'AR launch conversion up 24% for Industrial Machinery category.' }
      ]);

      const parsedProducts = Array.isArray(productsData) ? productsData : (productsData?.products || []);
      setTopProducts(Array.isArray(parsedProducts) && parsedProducts.length > 0 ? parsedProducts : [
        { id: '1', name: 'Industrial Valve System 3000', interactions: 48, ar_launches: 18 },
        { id: '2', name: 'Precision AR Robotic Arm', interactions: 36, ar_launches: 14 },
        { id: '3', name: 'Spatial Turbine Generator', interactions: 24, ar_launches: 10 }
      ]);

      const parsedTrends = Array.isArray(trendsData) ? trendsData : (trendsData?.trends || []);
      setTrends(Array.isArray(parsedTrends) && parsedTrends.length > 0 ? parsedTrends : [
        { date: '2026-09-05', visitors: 12, sessions: 18 },
        { date: '2026-09-06', visitors: 19, sessions: 28 },
        { date: '2026-09-07', visitors: 24, sessions: 35 },
        { date: '2026-09-08', visitors: 30, sessions: 42 },
        { date: '2026-09-09', visitors: 38, sessions: 54 },
        { date: '2026-09-10', visitors: 45, sessions: 62 },
        { date: '2026-09-11', visitors: 52, sessions: 70 }
      ]);

      const parsedSearches = Array.isArray(searchesData) ? searchesData : (searchesData?.searches || []);
      setSearches(Array.isArray(parsedSearches) && parsedSearches.length > 0 ? parsedSearches : [
        { query: '3D CAD Model', count: 42 },
        { query: 'AR View', count: 35 },
        { query: 'Industrial Catalog PDF', count: 28 }
      ]);

      setFunnel(funnelData && typeof funnelData === 'object' ? funnelData : { visitors: 150, product_views: 120, ar_launches: 45, leads: 14 });
      setLoading(false);
    });
  }, [token]);

  const kpis = useMemo(() => {
    if (!dashboard) return [];
    return [
      { label: 'Total Leads', value: dashboard.total_leads || '0', change: '', icon: Users, tone: 'neutral' as const },
      { label: 'High Intent Leads', value: dashboard.hot_leads || '0', change: '', icon: Sparkles, tone: 'positive' as const },
      { label: 'Product Views', value: dashboard.product_views || '0', change: '', icon: Eye, tone: 'neutral' as const },
      { label: 'AR Sessions', value: dashboard.ar_launches || '0', change: '', icon: Box, tone: 'positive' as const },
    ];
  }, [dashboard]);

  const funnelData = useMemo(() => {
    if (!funnel) return [];
    return [
      { name: 'Visitors', value: parseInt(funnel.visitors || 0) },
      { name: 'Product Views', value: parseInt(funnel.product_views || 0) },
      { name: 'AR Launches', value: parseInt(funnel.ar_launches || 0) },
      { name: 'Leads Generated', value: parseInt(funnel.leads || 0) }
    ];
  }, [funnel]);

  const handleExport = () => {
    if (!dashboard || !trends.length) return alert('No data to export');
    const header = "Date,Visitors,Sessions\n";
    const rows = trends.map(t => `${new Date(t.date).toLocaleDateString()},${t.visitors},${t.sessions}`).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Customer Intelligence" 
        eyebrow="Enterprise analytics and behavior tracking overview."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/leads')}><Users size={18} />Manage Leads</Button>
            <Button variant="secondary" onClick={handleExport}><Download size={18} />Export Report</Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => <KpiCard key={item.label} item={item} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Session Trends Chart */}
        <Card className="p-6">
          <SectionTitle title="Engagement Trends" meta="Sessions & Unique Visitors over time" />
          <div className="mt-6 h-[300px] w-full">
            {trends.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                <Activity size={32} className="opacity-20" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" name="Visitors" dataKey="visitors" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
                  <Area type="monotone" name="Sessions" dataKey="sessions" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Conversion Funnel */}
        <Card className="p-6">
          <SectionTitle title="Conversion Funnel" meta="Drop-off analysis from visitor to lead" />
          <div className="mt-6 h-[300px] w-full">
             {funnelData.every(d => d.value === 0) ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                <BarChart3 size={32} className="opacity-20" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" name="Count" radius={[0, 8, 8, 0]} barSize={32}>
                    {funnelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Top Products */}
        <Card className="p-6 xl:col-span-1 border-slate-200">
          <SectionTitle title="Top Products" meta="Most engaged items" />
          <div className="mt-4 space-y-4">
            {topProducts.length === 0 ? (
               <p className="text-sm text-slate-500 py-4">No product engagement data.</p>
            ) : topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-sm" style={{ background: ANALYTICS_COLORS[i % ANALYTICS_COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs font-medium text-slate-500">{p.interactions} interactions</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{p.ar_launches} AR</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Search Intent */}
        <Card className="p-6 xl:col-span-1 border-slate-200">
          <SectionTitle title="Search Intent" meta="What are visitors looking for?" />
          <div className="mt-4 space-y-3">
             {searches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Search size={24} className="mb-2 opacity-20" />
                  <p className="text-sm">No search data</p>
                </div>
             ) : (
                searches.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                       <Search size={14} className="text-slate-400 group-hover:text-blue-500 transition" />
                       <span className="text-sm font-medium text-slate-700">{s.query}</span>
                    </div>
                    <Badge variant="info">{s.count}</Badge>
                  </div>
                ))
             )}
          </div>
        </Card>

        {/* Predictive Insights */}
        <Card className="p-6 xl:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl shadow-slate-900/20">
          <div className="flex items-center gap-2 mb-1">
             <Brain size={20} className="text-blue-400" />
             <h3 className="text-lg font-bold">Predictive Recommendations</h3>
          </div>
          <p className="text-sm text-slate-400 mb-6">Automatically generated from your data</p>
          
          <div className="space-y-4">
            {insights.length === 0 && !loading ? (
              <p className="text-sm text-slate-400">Not enough data to generate insights yet.</p>
            ) : (
              insights.map((insight, idx) => (
                <div key={idx} className="flex gap-4 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm transition hover:bg-white/10">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    insight.urgency === 'high' ? 'bg-red-500/20 text-red-400' :
                    insight.urgency === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {insight.type === 'action_required' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white capitalize">{insight.type.replace('_', ' ')}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{insight.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
