import React, { useState } from 'react';
import {
  Search,
  LayoutTemplate,
  Mail,
  Users,
  FileText,
  BookOpen,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  Plus
} from 'lucide-react';

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  categories: string[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
}

interface FlowTemplatesViewProps {
  onSelectTemplate: (templateId: string) => void;
  onCreateBlank: () => void;
}

export const FlowTemplatesView: React.FC<FlowTemplatesViewProps> = ({
  onSelectTemplate,
  onCreateBlank
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const categories = ['All', 'Email', 'Leads', 'Documents', 'Catalogs', 'Approvals', 'Scheduled'];

  const templates: TemplateItem[] = [
    {
      id: 'template_lead_followup',
      name: 'New Lead Follow Up',
      description: 'Send automated welcome email and notify sales team upon 3D product inquiry.',
      categories: ['Email', 'Leads'],
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 'template_generate_quote',
      name: 'Generate Quote & Send',
      description: 'Auto-compile 3D PDF quote document with specs and deliver to customer.',
      categories: ['Documents', 'Email'],
      icon: FileText,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'template_catalog_automation',
      name: 'Catalog from Product Data',
      description: 'Sync CAD models from Spatial Vault and generate interactive multi-page catalogs.',
      categories: ['Catalogs', 'Documents'],
      icon: BookOpen,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      id: 'template_customer_onboarding',
      name: 'Customer Onboarding',
      description: 'Trigger onboarding email sequence and provision cloud workspace folder.',
      categories: ['Email', 'Documents'],
      icon: Mail,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600'
    },
    {
      id: 'template_lead_crm',
      name: 'Lead to CRM Sync',
      description: 'Qualify 3D spatial user interactions and persist leads directly into CRM database.',
      categories: ['Leads'],
      icon: Database,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600'
    },
    {
      id: 'template_scheduled_reports',
      name: 'Scheduled Reports',
      description: 'Compile weekly engagement analytics and email executive performance summaries.',
      categories: ['Documents', 'Scheduled'],
      icon: Calendar,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    },
    {
      id: 'template_approval_workflow',
      name: 'Approval Workflow',
      description: 'Enforce human-in-the-loop review for high-value orders and notify management.',
      categories: ['Approvals', 'Email'],
      icon: ShieldCheck,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600'
    },
    {
      id: 'template_custom_blank',
      name: 'Custom Workflow',
      description: 'Start with a clean slate and build custom triggers, rules, and connectors.',
      categories: ['Custom'],
      icon: Plus,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-800'
    }
  ];

  const filtered = templates.filter((tpl) => {
    const matchesCategory =
      selectedCategory === 'All' || tpl.categories.includes(selectedCategory);
    const matchesSearch =
      tpl.name.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workflow Templates</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Start with a ready-made template and customize it for your business.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((tpl) => {
          const Icon = tpl.icon;
          const isBlank = tpl.id === 'template_custom_blank';

          return (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-500/40 transition flex flex-col justify-between p-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl ${tpl.iconBg} ${tpl.iconColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition`}
                  >
                    <Icon size={22} />
                  </div>
                  <div className="flex items-center gap-1">
                    {tpl.categories.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <button
                  onClick={() => (isBlank ? onCreateBlank() : onSelectTemplate(tpl.id))}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                    isBlank
                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white shadow-2xs'
                  }`}
                >
                  <span>{isBlank ? 'Start from Scratch' : 'Use Template'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
