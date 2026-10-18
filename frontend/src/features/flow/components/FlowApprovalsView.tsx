import React, { useState } from 'react';
import {
  Check,
  X,
  Eye,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';

interface ApprovalItem {
  id: string;
  title: string;
  workflowName: string;
  requestedBy: string;
  requestedAt: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const FlowApprovalsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: 'app_01',
      title: 'Quote for Industrial Compressor',
      workflowName: 'Quote PDF Generation',
      requestedBy: 'John Doe (Sales Lead)',
      requestedAt: '2 hours ago',
      details: 'Automated CAD specification sheet and pricing proposal for $14,500 to ACME Logistics.',
      status: 'pending'
    },
    {
      id: 'app_02',
      title: 'Product Catalog - Q3 Release',
      workflowName: 'Vault Catalog Synchronizer',
      requestedBy: 'Sarah Lee (Marketing)',
      requestedAt: '4 hours ago',
      details: 'Publish 48-page interactive 3D digital brochure with QR code embeds.',
      status: 'pending'
    },
    {
      id: 'app_03',
      title: 'Discount Approval - 15% Tier',
      workflowName: 'VIP Lead Qualification Flow',
      requestedBy: 'Mike Chen (Enterprise Rep)',
      requestedAt: '6 hours ago',
      details: 'High-intent visitor dwelt > 120s on hydraulic valve assembly.',
      status: 'pending'
    },
    {
      id: 'app_04',
      title: 'ERP SAP Master Data Sync',
      workflowName: 'Scheduled Enterprise Sync',
      requestedBy: 'System Auto-Trigger',
      requestedAt: 'Yesterday',
      details: 'Sync 14 updated product SKUs from Spatial Vault to SAP S/4HANA.',
      status: 'approved'
    }
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const handleAction = (id: string, newStatus: 'approved' | 'rejected') => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    const item = approvals.find((a) => a.id === id);
    setToast(
      newStatus === 'approved'
        ? `Approved: "${item?.title}". Workflow resumed.`
        : `Rejected: "${item?.title}". Workflow notified.`
    );
    setTimeout(() => setToast(null), 3500);
  };

  const pendingList = approvals.filter((a) => a.status === 'pending');
  const approvedList = approvals.filter((a) => a.status === 'approved');
  const rejectedList = approvals.filter((a) => a.status === 'rejected');

  const currentList =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'approved'
      ? approvedList
      : rejectedList;

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Approvals</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Review and gate high-stakes automation actions before execution.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Approved</span>
            <span className="text-[10px] opacity-70">({approvedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Rejected</span>
            <span className="text-[10px] opacity-70">({rejectedList.length})</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 2. Approvals List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
            <ShieldCheck size={36} className="mx-auto mb-2 text-slate-300" />
            <div className="font-bold text-slate-700">No {activeTab} approvals</div>
            <div className="mt-1">All automation steps are running smoothly without manual holds.</div>
          </div>
        ) : (
          currentList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {item.workflowName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.details}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <User size={12} />
                    <span>{item.requestedBy}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{item.requestedAt}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                {item.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleAction(item.id, 'rejected')}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition active:scale-95 cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'approved')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      Approve
                    </button>
                  </>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      item.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
