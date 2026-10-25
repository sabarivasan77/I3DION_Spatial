import React, { useState, useEffect } from 'react';
import { useLensStore } from '../store/useLensStore';
import { CrmTask } from '../types/lensTypes';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle2,
  PhoneCall,
  Mail,
  Video,
  FileCheck,
  X
} from 'lucide-react';

export const LensTasksView: React.FC = () => {
  const {
    tasks,
    deals,
    accounts,
    fetchTasks,
    createTask,
    toggleTaskStatus
  } = useLensStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [newType, setNewType] = useState<'call' | 'meeting' | 'demo' | 'follow_up' | 'email'>('follow_up');
  const [newAssignedTo, setNewAssignedTo] = useState('Anita Patil');
  const [newDealId, setNewDealId] = useState('');
  const [newAccountId, setNewAccountId] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const now = new Date();

  const isOverdue = (task: CrmTask) => {
    return task.status !== 'completed' && new Date(task.dueDate) < now;
  };

  const isDueToday = (task: CrmTask) => {
    const d = new Date(task.dueDate);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const overdueCount = tasks.filter(isOverdue).length;
  const dueTodayCount = tasks.filter((t) => t.status !== 'completed' && isDueToday(t)).length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'overdue' && !isOverdue(t)) return false;
    if (statusFilter === 'completed' && t.status !== 'completed') return false;
    if (statusFilter === 'pending' && t.status === 'completed') return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.assignedTo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createTask({
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate,
      priority: newPriority,
      type: newType,
      assignedTo: newAssignedTo,
      dealId: newDealId || undefined,
      accountId: newAccountId || undefined
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddTaskOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall size={14} className="text-blue-600" />;
      case 'email':
        return <Mail size={14} className="text-amber-600" />;
      case 'demo':
        return <Video size={14} className="text-purple-600" />;
      case 'meeting':
        return <Calendar size={14} className="text-emerald-600" />;
      default:
        return <FileCheck size={14} className="text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Tasks</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Due Today</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{dueTodayCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Overdue Alerts</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{overdueCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'overdue' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Overdue ({overdueCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4B400] w-48 sm:w-56"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="all">All Types</option>
              <option value="follow_up">Follow Up</option>
              <option value="call">Phone Call</option>
              <option value="meeting">Meeting</option>
              <option value="demo">Product Demo</option>
              <option value="email">Email</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={() => setIsAddTaskOpen(true)}
              className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-2xs"
            >
              <Plus size={15} />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No tasks match your selected criteria.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const overdue = isOverdue(task);
              const linkedDeal = deals.find((d) => d.id === task.dealId);
              const linkedAccount = accounts.find((a) => a.id === task.accountId);

              return (
                <div
                  key={task.id}
                  className={`p-4 flex items-start gap-4 hover:bg-slate-50/70 transition group ${
                    task.status === 'completed' ? 'opacity-60 bg-slate-50/30' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-amber-600 transition shrink-0"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 size={19} className="text-emerald-600" />
                    ) : (
                      <Square size={19} className="hover:text-amber-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {task.title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        {getTypeIcon(task.type)}
                        <span className="capitalize">{task.type.replace('_', ' ')}</span>
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 font-medium">
                      <span className={`flex items-center gap-1 font-semibold ${overdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                        <Calendar size={12} />
                        Due: {new Date(task.dueDate).toLocaleDateString()} {overdue && '(Overdue)'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <User size={12} />
                        {task.assignedTo}
                      </span>
                      {linkedDeal && (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Deal: {linkedDeal.name}
                        </span>
                      )}
                      {linkedAccount && !linkedDeal && (
                        <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                          Account: {linkedAccount.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                        task.status === 'completed'
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {task.status === 'completed' ? 'Mark Incomplete' : 'Complete'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Schedule Activity / Task</h3>
              <button
                onClick={() => setIsAddTaskOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on XR Engine Proposal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Details & Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Key discussion points, agenda, or deliverables..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Activity Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  >
                    <option value="follow_up">Follow Up</option>
                    <option value="call">Phone Call</option>
                    <option value="meeting">Executive Meeting</option>
                    <option value="demo">Product Demo</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  >
                    <option value="urgent">Urgent (Red Alert)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Owner</label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
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
                <label className="font-bold text-slate-700 block mb-1">Link to Deal (Optional)</label>
                <select
                  value={newDealId}
                  onChange={(e) => setNewDealId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                >
                  <option value="">No deal linked</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (${Number(d.value).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold transition shadow-2xs"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
