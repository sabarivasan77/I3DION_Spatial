import { useEffect, useState } from 'react';
import { PageHeader, Card } from '../components/ui';
import { Bot, User, CheckCircle, MessageSquare, Ticket } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function SupportDashboardPage() {
  const token = useAuthStore(s => s.token);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/support/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    if (token) loadStats();
  }, [token]);

  if (!stats) return <div className="p-8">Loading Support Analytics...</div>;

  const aiResolutionRate = stats.total_tickets + stats.ai_resolved_chats > 0 
    ? Math.round((stats.ai_resolved_chats / (stats.total_tickets + stats.ai_resolved_chats)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Support Dashboard" 
        eyebrow="AI vs Human resolution metrics and support pipeline."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Chats</p>
            <h3 className="text-2xl font-bold">{stats.ai_resolved_chats + stats.escalated_chats}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Bot size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">AI Resolved</p>
            <h3 className="text-2xl font-bold">{stats.ai_resolved_chats}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <User size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Human Escalations</p>
            <h3 className="text-2xl font-bold">{stats.escalated_chats}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Tickets</p>
            <h3 className="text-2xl font-bold">{stats.total_tickets}</h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Bot /> AI Deflection Rate</h3>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 relative flex items-center justify-center" style={{ borderTopColor: '#3b82f6', transform: 'rotate(-45deg)' }}>
              <div style={{ transform: 'rotate(45deg)' }} className="text-3xl font-bold text-blue-600">{aiResolutionRate}%</div>
            </div>
            <div>
              <p className="text-sm text-slate-600">AI successfully resolves {aiResolutionRate}% of incoming customer queries without human intervention.</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <h3 className="font-bold mb-4 flex items-center gap-2"><CheckCircle /> Platform Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-blue-500/50 pb-2">
              <span className="text-blue-200">Chatbot Status</span>
              <span className="font-bold text-emerald-300">Online & Learning</span>
            </div>
            <div className="flex justify-between items-center border-b border-blue-500/50 pb-2">
              <span className="text-blue-200">RAG Index</span>
              <span className="font-bold">Active</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-blue-200">Intent Classifier</span>
              <span className="font-bold">v2.1 (Heuristic)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
