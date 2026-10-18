import React, { useState } from 'react';
import {
  Search,
  Zap,
  GitBranch,
  Clock,
  StopCircle,
  Layers,
  Sliders,
  Mail,
  Bell,
  Users,
  Send,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface PaletteItem {
  type: string;
  label: string;
  category: 'trigger' | 'logic' | 'data' | 'communication' | 'ecosystem' | 'integration';
  description: string;
  icon: any;
  badge: string;
  color: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Triggers
  {
    type: 'trigger_manual',
    label: 'Manual Run Trigger',
    category: 'trigger',
    description: 'Runs workflow on demand via button or test runner',
    icon: Zap,
    badge: 'Manual',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  },
  {
    type: 'trigger_event',
    label: '3D Spatial Event',
    category: 'trigger',
    description: 'Triggered when model viewed, hotspot clicked, or RFQ submitted',
    icon: Sparkles,
    badge: 'Event',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  },
  {
    type: 'trigger_webhook',
    label: 'Inbound Webhook',
    category: 'trigger',
    description: 'Triggered via HMAC-signed HTTPS post request',
    icon: Send,
    badge: 'Webhook',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  },

  // Logic
  {
    type: 'condition',
    label: 'Condition (If/Else)',
    category: 'logic',
    description: 'Branch execution based on field comparisons',
    icon: GitBranch,
    badge: 'Branch',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    type: 'delay',
    label: 'Delay / Wait',
    category: 'logic',
    description: 'Pauses workflow execution for specified seconds',
    icon: Clock,
    badge: 'Wait',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    type: 'terminate',
    label: 'Terminate Flow',
    category: 'logic',
    description: 'Stops workflow run with a terminal state',
    icon: StopCircle,
    badge: 'End',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },

  // Data
  {
    type: 'compose',
    label: 'Compose Message',
    category: 'data',
    description: 'Combine dynamic values into a structured text template',
    icon: Layers,
    badge: 'Template',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    type: 'set_variable',
    label: 'Set Variable',
    category: 'data',
    description: 'Assign or increment a workflow variable',
    icon: Sliders,
    badge: 'Variable',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },

  // Communication
  {
    type: 'send_email',
    label: 'Send Permitted Email',
    category: 'communication',
    description: 'Dispatch quotation or spec sheet email with consent check',
    icon: Mail,
    badge: 'Email',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    type: 'send_notification',
    label: 'In-App Notification',
    category: 'communication',
    description: 'Create real-time notification alert in staff inbox',
    icon: Bell,
    badge: 'Alert',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },

  // Ecosystem & Integrations
  {
    type: 'auto_assign_lead',
    label: 'Assign Lead & Score',
    category: 'ecosystem',
    description: 'Assigns prospect to sales rep and sets status in leads table',
    icon: Users,
    badge: 'Lead',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    type: 'webhook_dispatch',
    label: 'Outbox Webhook',
    category: 'integration',
    description: 'Enqueues transactional outbox event for CRM synchronization',
    icon: Send,
    badge: 'Outbox',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
];

export const FlowPalette: React.FC = () => {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData('application/reactflow/type', item.type);
    event.dataTransfer.setData('application/reactflow/label', item.label);
    event.dataTransfer.setData('application/reactflow/category', item.category);
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredItems = PALETTE_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['trigger', 'logic', 'data', 'communication', 'ecosystem', 'integration'];

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full select-none">
      {/* Palette Header */}
      <div className="p-3.5 border-b border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Node Catalog</span>
          <span className="text-[10px] text-slate-400 font-mono">Drag to Canvas</span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search triggers & actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Palette Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {categories.map((cat) => {
          const catItems = filteredItems.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;
          const isCollapsed = collapsedCategories[cat];

          return (
            <div key={cat} className="space-y-1.5">
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 py-1 px-1 rounded transition"
              >
                <span>{cat}</span>
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>

              {!isCollapsed && (
                <div className="space-y-1.5">
                  {catItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 transition-all hover:border-cyan-400 hover:shadow-sm active:cursor-grabbing cursor-grab"
                      >
                        <GripVertical size={13} className="text-slate-300 group-hover:text-cyan-500 shrink-0" />
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${item.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-cyan-700">
                              {item.label}
                            </span>
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
