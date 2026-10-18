import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFlowDesignerStore } from '../store/useFlowDesignerStore';

export const FlowAiSuggestionsView: React.FC = () => {
  const navigate = useNavigate();
  const { createFromTemplate } = useFlowDesignerStore();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // Create new flow based on suggestion
      createFromTemplate('lead_qualification');
      navigate('/flow/new');
    }, 1200);
  };

  const suggestions = [
    {
      id: 'sug_1',
      title: 'Automate 3D Spatial Lead Qualification',
      description: 'Trigger an alert whenever a viewer inspects a 3D CAD hotspot for more than 45 seconds.',
      impact: 'Reduces lead response latency from 4 hours to 10 seconds',
      templateId: 'lead_qualification'
    },
    {
      id: 'sug_2',
      title: 'Auto-Generate 3D Spec Sheet PDF on Demand',
      description: 'When an RFQ is submitted, compile a full CAD specification sheet from Spatial Vault assets.',
      impact: 'Eliminates manual catalog drafting across engineering teams',
      templateId: 'document_automation'
    },
    {
      id: 'sug_3',
      title: 'Multi-Channel CRM & ERP Synchronization',
      description: 'Stream verified contact details and CAD inquiry data into Salesforce and SAP simultaneously.',
      impact: '100% data fidelity between engineering and sales',
      templateId: 'lead_qualification'
    }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>AI Workflow Assistant</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
            Powered by Spatial AI
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Generate complete automation pipelines from natural language prompts or explore intelligent recommendations.
        </p>
      </div>

      {/* 2. Natural Language Prompt Box */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md shadow-blue-600/20 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-300" />
          <h2 className="font-bold text-sm tracking-tight">Prompt to Workflow Generator</h2>
        </div>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. When a user in the Spatial Hub views an industrial compressor and requests a quote, generate a 3D spec sheet PDF, add the lead to Salesforce with VIP status, and notify sales on Slack..."
              className="w-full p-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 text-xs focus:outline-none focus:bg-white/15 focus:border-white transition resize-none"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-white/70">
              Generates triggers, condition branches, and actions automatically.
            </span>
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Sparkles size={14} className="animate-spin text-blue-600" />
                  <span>Generating Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Generate Workflow</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. AI Suggestions List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Recommended Optimizations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {suggestions.map((sug) => (
            <div
              key={sug.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-500/40 transition flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Bot size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{sug.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{sug.description}</p>
                <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-900 font-semibold flex items-center gap-1.5">
                  <Zap size={13} className="text-purple-600 shrink-0" />
                  <span>{sug.impact}</span>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    createFromTemplate(sug.templateId);
                    navigate('/flow/new');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <span>Apply Recommendation</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
