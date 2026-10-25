import React, { useState, useEffect } from 'react';
import { useLensStore } from '../store/useLensStore';
import { CrmAccount, CrmContact } from '../types/lensTypes';
import {
  Building2,
  Users,
  Plus,
  Search,
  ExternalLink,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  Globe,
  Filter,
  ChevronRight,
  TrendingUp,
  X,
  FileText
} from 'lucide-react';

export const LensCrmView: React.FC = () => {
  const {
    accounts,
    contacts,
    deals,
    fetchAccounts,
    createAccount,
    fetchContacts,
    createContact,
    setActiveView
  } = useLensStore();

  const [activeTab, setActiveTab] = useState<'accounts' | 'contacts'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'Enterprise' | 'Mid-Market' | 'SMB'>('all');
  const [selectedAccount, setSelectedAccount] = useState<CrmAccount | null>(null);

  // Modal states
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountIndustry, setNewAccountIndustry] = useState('Industrial & Manufacturing');
  const [newAccountWebsite, setNewAccountWebsite] = useState('');
  const [newAccountTier, setNewAccountTier] = useState<'Enterprise' | 'Mid-Market' | 'SMB'>('Mid-Market');
  const [newAccountOwner, setNewAccountOwner] = useState('Anita Patil');

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAccountId, setNewContactAccountId] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactPrimary, setNewContactPrimary] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchContacts();
  }, [fetchAccounts, fetchContacts]);

  // Account Filters
  const filteredAccounts = accounts.filter((acc) => {
    if (tierFilter !== 'all' && acc.tier !== tierFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        (acc.industry && acc.industry.toLowerCase().includes(q)) ||
        acc.owner.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Contact Filters
  const filteredContacts = contacts.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const acc = accounts.find((a) => a.id === c.accountId);
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (acc && acc.name.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;

    await createAccount({
      name: newAccountName.trim(),
      industry: newAccountIndustry,
      website: newAccountWebsite.trim(),
      tier: newAccountTier,
      owner: newAccountOwner
    });

    setNewAccountName('');
    setNewAccountWebsite('');
    setIsAddAccountOpen(false);
  };

  const handleCreateContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactEmail.trim()) return;

    await createContact({
      accountId: newContactAccountId || (accounts.length > 0 ? accounts[0].id : ''),
      name: newContactName.trim(),
      email: newContactEmail.trim(),
      phone: newContactPhone.trim(),
      title: newContactTitle.trim(),
      isPrimary: newContactPrimary
    });

    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactTitle('');
    setIsAddContactOpen(false);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Mid-Market':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SMB':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{accounts.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enterprise Clients</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {accounts.filter((a) => a.tier === 'Enterprise').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Commercial Contacts</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{contacts.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Navigation & Action Header */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'accounts'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 size={15} />
              <span>Accounts ({accounts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'contacts'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              <span>Contacts ({contacts.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4B400] w-48 sm:w-64"
              />
            </div>

            {/* Filter by Tier if in Accounts tab */}
            {activeTab === 'accounts' && (
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F4B400]"
              >
                <option value="all">All Tiers</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="SMB">SMB</option>
              </select>
            )}

            {/* Create Button */}
            {activeTab === 'accounts' ? (
              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-2xs"
              >
                <Plus size={15} />
                <span>New Account</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddContactOpen(true)}
                className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-2xs"
              >
                <Plus size={15} />
                <span>New Contact</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Accounts View */}
        {activeTab === 'accounts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Contacts</th>
                  <th className="py-3 px-4">Account Owner</th>
                  <th className="py-3 px-4">Active Pipeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    const accContacts = contacts.filter((c) => c.accountId === acc.id);
                    const accDeals = deals.filter((d) => d.accountId === acc.id);
                    const pipelineVal = accDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

                    return (
                      <tr
                        key={acc.id}
                        className="hover:bg-slate-50/70 transition group cursor-pointer"
                        onClick={() => setSelectedAccount(acc)}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs shrink-0">
                            {acc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 hover:text-amber-600 transition">{acc.name}</p>
                            {acc.website && (
                              <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                                <Globe size={10} /> {acc.website}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{acc.industry || 'General'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadge(acc.tier)}`}>
                            {acc.tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-bold">{accContacts.length} people</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{acc.owner}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {pipelineVal > 0 ? `$${pipelineVal.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccount(acc);
                            }}
                            className="text-xs font-bold text-amber-600 hover:text-amber-800 inline-flex items-center gap-1"
                          >
                            Details <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Contacts View */}
        {activeTab === 'contacts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Account / Company</th>
                  <th className="py-3 px-4">Title / Role</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No contacts found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => {
                    const acc = accounts.find((a) => a.id === c.accountId);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{c.name}</span>
                            {c.isPrimary && (
                              <span className="ml-2 text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                Primary
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {acc ? acc.name : 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{c.title || 'Executive'}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{c.email}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{c.phone || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Details Drawer / Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
                    {selectedAccount.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{selectedAccount.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{selectedAccount.industry}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Account Quick Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Tier</span>
                  <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadge(selectedAccount.tier)}`}>
                    {selectedAccount.tier}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Owner</span>
                  <span className="font-bold text-slate-900">{selectedAccount.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Website</span>
                  <a
                    href={selectedAccount.website ? `https://${selectedAccount.website.replace(/^https?:\/\//, '')}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-amber-600 hover:underline inline-flex items-center gap-1"
                  >
                    {selectedAccount.website || 'No website'} <ExternalLink size={11} />
                  </a>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Created Date</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selectedAccount.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Linked Contacts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Affiliated Contacts ({contacts.filter((c) => c.accountId === selectedAccount.id).length})
                  </h4>
                  <button
                    onClick={() => {
                      setNewContactAccountId(selectedAccount.id);
                      setIsAddContactOpen(true);
                    }}
                    className="text-xs font-bold text-amber-600 hover:text-amber-800"
                  >
                    + Add Contact
                  </button>
                </div>
                <div className="space-y-2">
                  {contacts.filter((c) => c.accountId === selectedAccount.id).length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No contacts registered for this account.</p>
                  ) : (
                    contacts
                      .filter((c) => c.accountId === selectedAccount.id)
                      .map((c) => (
                        <div key={c.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="text-[11px] text-slate-500">{c.title || 'Executive'} &bull; {c.email}</p>
                          </div>
                          {c.isPrimary && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">
                              Primary
                            </span>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Associated Deals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Active Deals ({deals.filter((d) => d.accountId === selectedAccount.id).length})
                  </h4>
                  <button
                    onClick={() => setActiveView('deals')}
                    className="text-xs font-bold text-amber-600 hover:text-amber-800"
                  >
                    View Pipeline
                  </button>
                </div>
                <div className="space-y-2">
                  {deals.filter((d) => d.accountId === selectedAccount.id).length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No active deals found for this account.</p>
                  ) : (
                    deals
                      .filter((d) => d.accountId === selectedAccount.id)
                      .map((d) => (
                        <div key={d.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{d.name}</p>
                            <span className="text-[10px] text-slate-500 capitalize">Stage: {d.stage}</span>
                          </div>
                          <span className="font-black text-slate-900 text-sm">
                            ${Number(d.value).toLocaleString()}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedAccount(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Create New Account</h3>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Industrial Systems"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Industry Sector</label>
                <select
                  value={newAccountIndustry}
                  onChange={(e) => setNewAccountIndustry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                >
                  <option value="Industrial & Manufacturing">Industrial & Manufacturing</option>
                  <option value="Automotive & Aerospace">Automotive & Aerospace</option>
                  <option value="Architecture & Construction">Architecture & Construction</option>
                  <option value="Retail & Spatial E-Commerce">Retail & Spatial E-Commerce</option>
                  <option value="Healthcare & Medical Tech">Healthcare & Medical Tech</option>
                  <option value="Enterprise Software">Enterprise Software</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Tier</label>
                  <select
                    value={newAccountTier}
                    onChange={(e) => setNewAccountTier(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Mid-Market">Mid-Market</option>
                    <option value="SMB">SMB</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Owner</label>
                  <select
                    value={newAccountOwner}
                    onChange={(e) => setNewAccountOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  >
                    <option value="Anita Patil">Anita Patil</option>
                    <option value="Michael Kim">Michael Kim</option>
                    <option value="Sarah Lee">Sarah Lee</option>
                    <option value="Daniel Turner">Daniel Turner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Website URL</label>
                <input
                  type="text"
                  placeholder="e.g. apexsystems.com"
                  value={newAccountWebsite}
                  onChange={(e) => setNewAccountWebsite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold transition shadow-2xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Create New Contact</h3>
              <button
                onClick={() => setIsAddContactOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateContactSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account / Company *</label>
                <select
                  required
                  value={newContactAccountId}
                  onChange={(e) => setNewContactAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                >
                  <option value="">Select an Account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Miller"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 555-0199"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Job Title / Role</label>
                <input
                  type="text"
                  placeholder="e.g. VP of Engineering"
                  value={newContactTitle}
                  onChange={(e) => setNewContactTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={newContactPrimary}
                  onChange={(e) => setNewContactPrimary(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="primaryContact" className="text-slate-700 font-semibold cursor-pointer">
                  Designate as primary commercial contact
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold transition shadow-2xs"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
