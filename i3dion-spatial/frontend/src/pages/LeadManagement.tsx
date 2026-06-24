import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, RefreshCw, Eye, Calendar, User } from 'lucide-react';
import { Badge, Button, Card, PageHeader } from '../components/ui';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function LeadManagementPage() {
  const token = useAuthStore((s) => s.token);
  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [journey, setJourney] = useState<any[]>([]);
  const [loadingJourney, setLoadingJourney] = useState(false);

  const loadLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.listLeads(token);
      setLeads(data as any[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  async function loadJourney(id: string) {
    if (!token) return;
    setLoadingJourney(true);
    try {
      const data = await api.getLeadJourney(token, id);
      setJourney(data as any[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJourney(false);
    }
  }

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'name', header: 'Lead Name', cell: ({ row }) => (
      <div>
        <p className="font-semibold text-slate-900">{row.original.name || 'Anonymous'}</p>
        <p className="text-xs text-slate-500">{row.original.email}</p>
      </div>
    )},
    { accessorKey: 'company', header: 'Company', cell: ({ row }) => row.original.company || 'Unknown' },
    { accessorKey: 'score', header: 'Score', cell: ({ row }) => (
      <Badge className={
        row.original.score >= 80 ? 'bg-red-100 text-red-700' : 
        row.original.score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
      }>
        {row.original.score ?? 0}
      </Badge>
    )},
    { accessorKey: 'intent_level', header: 'Intent', cell: ({ row }) => (
      <Badge className={
        row.original.intent_level === 'High' ? 'bg-red-100 text-red-700' : 
        row.original.intent_level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
      }>
        {row.original.intent_level || 'Low'}
      </Badge>
    )},
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge>{row.original.status}</Badge> },
    { accessorKey: 'total_events', header: 'Interactions', cell: ({ row }) => row.original.total_events || 0 },
    { accessorKey: 'created_at', header: 'First Seen', cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString() },
  ], []);

  const table = useReactTable({ 
    data: leads, 
    columns, 
    state: { globalFilter: filter }, 
    onGlobalFilterChange: setFilter, 
    getCoreRowModel: getCoreRowModel(), 
    getFilteredRowModel: getFilteredRowModel() 
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lead Intelligence"
        eyebrow="Automatically scored leads generated from catalog interactions."
        action={
          <Button variant="secondary" onClick={loadLeads} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Left: Leads Table */}
        <Card className="flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                placeholder="Search leads by name or email..." 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => <th key={h.id} className="px-6 py-4">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    <th className="px-6 py-4">Action</th>
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-6 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                    <td className="px-6 py-4">
                      <Button 
                        variant="secondary" 
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          setSelectedLead(row.original);
                          loadJourney(row.original.id);
                        }}
                      >
                        <Eye size={14} className="mr-1" /> View Journey
                      </Button>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && !loading && (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-500">
                      No leads found. When visitors interact with your catalogs, they will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right: Lead Intelligence Panel */}
        <div className="flex flex-col gap-6">
          {selectedLead ? (
            <Card className="p-6 flex flex-col h-[600px] overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {selectedLead.name ? selectedLead.name.charAt(0) : <User size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedLead.name || 'Anonymous Visitor'}</h3>
                    <p className="text-sm text-slate-500">{selectedLead.email || 'No email provided'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Lead Score</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{selectedLead.score || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Intent Level</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{selectedLead.intent_level || 'Low'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Company</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{selectedLead.company || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{selectedLead.status}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={16} /> Behavioral Journey
                </h4>
                
                {loadingJourney ? (
                  <div className="py-8 text-center text-slate-500">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Loading journey...
                  </div>
                ) : journey.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No tracked events found.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-4">
                    {journey.map((event, i) => (
                      <div key={i} className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-blue-500" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                            {event.event_type.replace('_', ' ')}
                          </p>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="mt-2 rounded bg-slate-50 p-2 text-xs font-mono text-slate-600">
                              {Object.entries(event.metadata).map(([k, v]) => (
                                <div key={k}><span className="font-semibold text-slate-500">{k}:</span> {String(v)}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center flex flex-col items-center justify-center h-[600px] border-dashed border-2 bg-slate-50">
              <User size={48} className="text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-700">No Lead Selected</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-[200px]">Select a lead from the table to view their behavioral journey and intelligence profile.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
