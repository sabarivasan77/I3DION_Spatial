import { useEffect, useState, useMemo } from 'react';
import { Eye, Sparkles, Users, Download, Brain, AlertCircle, Box } from 'lucide-react';
import { Button, Card, KpiCard, PageHeader, SectionTitle } from '../components/ui';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const ANALYTICS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export function SalesIntelligencePage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  
  const [dashboard, setDashboard] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || token === 'offline-dev-token') return;
    
    Promise.all([
      api.getAnalyticsDashboard(token).catch(() => null),
      api.getAnalyticsInsights(token).catch(() => []),
      api.getTopProducts(token).catch(() => [])
    ]).then(([dashData, insightsData, productsData]: [any, any, any]) => {
      setDashboard(dashData);
      setInsights(insightsData);
      setTopProducts(productsData);
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

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Sales Intelligence" 
        eyebrow="Enterprise analytics and lead intelligence overview."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/leads')}><Users size={18} />Manage Leads</Button>
            <Button variant="secondary"><Download size={18} />Export Report</Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => <KpiCard key={item.label} item={item} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <Card className="p-6">
          <SectionTitle title="AI Sales Insights" meta="Automatically generated recommendations" />
          <div className="mt-4 space-y-4">
            {insights.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">Not enough data to generate insights.</p>
            ) : (
              insights.map((insight, idx) => (
                <div key={idx} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    insight.urgency === 'high' ? 'bg-red-100 text-red-600' :
                    insight.urgency === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {insight.type === 'action_required' ? <AlertCircle size={20} /> : <Brain size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold capitalize text-slate-900">{insight.type.replace('_', ' ')}</h4>
                    <p className="mt-1 text-sm text-slate-600">{insight.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Top Products Engagement" />
          <div className="mt-4 space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white" style={{ background: ANALYTICS_COLORS[i % ANALYTICS_COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.interactions} total interactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-700">{p.ar_launches} AR</p>
                  <p className="text-xs text-slate-500">{p.qr_scans} QR</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


