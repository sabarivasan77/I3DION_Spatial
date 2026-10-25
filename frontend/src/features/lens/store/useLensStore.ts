import { create } from 'zustand';
import {
  LensLead,
  LensProjectMetric,
  LensVisualization,
  LensDataset,
  LensSavedView,
  LensReport,
  LensFilterState,
  LeadStatus,
  LeadSource,
  CrmAccount,
  CrmContact,
  CrmDeal,
  CrmTask,
  CrmEnquiry,
  CrmDocument,
  DealStage
} from '../types/lensTypes';
import {
  INITIAL_LENS_LEADS,
  INITIAL_PROJECT_METRICS,
  INITIAL_VISUALIZATIONS,
  INITIAL_DATASETS,
  INITIAL_SAVED_VIEWS,
  INITIAL_REPORTS
} from '../data/defaultLensData';

export type LensView =
  | 'home'
  | 'leads'
  | 'deals'
  | 'crm'
  | 'tasks'
  | 'enquiries'
  | 'analytics'
  | 'projects'
  | 'visualizations'
  | 'reports'
  | 'documents'
  | 'automations'
  | 'saved-views'
  | 'data-explorer'
  | 'settings'
  | 'help';

interface LensStoreState {
  // Navigation & View
  activeView: LensView;
  setActiveView: (view: LensView) => void;
  homeViewMode: 'overall' | 'project';
  setHomeViewMode: (mode: 'overall' | 'project') => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  // Global Filter State
  filters: LensFilterState;
  setFilters: (partial: Partial<LensFilterState>) => void;
  resetFilters: () => void;

  // Lead Management
  leads: LensLead[];
  selectedLeadId: string | null;
  isLeadDrawerOpen: boolean;
  openLeadDrawer: (id: string) => void;
  closeLeadDrawer: () => void;
  addLead: (lead: Omit<LensLead, 'id' | 'activityTimeline'>) => Promise<void>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
  assignLead: (id: string, assignedTo: string) => Promise<void>;
  addLeadNote: (id: string, noteText: string) => Promise<void>;
  addLeadTag: (id: string, tag: string) => void;
  deleteLead: (id: string) => Promise<void>;
  convertLeadToCustomer: (leadId: string, options: any) => Promise<any>;

