import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { LensFilterBar } from '../components/LensFilterBar';
import { LeadDetailDrawer } from '../components/LeadDetailDrawer';
import { AddLeadModal } from '../components/AddLeadModal';
import { LeadStatus } from '../types/lensTypes';
import {
  Users,
  Plus,
  Search,
  Download,
  SlidersHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  PieChart,
  Box,
  Share2
} from 'lucide-react';

export const LensLeadsView: React.FC = () => {
  const {
    leads,
    filters,
    setFilters,
    openLeadDrawer,
    selectedLeadId
  } = useLensStore();

  const [activeTab, setActiveTab] = useState<'all' | 'project' | 'product' | 'source'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // Filter leads based on global filter state
  const filteredLeads = leads.filter((l) => {
    if (filters.statusFilter !== 'all' && l.status !== filters.statusFilter) return false;
    if (filters.sourceFilter !== 'all' && l.source !== filters.sourceFilter) return false;
    if (filters.projectFilter !== 'all' && l.productProject !== filters.projectFilter) return false;
    if (filters.productFilter !== 'all' && l.productProject !== filters.productFilter) return false;
    if (filters.assignedUserFilter !== 'all' && l.assignedTo !== filters.assignedUserFilter) return false;
    if (filters.searchKeyword) {
      const q = filters.searchKeyword.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.productProject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Table Pagination
  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === paginatedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(paginatedLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Company', 'Email', 'Phone', 'Product/Project', 'Status', 'Source', 'Date', 'AssignedTo'];
    const rows = filteredLeads.map((l) => [l.id, l.name, l.company, l.email, l.phone, l.productProject, l.status, l.source, l.date, l.assignedTo]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spatial_lens_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeColor = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Qualified':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Contacted':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Converted':
        return 'bg-emerald-600 text-white border-emerald-600 font-extrabold';
      case 'Lost':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none relative">
      {/* 1. Header Title & Primary Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leads</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage and analyze your leads across all projects. Track engagement, convert opportunities.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>Add Lead</span>
        </button>
      </div>

      {/* 2. Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'all'
              ? 'bg-amber-50 text-[#D97706] shadow-2xs border border-amber-200/80'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          All Leads
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'project'
              ? 'bg-amber-50 text-[#D97706] shadow-2xs border border-amber-200/80'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          By Project
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'product'
              ? 'bg-amber-50 text-[#D97706] shadow-2xs border border-amber-200/80'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          By Product
        </button>
        <button
          onClick={() => setActiveTab('source')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'source'
              ? 'bg-amber-50 text-[#D97706] shadow-2xs border border-amber-200/80'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          By Source
        </button>
      </div>

      {/* 3. Filter Bar (Matching Image 2) */}
      <LensFilterBar />

      {/* 4. Summary KPI Cards with Sparklines (Matching Reference Image 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Leads */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Users size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600">↑ 12%</span>
          </div>
          <div className="mt-2">
            <span className="block text-[11px] font-bold text-slate-400">Total Leads</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{leads.length}</span>
          </div>
          <div className="mt-2 h-6 w-full opacity-60">
            <svg className="w-full h-full" viewBox="0 0 100 25">
              <path d="M0 20 Q25 15, 50 10 T100 5" fill="none" stroke="#F4B400" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600">↑ 18%</span>
          </div>
          <div className="mt-2">
            <span className="block text-[11px] font-bold text-slate-400">New Leads</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {leads.filter((l) => l.status === 'New').length}
            </span>
          </div>
          <div className="mt-2 h-6 w-full opacity-60">
            <svg className="w-full h-full" viewBox="0 0 100 25">
              <path d="M0 22 Q25 18, 50 12 T100 4" fill="none" stroke="#3B82F6" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 3: Qualified Leads */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600">↑ 8%</span>
          </div>
          <div className="mt-2">
            <span className="block text-[11px] font-bold text-slate-400">Qualified Leads</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {leads.filter((l) => l.status === 'Qualified').length}
            </span>
          </div>
          <div className="mt-2 h-6 w-full opacity-60">
            <svg className="w-full h-full" viewBox="0 0 100 25">
              <path d="M0 18 Q25 12, 50 15 T100 3" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 4: Converted Leads */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600">↑ 24%</span>
          </div>
          <div className="mt-2">
            <span className="block text-[11px] font-bold text-slate-400">Converted Leads</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {leads.filter((l) => l.status === 'Converted').length}
            </span>
          </div>
          <div className="mt-2 h-6 w-full opacity-60">
            <svg className="w-full h-full" viewBox="0 0 100 25">
              <path d="M0 24 Q25 19, 50 11 T100 2" fill="none" stroke="#8B5CF6" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 5: Conversion Rate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <PieChart size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600">↑ 5%</span>
          </div>
          <div className="mt-2">
            <span className="block text-[11px] font-bold text-slate-400">Conversion Rate</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">25.0%</span>
          </div>
          <div className="mt-2 h-6 w-full opacity-60">
            <svg className="w-full h-full" viewBox="0 0 100 25">
              <path d="M0 16 Q25 14, 50 8 T100 4" fill="none" stroke="#F43F5E" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* 5. Main Operational Leads Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
        {/* Toolbar Bar above table */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm">Leads ({filteredLeads.length})</h2>
            {selectedLeadIds.length > 0 && (
              <span className="bg-amber-100 text-[#D97706] text-xs font-bold px-2 py-0.5 rounded-md">
                {selectedLeadIds.length} Selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-2xs"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length > 0 && selectedLeadIds.length === paginatedLeads.length}
                    onChange={toggleSelectAll}
                    className="rounded text-[#F4B400] focus:ring-[#F4B400]"
                  />
                </th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Product / Project</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Assigned To</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No matching lead records found. Adjust your filters or add a new lead.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => openLeadDrawer(l.id)}
                    className={`hover:bg-amber-50/40 cursor-pointer transition ${
                      selectedLeadId === l.id ? 'bg-amber-50/80 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l.id)}
                        onChange={() => toggleSelectLead(l.id)}
                        className="rounded text-[#F4B400] focus:ring-[#F4B400]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {l.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{l.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-600">{l.company}</td>
                    <td className="py-3 px-3 text-slate-600">{l.productProject}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-500">{l.source}</td>
                    <td className="py-3 px-3 text-slate-400 font-medium">{l.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{l.assignedTo}</td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openLeadDrawer(l.id)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
          <div>
            Showing {filteredLeads.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * rowsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-xs font-bold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Bottom Visualizations Row (Matching Reference Image 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Leads by Status Donut */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Leads by Status</h3>
          </div>
          <div className="flex items-center justify-between text-xs space-y-1">
            <div className="space-y-1 font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> New (26%)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Qualified (25%)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Contacted (18%)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> In Progress (16%)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-700" /> Converted (12%)
              </div>
            </div>
          </div>
        </div>

        {/* Leads Trend Line */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Leads Trend</h3>
          </div>
          <div className="h-28 w-full pt-1">
            <svg className="w-full h-full" viewBox="0 0 100 40">
              <path d="M0 35 Q25 25, 50 30 T100 10" fill="none" stroke="#F4B400" strokeWidth="2.5" />
              <path d="M0 38 Q25 32, 50 35 T100 22" fill="none" stroke="#3B82F6" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Leads by Source Horizontal Bars */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Leads by Source</h3>
          </div>
          <div className="space-y-2 text-xs font-semibold text-slate-700">
            <div>
              <div className="flex justify-between">
                <span>Website</span> <span>35%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>QR Code</span> <span>22%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Products by Leads */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Top Products</h3>
          </div>
          <div className="space-y-2 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span>Industrial Compressor</span> <span className="font-bold text-slate-900">186</span>
            </div>
            <div className="flex justify-between">
              <span>HVAC System</span> <span className="font-bold text-slate-900">124</span>
            </div>
            <div className="flex justify-between">
              <span>Valve Assembly</span> <span className="font-bold text-slate-900">98</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Lead Detail Drawer Overlay Panel */}
      <LeadDetailDrawer />

      {/* 8. Add Lead Modal */}
      <AddLeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
