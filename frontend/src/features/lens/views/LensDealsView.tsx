import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { CrmDeal, DealStage } from '../types/lensTypes';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Kanban,
  Table as TableIcon,
  X
} from 'lucide-react';

const STAGES: { id: DealStage; label: string; color: string; badge: string }[] = [
  { id: 'Discovery', label: 'Discovery', color: 'border-blue-400 bg-blue-50/40', badge: 'bg-blue-100 text-blue-800' },
  { id: 'Qualified', label: 'Qualified', color: 'border-amber-400 bg-amber-50/40', badge: 'bg-amber-100 text-amber-800' },
  { id: 'Proposal', label: 'Proposal Sent', color: 'border-purple-400 bg-purple-50/40', badge: 'bg-purple-100 text-purple-800' },
  { id: 'Negotiation', label: 'In Negotiation', color: 'border-cyan-400 bg-cyan-50/40', badge: 'bg-cyan-100 text-cyan-800' },
  { id: 'Won', label: 'Closed Won', color: 'border-emerald-500 bg-emerald-50/50', badge: 'bg-emerald-600 text-white' },
  { id: 'Lost', label: 'Closed Lost', color: 'border-rose-400 bg-rose-50/30', badge: 'bg-rose-100 text-rose-800' }
];

export const LensDealsView: React.FC = () => {
  const { deals, accounts, createDeal, updateDealStage } = useLensStore();

  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  // Form State
  const [dealName, setDealName] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [amount, setAmount] = useState('50000');
  const [stage, setStage] = useState<DealStage>('Discovery');
  const [expectedCloseDate, setExpectedCloseDate] = useState('2026-12-31');
  const [nextStep, setNextStep] = useState('');

  // Loss Reason Modal State
  const [losingDealId, setLosingDealId] = useState<string | null>(null);
  const [lossReasonInput, setLossReasonInput] = useState('');

  const filteredDeals = deals.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.account_name && d.account_name.toLowerCase().includes(q)) ||
      (d.contact_name && d.contact_name.toLowerCase().includes(q))
    );
  });

  const totalPipeline = filteredDeals
    .filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
    .reduce((sum, d) => sum + parseFloat(String(d.amount) || '0'), 0);

  const totalWon = filteredDeals
    .filter((d) => d.stage === 'Won')
    .reduce((sum, d) => sum + parseFloat(String(d.amount) || '0'), 0);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim() || !selectedAccountId) return;

    const acc = accounts.find((a) => a.id === selectedAccountId);
    await createDeal({
      name: dealName.trim(),
      accountId: selectedAccountId,
      account_name: acc?.name,
      amount: parseFloat(amount) || 0,
      stage,
      expectedCloseDate,
      nextStep: nextStep.trim() || undefined
    });

    setDealName('');
    setNextStep('');
    setShowAddModal(false);
  };

  const handleDragStart = (dealId: string) => {
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStage: DealStage) => {
    if (!draggedDealId) return;
    const deal = deals.find((d) => d.id === draggedDealId);
    if (!deal || deal.stage === targetStage) {
      setDraggedDealId(null);
      return;
    }

    if (targetStage === 'Lost') {
      setLosingDealId(draggedDealId);
      setDraggedDealId(null);
      return;
    }

    await updateDealStage(draggedDealId, targetStage);
    setDraggedDealId(null);
  };

  const confirmLossReason = async () => {
    if (losingDealId) {
      await updateDealStage(losingDealId, 'Lost', lossReasonInput.trim() || 'Competitor pricing');
      setLosingDealId(null);
      setLossReasonInput('');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1700px] mx-auto font-sans select-none">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Deals & Sales Pipeline</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Visual commercial opportunity tracker. Drag deals across stages to update revenue pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Summary Pills */}
          <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-1.5 shadow-2xs text-xs font-bold">
            <span className="text-slate-400">Active Pipeline:</span>
            <span className="text-[#D97706] font-black">${totalPipeline.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-1.5 shadow-2xs text-xs font-bold text-emerald-800">
            <span>Closed Won:</span>
            <span className="font-black">${totalWon.toLocaleString()}</span>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'board' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Kanban size={13} />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon size={13} />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-md transition active:scale-95 shrink-0"
          >
            <Plus size={15} />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter deals by name, company, or contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4B400] shadow-2xs"
        />
      </div>

      {/* 3. KANBAN BOARD VIEW */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-start">
          {STAGES.map((stg) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stg.id);
            const stageValue = stageDeals.reduce((sum, d) => sum + parseFloat(String(d.amount) || '0'), 0);

            return (
              <div
                key={stg.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stg.id)}
                className={`rounded-3xl border ${stg.color} p-3.5 flex flex-col space-y-3 min-h-[500px] transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900">{stg.label}</span>
                    <span className="text-[10px] font-bold bg-white text-slate-600 px-1.5 py-0.2 rounded-full border border-slate-200">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    ${(stageValue / 1000).toFixed(0)}k
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition cursor-grab active:cursor-grabbing space-y-2.5 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                          {deal.name}
                        </h4>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${stg.badge}`}>
                          {deal.probability}%
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-500">
                        {deal.account_name && (
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                            <Building2 size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{deal.account_name}</span>
                          </div>
                        )}
                        {deal.contact_name && (
                          <div className="flex items-center gap-1.5 text-slate-600 truncate">
                            <User size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{deal.contact_name}</span>
                          </div>
                        )}
                        {deal.expected_close_date && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Calendar size={11} className="text-slate-400 shrink-0" />
                            <span>Target: {deal.expected_close_date}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">
                          ${parseFloat(String(deal.amount) || '0').toLocaleString()}
                        </span>

                        {/* Quick Stage Stepper */}
                        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          {stg.id !== 'Won' && (
                            <button
                              onClick={() => {
                                const order: DealStage[] = ['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Won'];
                                const currIdx = order.indexOf(deal.stage);
                                if (currIdx < order.length - 1) {
                                  updateDealStage(deal.id, order[currIdx + 1]);
                                }
                              }}
                              className="p-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[10px] font-bold"
                              title="Advance to next stage"
                            >
                              <ArrowRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {deal.next_step && (
                        <div className="bg-slate-50 rounded-lg p-1.5 text-[10px] text-slate-600 font-medium">
                          Next: {deal.next_step}
                        </div>
                      )}
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="h-28 rounded-2xl border border-dashed border-slate-200/80 flex items-center justify-center text-center p-3">
                      <span className="text-[11px] text-slate-400 font-medium">Drop opportunity here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Opportunity Name</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Deal Value</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Probability</th>
                  <th className="py-2.5 px-3">Target Close</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{deal.name}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{deal.account_name || '—'}</td>
                    <td className="py-3 px-3 text-slate-600">{deal.contact_name || '—'}</td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      ${parseFloat(String(deal.amount) || '0').toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        deal.stage === 'Won' ? 'bg-emerald-100 text-emerald-800' :
                        deal.stage === 'Lost' ? 'bg-rose-100 text-rose-800' :
                        deal.stage === 'Proposal' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold">{deal.probability}%</td>
                    <td className="py-3 px-3 text-slate-500">{deal.expected_close_date || '—'}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => updateDealStage(deal.id, 'Won')}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-bold hover:bg-emerald-100"
                        >
                          Won
                        </button>
                        <button
                          onClick={() => setLosingDealId(deal.id)}
                          className="px-2 py-1 bg-rose-50 text-rose-700 rounded font-bold hover:bg-rose-100"
                        >
                          Lost
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CREATE DEAL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Create Commercial Opportunity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Opportunity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Titan 9000 Digital Twin Expansion"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Associated Account (Company) *</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Deal Value (USD) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Initial Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as DealStage)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Target Close Date</label>
                  <input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Next Step Action</label>
                <input
                  type="text"
                  placeholder="e.g. Present CAD dimensional step tolerances to engineering board"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold shadow-md"
                >
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. LOSS REASON PROMPT MODAL */}
      {losingDealId && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Record Loss Reason</h3>
            <p className="text-xs text-slate-500">
              Recording structured loss reasons improves win probability analytics for future proposals.
            </p>
            <input
              type="text"
              placeholder="e.g. Budget deferral / Competitor CAD tool"
              value={lossReasonInput}
              onChange={(e) => setLossReasonInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLosingDealId(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmLossReason}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
