import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  Bell,
  Mail,
  ShieldAlert,
  GitBranch,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Workflow,
  Sparkles,
  Layers
} from 'lucide-react';

interface AutomationRecipe {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  enabled: boolean;
  category: 'notification' | 'pipeline' | 'sla' | 'handoff';
  flowId?: string;
}

export const LensAutomationsView: React.FC = () => {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<AutomationRecipe[]>([
    {
      id: 'auto-1',
      name: 'High-Value Deal Negotiation Alert',
      description: 'Sends real-time notification to VP of Sales whenever an enterprise deal > $50,000 transitions into Negotiation stage.',
      trigger: 'Deal stage updated to Negotiation AND Value >= $50,000',
      action: 'Send urgent Slack notification and flag high-priority review',
      enabled: true,
      category: 'pipeline'
    },
    {
      id: 'auto-2',
      name: 'Overdue Activity Escalation',
      description: 'Generates daily follow-up digest for sales managers when client tasks remain incomplete 24 hours past the due date.',
      trigger: 'Task status !== "completed" AND dueDate < NOW() - 24h',
      action: 'Send reminder email and escalate task priority to Urgent',
      enabled: true,
      category: 'sla'
    },
    {
      id: 'auto-3',
      name: 'Showroom Lead Round-Robin Assignment',
      description: 'Automatically assigns new inbound 3D showroom leads to available regional sales representatives.',
      trigger: 'New lead submitted with source "3D Showroom"',
      action: 'Distribute lead via round-robin rule to Anita Patil and Michael Kim',
      enabled: false,
      category: 'notification'
    },
    {
      id: 'auto-4',
      name: 'Enterprise VIP Enquiry SLA Guardian',
      description: 'Escalates technical inquiries from Enterprise-tier accounts if unassigned for more than 2 business hours.',
      trigger: 'Customer enquiry created for Tier: Enterprise AND status == "open" > 2h',
      action: 'Alert technical lead and trigger immediate on-call SMS',
      enabled: true,
      category: 'sla'
    },
    {
      id: 'auto-5',
      name: 'Won Deal Contract & Provisioning Handoff',
      description: 'Dispatches multi-branch provisioning workflow to I3DION Spatial Flow to spin up tenant cloud instances and generate MSA PDFs.',
      trigger: 'Deal stage changed to Won',
      action: 'Trigger Spatial Flow DAG: flow_provision_enterprise_customer_v2',
      enabled: true,
      category: 'handoff',
      flowId: 'flow_provision_enterprise_customer_v2'
    }
  ]);

  const toggleRecipe = (id: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleLaunchFlow = (flowId?: string) => {
    // Navigate to Spatial Flow canvas route
    navigate('/flow');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Architecture Boundary Callout */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <Workflow size={22} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Operational Boundary: Spatial Lens &amp; Spatial Flow</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-extrabold uppercase">
                System Boundary
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Spatial Lens handles tactical CRM notification toggles, reminder alerts, and SLA triggers. Complex multi-branch orchestration, DAG node execution, and resilient state machines run exclusively inside <strong>I3DION Spatial Flow</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleLaunchFlow()}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <span>Open Spatial Flow Canvas</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Recipe List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Active CRM Automations &amp; Notification Triggers
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Toggle automatic alerts or dispatch event streams to Spatial Flow.
            </p>
          </div>
          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            {recipes.filter((r) => r.enabled).length} Active Rules
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                recipe.enabled ? 'bg-white' : 'bg-slate-50/50 opacity-70'
              }`}
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      recipe.enabled ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Zap size={14} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{recipe.name}</h4>
                  {recipe.category === 'handoff' && (
                    <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <GitBranch size={11} /> Flow Orchestration
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 pl-9">{recipe.description}</p>

                <div className="pl-9 flex flex-wrap items-center gap-3 text-[11px]">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono text-[10px]">
                    <strong>Trigger:</strong> {recipe.trigger}
                  </span>
                  <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md font-medium text-[10px]">
                    <strong>Action:</strong> {recipe.action}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end md:self-center">
                {recipe.flowId && (
                  <button
                    onClick={() => handleLaunchFlow(recipe.flowId)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
                  >
                    <span>View in Flow</span>
                    <ExternalLink size={12} />
                  </button>
                )}

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => toggleRecipe(recipe.id)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer transition ${
                    recipe.enabled ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                      recipe.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
