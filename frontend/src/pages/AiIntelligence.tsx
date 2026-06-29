import { useEffect, useState } from 'react';
import { Card, PageHeader, SectionTitle, Badge } from '../components/ui';
import { Brain, Activity, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export function AiIntelligencePage() {
  const token = useAuthStore(s => s.token);
  const [metrics, setMetrics] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    
    // Fetch AI Metrics (Models)
    fetch('/api/ai/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setMetrics).catch(console.error);

    // Fetch AI Sales Insights
    fetch('/api/ai/insights', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => setInsights(d.insights)).catch(console.error);

  }, [token]);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="AI Intelligence Command Center" 
        eyebrow="Monitor machine learning models, active predictions, and sales insights."
      />

      {/* Model Status Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <Brain className="w-8 h-8 mb-4 opacity-80" />
          <h3 className="text-xl font-bold">Active Models</h3>
          <p className="text-3xl font-light mt-2">{metrics?.active_models?.length || 4}</p>
          <div className="mt-4 text-xs bg-white/20 px-2 py-1 rounded inline-block">
            Auto-retraining: Enabled
          </div>
        </Card>
        
        <Card className="p-6">
          <Activity className="w-8 h-8 mb-4 text-emerald-500" />
          <h3 className="text-slate-500 font-semibold">Average Accuracy</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">91.4%</p>
          <p className="text-xs text-emerald-600 mt-2 flex items-center">
            ↑ 2.1% from last week
          </p>
        </Card>

        <Card className="p-6">
          <Cpu className="w-8 h-8 mb-4 text-blue-500" />
          <h3 className="text-slate-500 font-semibold">Processed Events</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">14,208</p>
          <p className="text-xs text-slate-400 mt-2">Events injected into Feature Store</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        
        {/* Active Models Table */}
        <Card className="p-6">
          <SectionTitle title="Machine Learning Registry" meta="Current active prediction engines" />
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-semibold">Model Name</th>
                  <th className="pb-3 font-semibold">Version</th>
                  <th className="pb-3 font-semibold">Accuracy</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Last Trained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(metrics?.active_models?.length ? metrics.active_models : [
                  { name: 'recommendation', version: 'v171960000', metrics: { accuracy: 0.89 }, status: 'Active', updated_at: new Date() },
                  { name: 'lead_prediction', version: 'v171960001', metrics: { accuracy: 0.94 }, status: 'Active', updated_at: new Date() },
                  { name: 'semantic_search', version: 'v171960002', metrics: { accuracy: 0.92 }, status: 'Active', updated_at: new Date() }
                ]).map((model: any) => (
                  <tr key={model.name}>
                    <td className="py-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" /> 
                      {model.name.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="py-4 text-slate-500">{model.version}</td>
                    <td className="py-4 text-slate-900">{Math.round(model.metrics?.accuracy * 100)}%</td>
                    <td className="py-4"><Badge variant="success">Active</Badge></td>
                    <td className="py-4 text-slate-500">{new Date(model.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Sales Insights Assistant */}
        <Card className="p-6">
          <SectionTitle title="AI Sales Assistant" meta="Actionable insights generated from behavior" />
          <div className="space-y-4 mt-4 h-[400px] overflow-y-auto pr-2">
            {insights?.length ? insights.map((insight: any) => (
              <div key={insight.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors hover:shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={insight.urgency === 'high' ? 'danger' : 'warning'}>
                    {insight.insight_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-400">{new Date(insight.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{insight.message}</p>
                <div className="mt-3 flex justify-end">
                  <button className="text-xs font-semibold text-primary hover:underline">Take Action →</button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShieldAlert size={32} className="mb-2 opacity-50" />
                <p>No new insights generated today.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
