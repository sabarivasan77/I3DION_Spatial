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
  DateRangeOption
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
  | 'analytics'
  | 'projects'
  | 'visualizations'
  | 'reports'
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
  addLead: (lead: Omit<LensLead, 'id' | 'activityTimeline'>) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  assignLead: (id: string, assignedTo: string) => void;
  addLeadNote: (id: string, noteText: string) => void;
  addLeadTag: (id: string, tag: string) => void;
  deleteLead: (id: string) => void;

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

  leads: INITIAL_LENS_LEADS,
  selectedLeadId: null,
  isLeadDrawerOpen: false,

  openLeadDrawer: (id) => set({ selectedLeadId: id, isLeadDrawerOpen: true }),
  closeLeadDrawer: () => set({ isLeadDrawerOpen: false }),

  addLead: (newLeadData) => {
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
  },

  updateLeadStatus: (id, status) => {
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
  },

  assignLead: (id, assignedTo) => {
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

  addLeadNote: (id, noteText) => {
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

  deleteLead: (id) => {
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
      isLeadDrawerOpen: state.selectedLeadId === id ? false : state.isLeadDrawerOpen,
      selectedLeadId: state.selectedLeadId === id ? null : state.selectedLeadId
    }));
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
    const currentFilterState = get().filters;
    const newSavedView: LensSavedView = {
      id: `sv_${Date.now()}`,
      name,
      type,
      createdBy: 'John Doe',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      filterState: { ...currentFilterState }
    };
    set((state) => ({ savedViews: [newSavedView, ...state.savedViews] }));
  },

  applySavedView: (view) => {
    set({ filters: { ...view.filterState }, activeView: 'leads' });
  },

  deleteSavedView: (id) => {
    set((state) => ({ savedViews: state.savedViews.filter((v) => v.id !== id) }));
  },

  reports: INITIAL_REPORTS,

  createReport: (reportData) => {
    const newReport: LensReport = {
      ...reportData,
      id: `rep_${Date.now()}`,
      createdAt: 'Just now'
    };
    set((state) => ({ reports: [newReport, ...state.reports] }));
  },

  deleteReport: (id) => {
    set((state) => ({ reports: state.reports.filter((r) => r.id !== id) }));
  },

  vaultSyncStatus: 'connected',
  lastSyncTime: '2 minutes ago',

  syncNow: () => {
    set({ vaultSyncStatus: 'syncing' });
    setTimeout(() => {
      set({
        vaultSyncStatus: 'connected',
        lastSyncTime: 'Just now'
      });
    }, 1200);
  }
}));
