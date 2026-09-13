import { create } from 'zustand';
import {
  ExperienceDocument,
  ExperienceVersionRecord,
  CollaboratorPresence,
  SaveStatus,
  ConflictState,
} from '../types/collaborationTypes';
import { api } from '../../../../services/api';
import { useStudioStore } from '../../store/useStudioStore';

interface CollaborationState {
  currentDocument: ExperienceDocument | null;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  revision: number;
  collaborators: CollaboratorPresence[];
  versions: ExperienceVersionRecord[];
  isVersionHistoryOpen: boolean;
  isPublishModalOpen: boolean;
  isDashboardOpen: boolean;
  conflictState: ConflictState;

  // Actions
  loadExperienceDocument: (id: string) => Promise<boolean>;
  saveCurrentExperience: (changeSummary?: string) => Promise<boolean>;
  publishCurrentExperience: (notes?: string) => Promise<boolean>;
  fetchVersionHistory: () => Promise<void>;
  restoreVersion: (versionId: string) => Promise<boolean>;
  updatePresence: (editingSection?: string) => void;
  openVersionHistory: () => void;
  closeVersionHistory: () => void;
  openPublishModal: () => void;
  closePublishModal: () => void;
  openDashboard: () => void;
  closeDashboard: () => void;
  resolveConflict: (choice: 'reload' | 'keep_local') => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  currentDocument: null,
  saveStatus: 'saved',
  lastSavedAt: null,
  revision: 1,
  collaborators: [],
  versions: [],
  isVersionHistoryOpen: false,
  isPublishModalOpen: false,
  isDashboardOpen: false,
  conflictState: {
    hasConflict: false,
    localRevision: 1,
    serverRevision: 1,
  },

  loadExperienceDocument: async (id) => {
    try {
      set({ saveStatus: 'saving' });
      const doc = await api.getExperience(id);
      if (doc) {
        set({
          currentDocument: doc,
          revision: doc.revision || 1,
          saveStatus: 'saved',
          lastSavedAt: doc.updatedAt,
          conflictState: { hasConflict: false, localRevision: doc.revision || 1, serverRevision: doc.revision || 1 },
        });

        if (doc.serializedExperience) {
          useStudioStore.getState().deserializeExperience(doc.serializedExperience);
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to load experience document:', err);
      set({ saveStatus: 'error' });
    }
    return false;
  },

  saveCurrentExperience: async (changeSummary = 'Auto-saved changes') => {
    const { currentDocument, revision } = get();
    const studioState = useStudioStore.getState();
    const serialized = studioState.serializeExperience();

    set({ saveStatus: 'saving' });

    try {
      const targetId = currentDocument ? currentDocument.id : 'exp_default_01';
      const result = await api.saveExperience(targetId, {
        serializedExperience: serialized,
        expectedRevision: revision,
        changeSummary,
      });

      if (result.conflict) {
        set({
          saveStatus: 'conflict',
          conflictState: {
            hasConflict: true,
            localRevision: revision,
            serverRevision: result.serverRevision,
            serverLastModifiedBy: result.serverLastModifiedBy,
          },
        });
        return false;
      }

      set({
        saveStatus: 'saved',
        lastSavedAt: new Date().toISOString(),
        revision: result.newRevision,
        conflictState: { hasConflict: false, localRevision: result.newRevision, serverRevision: result.newRevision },
      });
      return true;
    } catch (err) {
      console.error('Failed to save experience:', err);
      set({ saveStatus: 'error' });
      return false;
    }
  },

  publishCurrentExperience: async (notes = 'Published new release') => {
    const { currentDocument } = get();
    const targetId = currentDocument ? currentDocument.id : 'exp_default_01';
    set({ saveStatus: 'saving' });

    try {
      const pubResult = await api.publishExperience(targetId, notes);
      if (pubResult) {
        set((state) => ({
          saveStatus: 'saved',
          currentDocument: state.currentDocument
            ? { ...state.currentDocument, status: 'PUBLISHED', publishedVersion: pubResult.publishedVersion }
            : null,
          isPublishModalOpen: false,
        }));
        return true;
      }
    } catch (err) {
      console.error('Failed to publish experience:', err);
      set({ saveStatus: 'error' });
    }
    return false;
  },

  fetchVersionHistory: async () => {
    const { currentDocument } = get();
    const targetId = currentDocument ? currentDocument.id : 'exp_default_01';
    try {
      const versionList = await api.listExperienceVersions(targetId);
      set({ versions: versionList || [] });
    } catch (err) {
      console.error('Failed to fetch version history:', err);
    }
  },

  restoreVersion: async (versionId) => {
    const { currentDocument } = get();
    const targetId = currentDocument ? currentDocument.id : 'exp_default_01';
    try {
      const restoredDoc = await api.restoreExperienceVersion(targetId, versionId);
      if (restoredDoc && restoredDoc.serializedExperience) {
        useStudioStore.getState().deserializeExperience(restoredDoc.serializedExperience);
        set({
          currentDocument: restoredDoc,
          revision: restoredDoc.revision,
          saveStatus: 'saved',
          isVersionHistoryOpen: false,
        });
        return true;
      }
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
    return false;
  },

  updatePresence: (editingSection = 'Canvas') => {
    const { currentDocument } = get();
    const targetId = currentDocument ? currentDocument.id : 'exp_default_01';
    api.updatePresence(targetId, editingSection).then((activeCollaborators) => {
      if (activeCollaborators) {
        set({ collaborators: activeCollaborators });
      }
    });
  },

  openVersionHistory: () => {
    get().fetchVersionHistory();
    set({ isVersionHistoryOpen: true });
  },
  closeVersionHistory: () => set({ isVersionHistoryOpen: false }),

  openPublishModal: () => set({ isPublishModalOpen: true }),
  closePublishModal: () => set({ isPublishModalOpen: false }),

  openDashboard: () => set({ isDashboardOpen: true }),
  closeDashboard: () => set({ isDashboardOpen: false }),

  resolveConflict: (choice) => {
    const { conflictState, currentDocument } = get();
    if (choice === 'reload') {
      if (currentDocument) {
        get().loadExperienceDocument(currentDocument.id);
      }
    } else {
      // Force keep local changes: set revision to serverRevision and save again
      set({ revision: conflictState.serverRevision });
      get().saveCurrentExperience('Forced local change override');
    }
    set({ conflictState: { hasConflict: false, localRevision: 1, serverRevision: 1 } });
  },
}));