  // CRM: Accounts & Contacts
  accounts: CrmAccount[];
  contacts: CrmContact[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  createAccount: (data: any) => Promise<CrmAccount>;
  createContact: (data: any) => Promise<CrmContact>;

  // Deals & Sales Pipeline
  deals: CrmDeal[];
  createDeal: (data: any) => Promise<CrmDeal>;
  updateDealStage: (dealId: string, stage: DealStage, lossReason?: string) => Promise<void>;

  // Activities & Tasks
  tasks: CrmTask[];
  createTask: (data: any) => Promise<CrmTask>;
  toggleTaskStatus: (taskId: string) => Promise<void>;

  // Customer Enquiries
  enquiries: CrmEnquiry[];
  createEnquiry: (data: any) => Promise<CrmEnquiry>;
  updateEnquiryStatus: (enquiryId: string, status: string) => Promise<void>;

  // Sales Documents
  documents: CrmDocument[];
  createDocument: (data: any) => Promise<CrmDocument>;

  // AI Sales Assistant
  isAiAssistantOpen: boolean;
  openAiAssistant: () => void;
  closeAiAssistant: () => void;

  // Lightweight Automations & Preferences
  automations: {
    taskReminders: boolean;
    overdueAlerts: boolean;
    autoAssignLeads: boolean;
    weeklyDigest: boolean;
  };
  updateAutomations: (partial: Partial<LensStoreState['automations']>) => void;
  triggerFlowHandoff: (actionType: string, payload?: any) => Promise<any>;

  // Project Metrics
  projects: LensProjectMetric[];

  // Visualization Engine
  visualizations: LensVisualization[];
  addVisualization: (vis: Omit<LensVisualization, 'id'>) => void;
  updateVisualizationPosition: (id: string, pos: { x: number; y: number; w: number; h: number }) => void;
  deleteVisualization: (id: string) => void;

  // Datasets
  datasets: LensDataset[];

  // Saved Views
  savedViews: LensSavedView[];
  saveCurrentView: (name: string, type: LensSavedView['type']) => void;
  applySavedView: (view: LensSavedView) => void;
  deleteSavedView: (id: string) => void;

  // Reports
  reports: LensReport[];
  createReport: (report: Omit<LensReport, 'id' | 'createdAt'>) => void;
  deleteReport: (id: string) => void;

  // Vault Sync Status
  vaultSyncStatus: 'connected' | 'syncing' | 'offline';
  lastSyncTime: string;
  syncNow: () => void;

  // Live Backend Lens Intelligence & CRM State
  overview: any | null;
  crmOverview: any | null;
  funnel: any[];
  qrAttribution: any[];
  hotspots: any[];
  isLoadingLive: boolean;
  liveError: string | null;
  fetchLiveData: (token?: string) => Promise<void>;
}

const DEFAULT_FILTERS: LensFilterState = {
  dateRange: '30d',
  projectFilter: 'all',
  productFilter: 'all',
  sourceFilter: 'all',
  statusFilter: 'all',
  assignedUserFilter: 'all',
  searchKeyword: ''
};

// Realistic seed fallback data
const INITIAL_ACCOUNTS: CrmAccount[] = [
  {
    id: 'acc_1',
    name: 'Sharma Engineering Ltd.',
    industry: 'Heavy Machinery & Automation',
    website: 'https://sharmaengg.com',
    phone: '+91 98765 43210',
    tier: 'Enterprise',
    annual_revenue: 12500000,
    contact_count: 2,
    deal_count: 2,
    total_won_revenue: 145000,
    owner_name: 'Anita Patil',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'acc_2',
    name: 'Apex Industrial Turbines',
    industry: 'Energy & Power Generation',
    website: 'https://apexturbines.com',
    phone: '+1 800 555 0192',
    tier: 'Strategic',
    annual_revenue: 35000000,
    contact_count: 3,
    deal_count: 1,
    total_won_revenue: 275000,
    owner_name: 'Michael Kim',
    created_at: new Date(Date.now() - 86400000 * 45).toISOString()
  },
  {
    id: 'acc_3',
    name: 'NovaTech Robotics GmbH',
    industry: 'Factory Robotics & Mechatronics',
    website: 'https://novatech.de',
    phone: '+49 89 555 4321',
    tier: 'Enterprise',
    annual_revenue: 18000000,
    contact_count: 1,
    deal_count: 1,
    total_won_revenue: 0,
    owner_name: 'Sarah Lee',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  }
];

const INITIAL_CONTACTS: CrmContact[] = [
  {
    id: 'con_1',
    account_id: 'acc_1',
    account_name: 'Sharma Engineering Ltd.',
    first_name: 'Rahul',
    last_name: 'Sharma',
    email: 'rahul.sharma@sharmaengg.com',
    phone: '+91 98765 43210',
    title: 'Chief Technical Officer',
    department: 'Engineering',
    is_primary: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'con_2',
    account_id: 'acc_2',
    account_name: 'Apex Industrial Turbines',
    first_name: 'Marcus',
    last_name: 'Vance',
    email: 'marcus.vance@apexturbines.com',
    phone: '+1 415 555 4321',
    title: 'VP of Procurement',
    department: 'Supply Chain',
    is_primary: true,
    created_at: new Date(Date.now() - 86400000 * 45).toISOString()
  },
  {
    id: 'con_3',
    account_id: 'acc_3',
    account_name: 'NovaTech Robotics GmbH',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena@novatech.de',
    phone: '+49 89 555 4321',
    title: 'Head of Automation Solutions',
    department: 'Mechatronics',
    is_primary: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  }
];

const INITIAL_DEALS: CrmDeal[] = [
  {
    id: 'deal_1',
    account_id: 'acc_1',
    account_name: 'Sharma Engineering Ltd.',
    contact_name: 'Rahul Sharma',
    contact_email: 'rahul.sharma@sharmaengg.com',
    name: 'Industrial Compressor 3D Digital Twin Suite',
    amount: 145000,
    currency: 'USD',
    stage: 'Won',
    probability: 100,
    expected_close_date: '2026-10-15',
    actual_close_date: '2026-10-15',
    owner_name: 'Anita Patil',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: 'deal_2',
    account_id: 'acc_2',
    account_name: 'Apex Industrial Turbines',
    contact_name: 'Marcus Vance',
    contact_email: 'marcus.vance@apexturbines.com',
    name: 'Titan 9000 Interactive Assembly Rollout',
    amount: 275000,
    currency: 'USD',
    stage: 'Proposal',
    probability: 60,
    expected_close_date: '2026-12-01',
    next_step: 'Present CAD dimensional step tolerances to engineering committee',
    owner_name: 'Michael Kim',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'deal_3',
    account_id: 'acc_3',
    account_name: 'NovaTech Robotics GmbH',
    contact_name: 'Elena Rostova',
    contact_email: 'elena@novatech.de',
    name: 'Factory Line AR Spatial Layout Simulation',
    amount: 85000,
    currency: 'USD',
    stage: 'Negotiation',
    probability: 80,
    expected_close_date: '2026-11-20',
    next_step: 'Finalize multi-seat WebXR floor plan license',
    owner_name: 'Sarah Lee',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'deal_4',
    account_id: 'acc_1',
    account_name: 'Sharma Engineering Ltd.',
    contact_name: 'Rahul Sharma',
    contact_email: 'rahul.sharma@sharmaengg.com',
    name: 'High-Pressure Hydraulic Valve Expansion',
    amount: 42000,
    currency: 'USD',
    stage: 'Discovery',
    probability: 20,
    expected_close_date: '2027-01-15',
    next_step: 'Schedule discovery demo with field technicians',
    owner_name: 'Anita Patil',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const INITIAL_TASKS: CrmTask[] = [
  {
    id: 'task_1',
    title: 'Review custom CAD STEP export tolerances with Marcus Vance',
    description: 'Verify 0.05mm tolerance verification for Titan 9000 high-pressure housing.',
    task_type: 'call',
    priority: 'Urgent',
    due_date: new Date(Date.now() + 1800000).toISOString(),
    status: 'Pending',
    assigned_name: 'Michael Kim',
    account_name: 'Apex Industrial Turbines',
    deal_name: 'Titan 9000 Interactive Assembly Rollout',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'task_2',
    title: 'Send formal enterprise quote and NDA to NovaTech Robotics',
    description: 'Include 10 floating licenses for factory line AR simulation.',
    task_type: 'quote',
    priority: 'High',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'Pending',
    assigned_name: 'Sarah Lee',
    account_name: 'NovaTech Robotics GmbH',
    deal_name: 'Factory Line AR Spatial Layout Simulation',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'task_3',
    title: 'Follow-up on Industrial Compressor maintenance schedule delivery',
    description: 'Confirm engineering sign-off on 3D exploded view animations.',
    task_type: 'follow_up',
    priority: 'Normal',
    due_date: new Date(Date.now() - 86400000 * 1).toISOString(), // Overdue
    status: 'Pending',
    assigned_name: 'Anita Patil',
    account_name: 'Sharma Engineering Ltd.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

const INITIAL_ENQUIRIES: CrmEnquiry[] = [
  {
    id: 'enq_1',
    account_name: 'Apex Industrial Turbines',
    customer_name: 'Marcus Vance',
    customer_email: 'marcus.vance@apexturbines.com',
    subject: 'WebXR 1:1 scale placement on iPad Pro LiDAR',
    message: 'Can our maintenance crew inspect the turbine model at true 1:1 physical scale using Safari on iPad Pro?',
    category: 'Documentation',
    status: 'In Progress',
    priority: 'High',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'enq_2',
    account_name: 'Sharma Engineering Ltd.',
    customer_name: 'Rahul Sharma',
    customer_email: 'rahul.sharma@sharmaengg.com',
    subject: 'High temperature rating specification sheet request',
    message: 'Please provide certified operating temperature limits for the compressor valve pack.',
    category: 'Contact Support',
    status: 'Open',
    priority: 'Normal',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const INITIAL_DOCUMENTS: CrmDocument[] = [
  {
    id: 'doc_1',
    account_name: 'Apex Industrial Turbines',
    deal_name: 'Titan 9000 Interactive Assembly Rollout',
    file_name: 'Apex_Titan_9000_Commercial_Agreement_v1.pdf',
    file_url: '/uploads/contracts/apex_contract.pdf',
    file_size_bytes: 2450000,
    mime_type: 'application/pdf',
    category: 'contract',
    uploader_name: 'Michael Kim',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'doc_2',
    account_name: 'Sharma Engineering Ltd.',
    file_name: 'Industrial_Compressor_3D_Technical_Specs.pdf',
    file_url: '/uploads/specs/compressor_specs.pdf',
    file_size_bytes: 1840000,
    mime_type: 'application/pdf',
    category: 'specification',
    uploader_name: 'Anita Patil',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

export const useLensStore = create<LensStoreState>((set, get) => ({
  activeView: 'home',
  setActiveView: (view) => set({ activeView: view }),
  homeViewMode: 'overall',
  setHomeViewMode: (mode) => set({ homeViewMode: mode }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),

  filters: DEFAULT_FILTERS,
  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial }
    })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  // CRM State
  accounts: INITIAL_ACCOUNTS,
  contacts: INITIAL_CONTACTS,
  deals: INITIAL_DEALS,
  tasks: INITIAL_TASKS,
  enquiries: INITIAL_ENQUIRIES,
  documents: INITIAL_DOCUMENTS,
  selectedAccountId: null,
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),

  // AI Assistant State
  isAiAssistantOpen: false,
  openAiAssistant: () => set({ isAiAssistantOpen: true }),
  closeAiAssistant: () => set({ isAiAssistantOpen: false }),

  // Automations State
  automations: {
    taskReminders: true,
    overdueAlerts: true,
    autoAssignLeads: true,
    weeklyDigest: true
  },
  updateAutomations: (partial) =>
    set((state) => ({
      automations: { ...state.automations, ...partial }
    })),

  triggerFlowHandoff: async (actionType: string, payload?: any) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    try {
      const res = await fetch('/api/lens/actions/trigger-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ actionType, payload: payload || {} })
      });
      return await res.json();
    } catch (err) {
      console.warn('Flow handoff local simulation applied:', err);
      return { success: true, queued: true, actionType };
    }
  },

  // Live Backend Lens Intelligence state
  overview: null,
  crmOverview: null,
  funnel: [],
  qrAttribution: [],
  hotspots: [],
  isLoadingLive: false,
  liveError: null,

  fetchLiveData: async (token?: string) => {
    const effectiveToken = token || localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    if (!effectiveToken) return;

    set({ isLoadingLive: true, liveError: null });
    try {
      const { api } = await import('../../../services/api');
      const [
        overviewRes,
        crmOverviewRes,
        funnelRes,
        qrRes,
        hotspotsRes,
        leadsRes,
        dealsRes,
        accountsRes,
        contactsRes,
        tasksRes,
        enquiriesRes,
        documentsRes
      ] = await Promise.allSettled([
        api.getLensOverview(effectiveToken),
        api.getCrmOverview(effectiveToken),
        api.getLensFunnel(effectiveToken),
        api.getLensQRAttribution(effectiveToken),
        api.getLensHotspots(effectiveToken),
        api.getLensLeads(effectiveToken),
        api.getCrmDeals(effectiveToken),
        api.getCrmAccounts(effectiveToken),
        api.getCrmContacts(effectiveToken),
        api.getCrmTasks(effectiveToken),
        api.getCrmEnquiries(effectiveToken),
        api.getCrmDocuments(effectiveToken)
      ]);

      const updates: Partial<LensStoreState> = {
        isLoadingLive: false,
        lastSyncTime: new Date().toLocaleTimeString()
      };

      if (overviewRes.status === 'fulfilled' && overviewRes.value) {
        updates.overview = overviewRes.value;
      }
      if (crmOverviewRes.status === 'fulfilled' && crmOverviewRes.value) {
        updates.crmOverview = crmOverviewRes.value;
      }
      if (funnelRes.status === 'fulfilled' && Array.isArray(funnelRes.value)) {
        updates.funnel = funnelRes.value;
      }
      if (qrRes.status === 'fulfilled' && Array.isArray(qrRes.value)) {
        updates.qrAttribution = qrRes.value;
      }
      if (hotspotsRes.status === 'fulfilled' && Array.isArray(hotspotsRes.value)) {
        updates.hotspots = hotspotsRes.value;
      }
      if (leadsRes.status === 'fulfilled' && Array.isArray(leadsRes.value)) {
        const liveLeads: LensLead[] = leadsRes.value.map((l: any) => ({
          id: String(l.id),
          name: l.name || 'Anonymous Prospect',
          company: l.company || l.organization || 'Inbound Prospect',
          email: l.email || '',
          phone: l.phone || '',
          location: l.location || 'Remote',
          productProject: l.product_name || l.project_title || 'General Experience',
          status: (l.status || 'New') as LeadStatus,
          source: (l.source || 'Website') as LeadSource,
          date: l.created_at ? new Date(l.created_at).toLocaleDateString() : 'Recent',
          assignedTo: l.assigned_to_name || 'Unassigned',
          notes: l.notes ? [l.notes] : [],
          tags: Array.isArray(l.tags) ? l.tags : [],
          interestedIn: l.intent || 'Catalog Inquiries',
          activityTimeline: [
            {
              id: `act_${l.id}`,
              type: 'viewed_product',
              description: `Lead submitted via ${l.source || 'Spatial Hub'} with intent ${l.notes || 'Quote'}`,
              timestamp: l.created_at ? new Date(l.created_at).toLocaleString() : 'Recent'
            }
          ]
        }));
        if (liveLeads.length > 0) updates.leads = liveLeads;
      }
      if (dealsRes.status === 'fulfilled' && Array.isArray(dealsRes.value) && dealsRes.value.length > 0) {
        updates.deals = dealsRes.value;
      }
      if (accountsRes.status === 'fulfilled' && Array.isArray(accountsRes.value) && accountsRes.value.length > 0) {
        updates.accounts = accountsRes.value;
      }
      if (contactsRes.status === 'fulfilled' && Array.isArray(contactsRes.value) && contactsRes.value.length > 0) {
        updates.contacts = contactsRes.value;
      }
      if (tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value) && tasksRes.value.length > 0) {
        updates.tasks = tasksRes.value;
      }
      if (enquiriesRes.status === 'fulfilled' && Array.isArray(enquiriesRes.value) && enquiriesRes.value.length > 0) {
        updates.enquiries = enquiriesRes.value;
      }
      if (documentsRes.status === 'fulfilled' && Array.isArray(documentsRes.value) && documentsRes.value.length > 0) {
        updates.documents = documentsRes.value;
      }

      set(updates);
    } catch (err: any) {
      set({ isLoadingLive: false, liveError: err?.message || 'Failed to fetch live analytics' });
    }
  },

  leads: INITIAL_LENS_LEADS,
  selectedLeadId: null,
  isLeadDrawerOpen: false,

  openLeadDrawer: (id) => set({ selectedLeadId: id, isLeadDrawerOpen: true }),
  closeLeadDrawer: () => set({ isLeadDrawerOpen: false }),

  addLead: async (newLeadData) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    const id = `lead_${Date.now()}`;
    const newLead: LensLead = {
      ...newLeadData,
      id,
      activityTimeline: [
        {
          id: `act_${Date.now()}`,
          type: 'status_change',
          description: `Lead created and initialized with status ${newLeadData.status}`,
          timestamp: new Date().toLocaleString()
        }
      ]
    };

    set((state) => ({
      leads: [newLead, ...state.leads],
      selectedLeadId: id,
      isLeadDrawerOpen: true
    }));

    if (token) {
      try {
        const { api } = await import('../../../services/api');
        await api.createCrmAccount(token, {
          name: newLeadData.company,
          phone: newLeadData.phone
        }).catch(() => {});
      } catch (e) {}
    }
  },

  updateLeadStatus: async (id, status) => {
    set((state) => ({
      leads: state.leads.map((l) => {
        if (l.id === id) {
          const updatedTimeline = [
            {
              id: `act_${Date.now()}`,
              type: 'status_change' as const,
              description: `Status updated from ${l.status} to ${status}`,
              timestamp: new Date().toLocaleString()
            },
            ...l.activityTimeline
          ];
          return { ...l, status, activityTimeline: updatedTimeline };
        }
        return l;
      })
    }));

    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    if (token) {
      try {
        await fetch(`/api/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status })
        });
      } catch (e) {}
    }
  },

  assignLead: async (id, assignedTo) => {
    set((state) => ({
      leads: state.leads.map((l) => {
        if (l.id === id) {
          const updatedTimeline = [
            {
              id: `act_${Date.now()}`,
              type: 'status_change' as const,
              description: `Lead reassigned to ${assignedTo}`,
              timestamp: new Date().toLocaleString()
            },
            ...l.activityTimeline
          ];
          return { ...l, assignedTo, activityTimeline: updatedTimeline };
        }
        return l;
      })
    }));
  },

  addLeadNote: async (id, noteText) => {
    if (!noteText.trim()) return;
    set((state) => ({
      leads: state.leads.map((l) => {
        if (l.id === id) {
          const updatedNotes = [...l.notes, noteText.trim()];
          const updatedTimeline = [
            {
              id: `act_${Date.now()}`,
              type: 'note_added' as const,
              description: `Note added: "${noteText.trim()}"`,
              timestamp: new Date().toLocaleString()
            },
            ...l.activityTimeline
          ];
          return { ...l, notes: updatedNotes, activityTimeline: updatedTimeline };
        }
        return l;
      })
    }));
  },

  addLeadTag: (id, tag) => {
    if (!tag.trim()) return;
    set((state) => ({
      leads: state.leads.map((l) => {
        if (l.id === id && !l.tags.includes(tag.trim())) {
          return { ...l, tags: [...l.tags, tag.trim()] };
        }
        return l;
      })
    }));
  },

  deleteLead: async (id) => {
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
      isLeadDrawerOpen: state.selectedLeadId === id ? false : state.isLeadDrawerOpen,
      selectedLeadId: state.selectedLeadId === id ? null : state.selectedLeadId
    }));
  },

  convertLeadToCustomer: async (leadId: string, options: any) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    if (token) {
      const { api } = await import('../../../services/api');
      const result = await api.convertLeadToCustomer(token, leadId, options);
      // Refresh local CRM state
      get().fetchLiveData(token);
      return result;
    }
    return { success: true };
  },

  // Deals
  createDeal: async (data: any) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    let created: CrmDeal;
    if (token) {
      const { api } = await import('../../../services/api');
      created = await api.createCrmDeal(token, data);
    } else {
      created = {
        id: `deal_${Date.now()}`,
        ...data,
        currency: 'USD',
        probability: data.stage === 'Won' ? 100 : 40,
        created_at: new Date().toISOString()
      };
    }
    set((state) => ({ deals: [created, ...state.deals] }));
    return created;
  },

  updateDealStage: async (dealId: string, stage: DealStage, lossReason?: string) => {
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage,
              probability: stage === 'Won' ? 100 : stage === 'Lost' ? 0 : d.probability,
              loss_reason: lossReason || d.loss_reason,
              actual_close_date: stage === 'Won' ? new Date().toISOString().slice(0, 10) : d.actual_close_date
            }
          : d
      )
    }));

    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    if (token) {
      const { api } = await import('../../../services/api');
      await api.updateCrmDealStage(token, dealId, { stage, lossReason }).catch(() => {});
    }
  },

  // Accounts & Contacts
  createAccount: async (data: any) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    let acc: CrmAccount;
    if (token) {
      const { api } = await import('../../../services/api');
      acc = await api.createCrmAccount(token, data);
    } else {
      acc = {
        id: `acc_${Date.now()}`,
        ...data,
        tier: data.tier || 'Standard',
        created_at: new Date().toISOString()
      };
    }
    set((state) => ({ accounts: [acc, ...state.accounts] }));
    return acc;
  },

  createContact: async (data: any) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    let con: CrmContact;
    if (token) {
      const { api } = await import('../../../services/api');
      con = await api.createCrmContact(token, data);
    } else {
      con = {
        id: `con_${Date.now()}`,
        ...data,
        is_primary: Boolean(data.isPrimary),
        created_at: new Date().toISOString()
      };
    }
    set((state) => ({ contacts: [con, ...state.contacts] }));
    return con;
  },

  // Tasks
  createTask: async (data: any) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    let t: CrmTask;
    if (token) {
      const { api } = await import('../../../services/api');
      t = await api.createCrmTask(token, data);
    } else {
      t = {
        id: `task_${Date.now()}`,
        ...data,
        status: 'Pending',
        created_at: new Date().toISOString()
      };
    }
    set((state) => ({ tasks: [t, ...state.tasks] }));
    return t;
  },

  toggleTaskStatus: async (taskId: string) => {
    const current = get().tasks.find((t) => t.id === taskId);
    if (!current) return;
    const nextStatus = current.status === 'Completed' ? 'Pending' : 'Completed';

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: nextStatus,
              completed_at: nextStatus === 'Completed' ? new Date().toISOString() : undefined
            }
          : t
      )
    }));

    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    if (token) {
      const { api } = await import('../../../services/api');
      await api.updateCrmTaskStatus(token, taskId, nextStatus).catch(() => {});
    }
  },

  // Enquiries
  createEnquiry: async (data: any) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    let enq: CrmEnquiry;
    if (token) {
      const { api } = await import('../../../services/api');
      enq = await api.createCrmEnquiry(token, data);
    } else {
      enq = {
        id: `enq_${Date.now()}`,
        ...data,
        status: 'Open',
        priority: data.priority || 'Normal',
        created_at: new Date().toISOString()
      };
    }
    set((state) => ({ enquiries: [enq, ...state.enquiries] }));
    return enq;
  },

  updateEnquiryStatus: async (enquiryId: string, status: string) => {
    set((state) => ({
      enquiries: state.enquiries.map((e) =>
        e.id === enquiryId ? { ...e, status: status as any } : e
      )
    }));

    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    if (token) {
      const { api } = await import('../../../services/api');
      await api.updateCrmEnquiry(token, enquiryId, { status }).catch(() => {});
    }
  },

  // Documents
  createDocument: async (data: any) => {
    const token = localStorage.getItem('i3dion_token') || localStorage.getItem('i3dion.token') || '';
    let doc: CrmDocument;
    if (token) {
      const { api } = await import('../../../services/api');
      doc = await api.createCrmDocument(token, data);
    } else {
      doc = {
        id: `doc_${Date.now()}`,
        ...data,
        file_size_bytes: data.fileSizeBytes || 1024000,
        mime_type: 'application/pdf',
        created_at: new Date().toISOString()
      };
    }
    set((state) => ({ documents: [doc, ...state.documents] }));
    return doc;
  },

  projects: INITIAL_PROJECT_METRICS,
  visualizations: INITIAL_VISUALIZATIONS,

  addVisualization: (visData) => {
    const newVis: LensVisualization = {
      ...visData,
      id: `vis_${Date.now()}`
    };
    set((state) => ({
      visualizations: [...state.visualizations, newVis]
    }));
  },

  updateVisualizationPosition: (id, pos) => {
    set((state) => ({
      visualizations: state.visualizations.map((v) => (v.id === id ? { ...v, position: pos } : v))
    }));
  },

  deleteVisualization: (id) => {
    set((state) => ({
      visualizations: state.visualizations.filter((v) => v.id !== id)
    }));
  },

  datasets: INITIAL_DATASETS,
  savedViews: INITIAL_SAVED_VIEWS,

  saveCurrentView: (name, type) => {
    const currentFilters = get().filters;
    const newSavedView: LensSavedView = {
      id: `sv_${Date.now()}`,
      name,
      type,
      projectName: currentFilters.projectFilter !== 'all' ? currentFilters.projectFilter : undefined,
      createdBy: 'Sales Director',
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      filterState: { ...currentFilters }
    };
    set((state) => ({
      savedViews: [newSavedView, ...state.savedViews]
    }));
  },

  applySavedView: (view) => {
    set({
      filters: { ...view.filterState },
      activeView: view.type === 'Leads Filter' ? 'leads' : 'visualizations'
    });
  },

  deleteSavedView: (id) => {
    set((state) => ({
      savedViews: state.savedViews.filter((sv) => sv.id !== id)
    }));
  },

  reports: INITIAL_REPORTS,

  createReport: (reportData) => {
    const newRep: LensReport = {
      ...reportData,
      id: `rep_${Date.now()}`,
      createdAt: new Date().toLocaleDateString()
    };
    set((state) => ({
      reports: [newRep, ...state.reports]
    }));
  },

  deleteReport: (id) => {
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id)
    }));
  },

  vaultSyncStatus: 'connected',
  lastSyncTime: 'Just now',
  syncNow: () => {
    set({ vaultSyncStatus: 'syncing' });
    setTimeout(() => {
      set({
        vaultSyncStatus: 'connected',
        lastSyncTime: new Date().toLocaleTimeString()
      });
    }, 1200);
  }
}));
