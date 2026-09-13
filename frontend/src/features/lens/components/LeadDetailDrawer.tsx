import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { LensLead, LeadStatus } from '../types/lensTypes';
import {
  X,
  Edit2,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Tag,
  MessageSquare,
  Activity,
  Trash2,
  Send,
  MoreVertical
} from 'lucide-react';

export const LeadDetailDrawer: React.FC = () => {
  const {
    leads,
    selectedLeadId,
    isLeadDrawerOpen,
    closeLeadDrawer,
    updateLeadStatus,
    assignLead,
    addLeadNote,
    addLeadTag,
    deleteLead
  } = useLensStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'notes' | 'related'>('overview');
  const [newNoteText, setNewNoteText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingAssign, setIsEditingAssign] = useState(false);

  const lead = leads.find((l) => l.id === selectedLeadId);

  if (!isLeadDrawerOpen || !lead) return null;

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

  const initials = lead.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleNoteAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteText.trim()) {
      addLeadNote(lead.id, newNoteText.trim());
      setNewNoteText('');
    }
  };

  const handleTagAdd = () => {
    if (newTagInput.trim()) {
      addLeadTag(lead.id, newTagInput.trim());
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col font-sans select-none animate-in slide-in-from-right duration-200">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Details</span>
        <button
          onClick={closeLeadDrawer}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Lead Profile Banner */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-black flex items-center justify-center text-sm shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 truncate">{lead.name}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 truncate">{lead.company}</p>
            <p className="text-[11px] text-slate-400 truncate">{lead.productProject}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setIsEditingStatus(!isEditingStatus)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs py-1.5 rounded-xl transition shadow-2xs"
          >
            <Edit2 size={13} />
            <span>Update Status</span>
          </button>
          <button
            onClick={() => setIsEditingAssign(!isEditingAssign)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-1.5 rounded-xl transition"
          >
            <UserCheck size={13} />
            <span>Assign</span>
          </button>
          <button
            onClick={() => deleteLead(lead.id)}
            title="Delete lead"
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Status Edit Dropdown */}
        {isEditingStatus && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2 animate-in fade-in">
            <label className="text-[11px] font-bold text-amber-900 block">Change Status</label>
            <select
              value={lead.status}
              onChange={(e) => {
                updateLeadStatus(lead.id, e.target.value as LeadStatus);
                setIsEditingStatus(false);
              }}
              className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="New">New</option>
              <option value="Qualified">Qualified</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        )}

        {/* Assign User Dropdown */}
        {isEditingAssign && (
          <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl space-y-2 animate-in fade-in">
            <label className="text-[11px] font-bold text-slate-700 block">Assign Representative</label>
            <select
              value={lead.assignedTo}
              onChange={(e) => {
                assignLead(lead.id, e.target.value);
                setIsEditingAssign(false);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="Anita Patil">Anita Patil</option>
              <option value="Michael Kim">Michael Kim</option>
              <option value="Sarah Lee">Sarah Lee</option>
              <option value="Daniel Turner">Daniel Turner</option>
              <option value="Rahul Sharma">Rahul Sharma</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs Row */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-3 border-b-2 transition ${
            activeTab === 'overview' ? 'border-[#F4B400] text-slate-900 font-extrabold' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`py-2.5 px-3 border-b-2 transition ${
            activeTab === 'activity' ? 'border-[#F4B400] text-slate-900 font-extrabold' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Activity ({lead.activityTimeline.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2.5 px-3 border-b-2 transition ${
            activeTab === 'notes' ? 'border-[#F4B400] text-slate-900 font-extrabold' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Notes ({lead.notes.length})
        </button>
      </div>

      {/* Drawer Scroll Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Contact Information</h3>
              <div className="space-y-2 text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline truncate">
                    {lead.email}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span>{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{lead.location}</span>
                </div>
              </div>
            </div>

            {/* Lead Meta Fields */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Lead Information</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400">Source</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{lead.source}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400">Assigned To</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{lead.assignedTo}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400">Created Date</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{lead.date}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400">Interested In</span>
                  <span className="font-bold text-slate-800 mt-0.5 block truncate">{lead.interestedIn}</span>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Tags</h3>
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add Tag
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {lead.tags.map((t, idx) => (
                  <span key={idx} className="bg-amber-50 text-[#D97706] text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-200">
                    #{t}
                  </span>
                ))}
              </div>

              {isAddingTag && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter tag name..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#F4B400]"
                    autoFocus
                  />
                  <button
                    onClick={handleTagAdd}
                    className="bg-[#F4B400] text-slate-950 px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Activity Timeline</h3>
            <div className="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-4">
              {lead.activityTimeline.map((act) => (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-[#F4B400] ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-800">{act.description}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">{act.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Notes & Comments</h3>

            <form onSubmit={handleNoteAdd} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Write a internal note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F4B400]"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs py-2 rounded-xl shadow-2xs"
              >
                <Send size={13} />
                <span>Add Note</span>
              </button>
            </form>

            <div className="space-y-2.5 pt-2">
              {lead.notes.map((note, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-xs text-slate-700 font-medium">
                  {note}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
